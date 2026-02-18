import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '@/theme';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BottomSheet from '@/components/ui/BottomSheet';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnnouncementsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPublished, setFormPublished] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  // ---------- Data Fetching ----------

  const fetchAnnouncements = useCallback(async () => {
    if (!barangayId) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('barangay_id', barangayId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch announcements:', error);
        return;
      }

      setAnnouncements((data ?? []) as Announcement[]);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [barangayId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }, [fetchAnnouncements]);

  // ---------- Form Helpers ----------

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormPublished(false);
    setFormExpiresAt('');
    setEditingAnnouncement(null);
  };

  const openCreateSheet = () => {
    resetForm();
    setSheetVisible(true);
  };

  const openEditSheet = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setFormPublished(announcement.is_published);
    setFormExpiresAt(announcement.expires_at ?? '');
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    resetForm();
  };

  // ---------- CRUD Operations ----------

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!formContent.trim()) {
      Alert.alert('Validation', 'Content is required.');
      return;
    }
    if (!profile) return;

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: formTitle.trim(),
        content: formContent.trim(),
        is_published: formPublished,
        expires_at: formExpiresAt.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (formPublished && !editingAnnouncement?.published_at) {
        payload.published_at = new Date().toISOString();
      }

      if (editingAnnouncement) {
        // Update
        const { data, error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncement.id)
          .select()
          .single();

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingAnnouncement.id ? (data as Announcement) : a)),
        );
        Alert.alert('Success', 'Announcement updated.');
      } else {
        // Create
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            ...payload,
            barangay_id: barangayId,
            author_id: profile.id,
            is_pinned: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        setAnnouncements((prev) => [data as Announcement, ...prev]);
        Alert.alert('Success', 'Announcement created.');
      }

      closeSheet();
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingAnnouncement) return;

    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const { error } = await supabase
              .from('announcements')
              .delete()
              .eq('id', editingAnnouncement.id);

            setSaving(false);

            if (error) {
              Alert.alert('Error', error.message);
              return;
            }

            setAnnouncements((prev) =>
              prev.filter((a) => a.id !== editingAnnouncement.id),
            );
            closeSheet();
            Alert.alert('Deleted', 'Announcement has been deleted.');
          },
        },
      ],
    );
  };

  // ---------- Renders ----------

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Announcement }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => openEditSheet(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Badge
          label={item.is_published ? 'Published' : 'Draft'}
          variant={item.is_published ? 'success' : 'warning'}
          size="sm"
        />
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
        </View>
        {item.expires_at && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
            <Text style={styles.metaText}>Expires: {formatDate(item.expires_at)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  if (loading) {
    return <LoadingSpinner label="Loading announcements..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          announcements.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="megaphone-outline" size={48} color={colors.grey[400]} />}
            title="No announcements yet"
            description="Create your first announcement to keep residents informed."
            actionLabel="Create Announcement"
            onAction={openCreateSheet}
          />
        }
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={openCreateSheet}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Create / Edit Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={closeSheet}
        title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Input
            label="Title"
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder="Announcement title"
          />

          <Input
            label="Content"
            value={formContent}
            onChangeText={setFormContent}
            placeholder="Write your announcement content..."
            multiline
            numberOfLines={5}
            inputStyle={{ minHeight: 120, textAlignVertical: 'top' as any }}
          />

          <Input
            label="Expires At (YYYY-MM-DD)"
            value={formExpiresAt}
            onChangeText={setFormExpiresAt}
            placeholder="e.g. 2026-03-31 (optional)"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Published</Text>
            <Switch
              value={formPublished}
              onValueChange={setFormPublished}
              trackColor={{
                false: colors.grey[300],
                true: colors.primary[200],
              }}
              thumbColor={formPublished ? colors.primary[600] : colors.grey[400]}
            />
          </View>

          <Button
            title={editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: spacing.md }}
          />

          {editingAnnouncement && (
            <Button
              title="Delete Announcement"
              onPress={handleDelete}
              variant="danger"
              loading={saving}
              fullWidth
              style={{ marginTop: spacing.sm }}
              leftIcon={
                <Ionicons name="trash-outline" size={16} color={colors.white} />
              }
            />
          )}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl + 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Announcement Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  cardContent: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabPressed: {
    backgroundColor: colors.primary[700],
    transform: [{ scale: 0.95 }],
  },

  // Form
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
});
