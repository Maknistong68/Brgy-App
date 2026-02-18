import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  RefreshControl,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import {
  getHearings,
  getHearingById,
  createHearing,
  addAttendee,
  updateAttendee,
} from '@/services/hearing';
import { PermissionGate } from '@/components/layout/PermissionGate';
import {
  Card,
  Button,
  Badge,
  StatusBadge,
  LoadingSpinner,
  Divider,
  BottomSheet,
} from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDate, formatDateTime, getStatusLabel } from '@/utils/format';
import type { HearingWithRelations, HearingAttendee, Profile } from '@/types';
import { HearingStatus } from '@/types/enums';

// ---------------------------------------------------------------------------
// Hearing Status Colors
// ---------------------------------------------------------------------------

const HEARING_STATUS_COLORS: Record<string, string> = {
  scheduled: colors.status.submitted,
  in_progress: colors.status.in_progress,
  completed: colors.status.resolved,
  cancelled: colors.status.rejected,
  postponed: colors.status.under_review,
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HearingScreen() {
  const { id: complaintId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isRoleAtLeast } = usePermissions();
  const { showToast } = useUIStore();

  const isSecretary = isRoleAtLeast('secretary');

  const [hearings, setHearings] = useState<HearingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleVenue, setScheduleVenue] = useState('');
  const [scheduleOfficerId, setScheduleOfficerId] = useState('');
  const [scheduleAgenda, setScheduleAgenda] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Hearing detail state
  const [selectedHearing, setSelectedHearing] = useState<HearingWithRelations | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add attendee state
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeRole, setAttendeeRole] = useState('');
  const [addingAttendee, setAddingAttendee] = useState(false);

  // Staff list for presiding officer dropdown
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [showOfficerPicker, setShowOfficerPicker] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch hearings
  // -------------------------------------------------------------------------

  const fetchHearings = useCallback(async () => {
    if (!complaintId) return;
    try {
      const result = await getHearings(complaintId);
      if (result.data) {
        setHearings(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch hearings:', err);
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  const fetchStaffList = useCallback(async () => {
    if (!profile?.barangay_id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('barangay_id', profile.barangay_id)
        .in('role', ['staff', 'secretary', 'treasurer', 'captain'])
        .order('last_name', { ascending: true });

      if (data) {
        setStaffList(data as any);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  }, [profile?.barangay_id]);

  useEffect(() => {
    fetchHearings();
    if (isSecretary) {
      fetchStaffList();
    }
  }, [fetchHearings, fetchStaffList, isSecretary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHearings();
    setRefreshing(false);
  }, [fetchHearings]);

  // -------------------------------------------------------------------------
  // Schedule hearing
  // -------------------------------------------------------------------------

  const handleScheduleHearing = async () => {
    if (!complaintId || !profile) return;

    if (!scheduleDate.trim()) {
      Alert.alert('Validation', 'Please enter a date (YYYY-MM-DD).');
      return;
    }
    if (!scheduleTime.trim()) {
      Alert.alert('Validation', 'Please enter a time (HH:MM).');
      return;
    }
    if (!scheduleVenue.trim()) {
      Alert.alert('Validation', 'Please enter a venue/location.');
      return;
    }
    if (!scheduleOfficerId) {
      Alert.alert('Validation', 'Please select a presiding officer.');
      return;
    }

    setScheduling(true);
    try {
      const result = await createHearing({
        complaint_id: complaintId,
        barangay_id: profile.barangay_id!,
        scheduled_date: scheduleDate.trim(),
        scheduled_time: scheduleTime.trim(),
        venue: scheduleVenue.trim(),
        presiding_officer_id: scheduleOfficerId,
        notes: scheduleAgenda.trim() || undefined,
      });

      if (result.error) {
        Alert.alert('Error', result.error.message);
        return;
      }

      showToast('Hearing scheduled successfully', 'success');
      setShowScheduleForm(false);
      resetScheduleForm();
      await fetchHearings();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to schedule hearing');
    } finally {
      setScheduling(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleDate('');
    setScheduleTime('');
    setScheduleVenue('');
    setScheduleOfficerId('');
    setScheduleAgenda('');
  };

  // -------------------------------------------------------------------------
  // Hearing detail
  // -------------------------------------------------------------------------

  const handleSelectHearing = async (hearing: HearingWithRelations) => {
    setLoadingDetail(true);
    setShowDetail(true);
    try {
      const result = await getHearingById(hearing.id);
      if (result.data) {
        setSelectedHearing(result.data);
      } else {
        setSelectedHearing(hearing);
      }
    } catch {
      setSelectedHearing(hearing);
    } finally {
      setLoadingDetail(false);
    }
  };

  // -------------------------------------------------------------------------
  // Attendee management
  // -------------------------------------------------------------------------

  const handleAddAttendee = async () => {
    if (!selectedHearing || !attendeeName.trim() || !attendeeRole.trim()) {
      Alert.alert('Validation', 'Please enter both name and role.');
      return;
    }

    setAddingAttendee(true);
    try {
      // We use the name as a search to find the profile, or use a dummy profile_id
      // For simplicity, add attendee by inserting directly
      const { data, error } = await supabase
        .from('hearing_attendees')
        .insert({
          hearing_id: selectedHearing.id,
          profile_id: profile?.id ?? '',
          role: `${attendeeRole.trim()} - ${attendeeName.trim()}`,
          is_present: false,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Refresh the hearing detail
      const result = await getHearingById(selectedHearing.id);
      if (result.data) {
        setSelectedHearing(result.data);
      }

      setAttendeeName('');
      setAttendeeRole('');
      setShowAddAttendee(false);
      showToast('Attendee added', 'success');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to add attendee');
    } finally {
      setAddingAttendee(false);
    }
  };

  const handleToggleAttendance = async (attendee: HearingAttendee & { profile?: Profile }) => {
    try {
      const result = await updateAttendee(attendee.id, {
        is_present: !attendee.is_present,
      });

      if (result.error) {
        Alert.alert('Error', result.error.message);
        return;
      }

      // Update local state
      if (selectedHearing) {
        setSelectedHearing({
          ...selectedHearing,
          attendees: selectedHearing.attendees?.map((a) =>
            a.id === attendee.id ? { ...a, is_present: !a.is_present } : a,
          ),
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return <LoadingSpinner label="Loading hearings..." />;
  }

  const selectedOfficer = staffList.find((s) => s.id === scheduleOfficerId);

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
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Hearings</Text>
          <Text style={styles.headerSubtitle}>
            {hearings.length} hearing{hearings.length !== 1 ? 's' : ''} scheduled
          </Text>
        </View>

        {/* Schedule Button - Secretary+ only */}
        <PermissionGate module="complaints" action="create" minimumRole="secretary">
          <Button
            title="Schedule Hearing"
            onPress={() => setShowScheduleForm(true)}
            variant="primary"
            fullWidth
            leftIcon={<Ionicons name="add-circle-outline" size={18} color={colors.white} />}
            style={{ marginBottom: spacing.md }}
          />
        </PermissionGate>

        {/* Hearings List */}
        {hearings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="calendar-outline" size={48} color={colors.grey[300]} />
              <Text style={styles.emptyTitle}>No Hearings Yet</Text>
              <Text style={styles.emptySubtitle}>
                No hearings have been scheduled for this complaint.
              </Text>
            </View>
          </Card>
        ) : (
          hearings.map((hearing) => (
            <Pressable
              key={hearing.id}
              onPress={() => handleSelectHearing(hearing)}
            >
              <Card style={styles.hearingCard}>
                <View style={styles.hearingHeader}>
                  <View style={styles.hearingDateBlock}>
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={colors.primary[600]}
                    />
                    <Text style={styles.hearingDate}>
                      {formatDate(hearing.scheduled_date, 'MMM d, yyyy')}
                    </Text>
                    <Text style={styles.hearingTime}>{hearing.scheduled_time}</Text>
                  </View>
                  <HearingStatusBadge status={hearing.status} />
                </View>

                <Divider />

                <View style={styles.hearingBody}>
                  <View style={styles.hearingInfoRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.hearingInfoText}>{hearing.venue}</Text>
                  </View>
                  {hearing.presiding_officer && (
                    <View style={styles.hearingInfoRow}>
                      <Ionicons
                        name="person-circle-outline"
                        size={14}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.hearingInfoText}>
                        {hearing.presiding_officer.first_name}{' '}
                        {hearing.presiding_officer.last_name}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.hearingFooter}>
                  <Text style={styles.viewDetailText}>Tap to view details</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.text.secondary}
                  />
                </View>
              </Card>
            </Pressable>
          ))
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Schedule Hearing Bottom Sheet */}
      <BottomSheet
        visible={showScheduleForm}
        onClose={() => {
          setShowScheduleForm(false);
          resetScheduleForm();
        }}
        title="Schedule Hearing"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
          >
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                value={scheduleDate}
                onChangeText={setScheduleDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.disabled}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Time *</Text>
              <TextInput
                value={scheduleTime}
                onChangeText={setScheduleTime}
                placeholder="HH:MM (e.g. 09:00)"
                placeholderTextColor={colors.text.disabled}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Location / Venue *</Text>
              <TextInput
                value={scheduleVenue}
                onChangeText={setScheduleVenue}
                placeholder="e.g. Barangay Hall, Room 3"
                placeholderTextColor={colors.text.disabled}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Presiding Officer *</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setShowOfficerPicker(true)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !selectedOfficer && { color: colors.text.disabled },
                  ]}
                >
                  {selectedOfficer
                    ? `${selectedOfficer.first_name} ${selectedOfficer.last_name}`
                    : 'Select a staff member'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Agenda / Notes</Text>
              <TextInput
                value={scheduleAgenda}
                onChangeText={setScheduleAgenda}
                placeholder="Describe the agenda for this hearing..."
                placeholderTextColor={colors.text.disabled}
                multiline
                style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
              />
            </View>

            <Button
              title="Schedule Hearing"
              onPress={handleScheduleHearing}
              variant="primary"
              loading={scheduling}
              fullWidth
              leftIcon={
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
              }
              style={{ marginTop: spacing.sm }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Officer Picker Bottom Sheet */}
      <BottomSheet
        visible={showOfficerPicker}
        onClose={() => setShowOfficerPicker(false)}
        title="Select Presiding Officer"
      >
        <ScrollView style={{ maxHeight: 300 }}>
          {staffList.map((staff) => (
            <Pressable
              key={staff.id}
              style={styles.officerOption}
              onPress={() => {
                setScheduleOfficerId(staff.id);
                setShowOfficerPicker(false);
              }}
            >
              <View style={styles.officerInfo}>
                <Ionicons name="person-outline" size={18} color={colors.text.primary} />
                <Text style={styles.officerName}>
                  {staff.first_name} {staff.last_name}
                </Text>
                <Badge
                  label={staff.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  variant="default"
                  size="sm"
                />
              </View>
              {scheduleOfficerId === staff.id && (
                <Ionicons name="checkmark" size={20} color={colors.primary[600]} />
              )}
            </Pressable>
          ))}
          {staffList.length === 0 && (
            <Text style={styles.emptySubtitle}>No staff members found.</Text>
          )}
        </ScrollView>
      </BottomSheet>

      {/* Hearing Detail Bottom Sheet */}
      <BottomSheet
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedHearing(null);
        }}
        title="Hearing Details"
      >
        {loadingDetail ? (
          <LoadingSpinner label="Loading details..." />
        ) : selectedHearing ? (
          <ScrollView
            style={{ maxHeight: 450 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedHearing.scheduled_date, 'MMMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>{selectedHearing.scheduled_time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>Venue:</Text>
                <Text style={styles.detailValue}>{selectedHearing.venue}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="flag-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailLabel}>Status:</Text>
                <HearingStatusBadge status={selectedHearing.status} />
              </View>
              {selectedHearing.presiding_officer && (
                <View style={styles.detailRow}>
                  <Ionicons name="person-circle-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.detailLabel}>Officer:</Text>
                  <Text style={styles.detailValue}>
                    {selectedHearing.presiding_officer.first_name}{' '}
                    {selectedHearing.presiding_officer.last_name}
                  </Text>
                </View>
              )}
            </View>

            {/* Agenda / Notes */}
            {selectedHearing.notes && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Agenda</Text>
                <Text style={styles.detailBlockContent}>{selectedHearing.notes}</Text>
              </View>
            )}

            {/* Minutes */}
            {selectedHearing.minutes && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Minutes</Text>
                <Text style={styles.detailBlockContent}>{selectedHearing.minutes}</Text>
              </View>
            )}

            {/* Outcome / Resolution */}
            {selectedHearing.outcome && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>Resolution / Outcome</Text>
                <Text style={styles.detailBlockContent}>{selectedHearing.outcome}</Text>
              </View>
            )}

            {/* Attendees */}
            <Divider />
            <View style={styles.attendeeSection}>
              <View style={styles.attendeeHeader}>
                <Text style={styles.detailBlockTitle}>
                  Attendees ({selectedHearing.attendees?.length ?? 0})
                </Text>
                {isSecretary && (
                  <Pressable
                    style={styles.addAttendeeBtn}
                    onPress={() => setShowAddAttendee(true)}
                  >
                    <Ionicons name="person-add-outline" size={16} color={colors.primary[600]} />
                    <Text style={styles.addAttendeeBtnText}>Add</Text>
                  </Pressable>
                )}
              </View>

              {selectedHearing.attendees && selectedHearing.attendees.length > 0 ? (
                selectedHearing.attendees.map((attendee) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    <View style={styles.attendeeInfo}>
                      <Ionicons
                        name={attendee.is_present ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={
                          attendee.is_present
                            ? colors.success.main
                            : colors.grey[400]
                        }
                      />
                      <View style={styles.attendeeTextBlock}>
                        <Text style={styles.attendeeName}>
                          {attendee.profile
                            ? `${attendee.profile.first_name} ${attendee.profile.last_name}`
                            : 'Unknown'}
                        </Text>
                        <Text style={styles.attendeeRoleText}>{attendee.role}</Text>
                      </View>
                    </View>
                    {isSecretary && (
                      <Switch
                        value={attendee.is_present}
                        onValueChange={() => handleToggleAttendance(attendee)}
                        trackColor={{
                          false: colors.grey[300],
                          true: colors.primary[200],
                        }}
                        thumbColor={
                          attendee.is_present
                            ? colors.success.main
                            : colors.grey[100]
                        }
                      />
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubtitle}>No attendees recorded yet.</Text>
              )}
            </View>

            {/* Add Attendee Form */}
            {showAddAttendee && (
              <View style={styles.addAttendeeForm}>
                <Divider />
                <Text style={styles.formLabel}>Add Attendee</Text>
                <TextInput
                  value={attendeeName}
                  onChangeText={setAttendeeName}
                  placeholder="Attendee name"
                  placeholderTextColor={colors.text.disabled}
                  style={styles.formInput}
                />
                <TextInput
                  value={attendeeRole}
                  onChangeText={setAttendeeRole}
                  placeholder="Role (e.g. Complainant, Respondent, Witness)"
                  placeholderTextColor={colors.text.disabled}
                  style={[styles.formInput, { marginTop: spacing.sm }]}
                />
                <View style={styles.addAttendeeActions}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowAddAttendee(false);
                      setAttendeeName('');
                      setAttendeeRole('');
                    }}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1, marginRight: spacing.sm }}
                  />
                  <Button
                    title="Add"
                    onPress={handleAddAttendee}
                    variant="primary"
                    size="sm"
                    loading={addingAttendee}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}

            <View style={{ height: spacing.lg }} />
          </ScrollView>
        ) : null}
      </BottomSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hearing Status Badge Component
// ---------------------------------------------------------------------------

function HearingStatusBadge({ status }: { status: string }) {
  const bgColor = HEARING_STATUS_COLORS[status] ?? colors.grey[500];
  const label = getStatusLabel(status);

  return (
    <View style={[hearingBadgeStyles.badge, { backgroundColor: bgColor + '1A' }]}>
      <View style={[hearingBadgeStyles.dot, { backgroundColor: bgColor }]} />
      <Text style={[hearingBadgeStyles.label, { color: bgColor }]}>{label}</Text>
    </View>
  );
}

const hearingBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  headerSection: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  // Hearing cards
  hearingCard: {
    marginBottom: spacing.sm,
  },
  hearingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hearingDateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hearingDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  hearingTime: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  hearingBody: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  hearingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hearingInfoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  hearingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  viewDetailText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  // Empty state
  emptyCard: {
    marginBottom: spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Form fields
  formField: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 48,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  pickerText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    flex: 1,
  },
  // Officer picker
  officerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  officerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  officerName: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  // Detail sheet
  detailSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    minWidth: 55,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  detailBlock: {
    marginBottom: spacing.md,
  },
  detailBlockTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detailBlockContent: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 22,
    backgroundColor: colors.grey[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  // Attendees
  attendeeSection: {
    marginTop: spacing.md,
  },
  attendeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addAttendeeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
  },
  addAttendeeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  attendeeTextBlock: {
    flex: 1,
  },
  attendeeName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  attendeeRoleText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  // Add attendee form
  addAttendeeForm: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  addAttendeeActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});
