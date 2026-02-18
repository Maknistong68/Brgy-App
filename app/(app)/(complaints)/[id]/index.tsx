import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useComplaintStore } from '@/stores/complaintStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/constants';
import * as complaintService from '@/services/complaint';
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  PriorityBadge,
  LoadingSpinner,
  Divider,
  BottomSheet,
} from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDateTime, getCategoryLabel, getStatusLabel } from '@/utils/format';
import { getNextComplaintStatuses } from '@/utils/status';
import type { ComplaintWithRelations, ComplaintComment, ComplaintAttachment } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { updateComplaint } = useComplaintStore();
  const { isStaff, isSecretary } = usePermissions();
  const { showToast } = useUIStore();

  const [complaint, setComplaint] = useState<ComplaintWithRelations | null>(null);
  const [comments, setComments] = useState<(ComplaintComment & { author?: { first_name: string; last_name: string } })[]>([]);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status change sheet
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchComplaint = useCallback(async () => {
    if (!id) return;
    try {
      const [complaintRes, commentsRes, attachmentsRes] = await Promise.all([
        supabase
          .from('complaints')
          .select('*, complainant:profiles!complainant_id(*), assigned_staff:profiles!assigned_to(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('complaint_comments')
          .select('*, author:profiles!author_id(first_name, last_name)')
          .eq('complaint_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('complaint_attachments')
          .select('*')
          .eq('complaint_id', id),
      ]);

      if (complaintRes.data) {
        setComplaint(complaintRes.data as any);
      }
      if (commentsRes.data) {
        setComments(commentsRes.data as any);
      }
      if (attachmentsRes.data) {
        setAttachments(attachmentsRes.data as any);
      }
    } catch (err) {
      console.error('Failed to fetch complaint:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComplaint();
    setRefreshing(false);
  }, [fetchComplaint]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !profile || !complaint) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('complaint_comments')
        .insert({
          complaint_id: complaint.id,
          author_id: profile.id,
          content: commentText.trim(),
          is_internal: isInternal,
        })
        .select('*, author:profiles!author_id(first_name, last_name)')
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setComments((prev) => [...prev, data as any]);
      setCommentText('');
      setIsInternal(false);
      showToast('Comment added', 'success');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!complaint || !profile) return;

    setChangingStatus(true);
    try {
      const { data, error } = await complaintService.updateComplaintStatus(
        complaint.id,
        newStatus as any,
        profile.id,
      );

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data) {
        setComplaint((prev) => (prev ? { ...prev, ...data } : null));
        updateComplaint(complaint.id, data);
      }
      setStatusSheetVisible(false);
      showToast(`Status changed to ${getStatusLabel(newStatus)}`, 'success');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!complaint || !profile) return;

    Alert.alert(
      'Assign to Yourself',
      'Do you want to assign this complaint to yourself?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            const { error } = await supabase
              .from('complaints')
              .update({ assigned_to: profile.id })
              .eq('id', complaint.id);

            if (!error) {
              setComplaint((prev) =>
                prev ? { ...prev, assigned_to: profile.id } : null,
              );
              showToast('Complaint assigned to you', 'success');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading complaint..." />;
  }

  if (!complaint) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.grey[400]} />
        <Text style={styles.notFoundText}>Complaint not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  // Filter available status transitions by role
  const allNextStatuses = getNextComplaintStatuses(complaint.status);
  const nextStatuses = allNextStatuses.filter((status) => {
    // Only secretary+ can reject
    if (status === 'rejected' && !isSecretary) return false;
    return true;
  });
  const complainant = complaint.complainant;
  const assignedStaff = complaint.assigned_staff;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
          />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.referenceNumber}>{complaint.reference_number}</Text>
            <StatusBadge status={complaint.status} />
          </View>
          <View style={styles.badgeRow}>
            <Badge label={getCategoryLabel(complaint.category)} variant="info" size="sm" />
            <PriorityBadge priority={complaint.priority} size="sm" />
          </View>
        </Card>

        {/* Info Cards */}
        <Card header="Complainant" style={styles.infoCard}>
          {complainant ? (
            <>
              <InfoRow
                icon="person-outline"
                label="Name"
                value={`${complainant.first_name} ${complainant.last_name}`}
              />
              {complainant.phone && (
                <InfoRow icon="call-outline" label="Phone" value={complainant.phone} />
              )}
              {complainant.address && (
                <InfoRow icon="location-outline" label="Address" value={complainant.address} />
              )}
            </>
          ) : (
            <Text style={styles.mutedText}>Information unavailable</Text>
          )}
        </Card>

        <Card header="Respondent" style={styles.infoCard}>
          <InfoRow icon="person-outline" label="Name" value={complaint.respondent_name} />
          {complaint.respondent_address && (
            <InfoRow icon="location-outline" label="Address" value={complaint.respondent_address} />
          )}
        </Card>

        <Card header="Details" style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label="Filed on"
            value={formatDateTime(complaint.created_at)}
          />
          <InfoRow
            icon="refresh-outline"
            label="Last updated"
            value={formatDateTime(complaint.updated_at)}
          />
          {assignedStaff && (
            <InfoRow
              icon="person-circle-outline"
              label="Assigned to"
              value={`${assignedStaff.first_name} ${assignedStaff.last_name}`}
            />
          )}
          {complaint.resolved_at && (
            <InfoRow
              icon="checkmark-circle-outline"
              label="Resolved at"
              value={formatDateTime(complaint.resolved_at)}
            />
          )}
          <Divider />
          <Text style={styles.descriptionHeader}>Description</Text>
          <Text style={styles.descriptionBody}>{complaint.description}</Text>
          {complaint.resolution_notes && (
            <>
              <Divider />
              <Text style={styles.descriptionHeader}>Resolution Notes</Text>
              <Text style={styles.descriptionBody}>{complaint.resolution_notes}</Text>
            </>
          )}
        </Card>

        {/* Staff Actions */}
        {isStaff && nextStatuses.length > 0 && (
          <Card header="Actions" style={styles.infoCard}>
            <View style={styles.actionsRow}>
              {!complaint.assigned_to && (
                <Button
                  title="Assign to Me"
                  onPress={handleAssign}
                  variant="outline"
                  size="sm"
                  leftIcon={<Ionicons name="person-add-outline" size={16} color={colors.primary[600]} />}
                />
              )}
              <Button
                title="Change Status"
                onPress={() => setStatusSheetVisible(true)}
                variant="primary"
                size="sm"
                leftIcon={<Ionicons name="swap-horizontal-outline" size={16} color={colors.white} />}
              />
            </View>
          </Card>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card header={`Attachments (${attachments.length})`} style={styles.infoCard}>
            <View style={styles.attachmentGallery}>
              {attachments.map((att) => {
                const { data: urlData } = supabase.storage
                  .from(STORAGE_BUCKETS.COMPLAINT_ATTACHMENTS)
                  .getPublicUrl(att.file_path);
                return (
                  <View key={att.id} style={styles.attachmentPreviewContainer}>
                    <Image
                      source={{ uri: urlData.publicUrl }}
                      style={styles.attachmentPreviewImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                      {att.file_name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Quick Links */}
        <View style={styles.linksRow}>
          <Pressable
            style={styles.linkButton}
            onPress={() => router.push(`/(app)/(complaints)/${id}/history` as any)}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary[600]} />
            <Text style={styles.linkText}>View History</Text>
          </Pressable>
          {isSecretary && (
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push(`/(app)/(complaints)/${id}/hearing` as any)}
            >
              <Ionicons name="people-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.linkText}>Hearings</Text>
            </Pressable>
          )}
        </View>

        {/* Comments Section */}
        <Card header="Comments" style={styles.infoCard}>
          {comments.length > 0 ? (
            comments
              .filter((c) => (!isStaff ? !c.is_internal : true))
              .map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.author
                        ? `${comment.author.first_name} ${comment.author.last_name}`
                        : 'Unknown'}
                    </Text>
                    {comment.is_internal && (
                      <Badge label="Internal" variant="warning" size="sm" />
                    )}
                  </View>
                  <Text style={styles.commentBody}>{comment.content}</Text>
                  <Text style={styles.commentTime}>
                    {formatDateTime(comment.created_at)}
                  </Text>
                </View>
              ))
          ) : (
            <Text style={styles.mutedText}>No comments yet</Text>
          )}

          <Divider />

          {/* Add Comment */}
          <View style={styles.commentInput}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor={colors.text.disabled}
              multiline
              style={styles.commentTextInput}
            />
            {isStaff && (
              <View style={styles.internalToggle}>
                <Text style={styles.internalLabel}>Internal</Text>
                <Switch
                  value={isInternal}
                  onValueChange={setIsInternal}
                  trackColor={{ false: colors.grey[300], true: colors.primary[200] }}
                  thumbColor={isInternal ? colors.primary[600] : colors.grey[100]}
                />
              </View>
            )}
            <Button
              title="Post Comment"
              onPress={handleAddComment}
              variant="primary"
              size="sm"
              loading={submittingComment}
              disabled={!commentText.trim()}
              fullWidth
            />
          </View>
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Status Change Bottom Sheet */}
      <BottomSheet
        visible={statusSheetVisible}
        onClose={() => setStatusSheetVisible(false)}
        title="Change Status"
      >
        {nextStatuses.map((status) => (
          <Pressable
            key={status}
            style={styles.statusOption}
            onPress={() => handleStatusChange(status)}
            disabled={changingStatus}
          >
            <StatusBadge status={status} />
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </Pressable>
        ))}
        {nextStatuses.length === 0 && (
          <Text style={styles.mutedText}>
            No further status transitions available.
          </Text>
        )}
      </BottomSheet>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons name={icon as any} size={16} color={colors.text.secondary} />
      <Text style={infoRowStyles.label}>{label}:</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    minWidth: 70,
  },
  value: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
  },
  headerCard: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  referenceNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  infoCard: {
    marginBottom: spacing.sm,
  },
  mutedText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  descriptionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  descriptionBody: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  attachmentGallery: {
    gap: spacing.md,
  },
  attachmentPreviewContainer: {
    alignItems: 'center',
  },
  attachmentPreviewImage: {
    width: SCREEN_WIDTH - 64,
    height: Math.min((SCREEN_WIDTH - 64) * 0.75, 300),
    borderRadius: borderRadius.md,
    backgroundColor: colors.grey[200],
  },
  attachmentPreviewName: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  commentItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  commentBody: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  commentInput: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  commentTextInput: {
    backgroundColor: colors.grey[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  internalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  internalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
