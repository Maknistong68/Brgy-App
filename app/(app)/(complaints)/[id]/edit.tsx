import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { updateComplaint } from '@/services/complaint';
import { Card, Button, Input, Badge, LoadingSpinner } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { COMPLAINT_CATEGORY_LABELS } from '@/constants';
import { ComplaintCategory, ComplaintPriority } from '@/types/enums';
import type { ComplaintWithRelations } from '@/types';

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const editComplaintSchema = z.object({
  respondent_name: z
    .string()
    .min(1, 'Respondent name is required')
    .max(200, 'Name is too long'),
  respondent_address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
  respondent_phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  category: z.nativeEnum(ComplaintCategory, {
    error: 'Please select a category',
  }),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description is too long'),
  priority: z.nativeEnum(ComplaintPriority),
});

type EditComplaintFormData = z.infer<typeof editComplaintSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = Object.entries(COMPLAINT_CATEGORY_LABELS).map(([key, label]) => ({
  key: key as ComplaintCategory,
  label,
}));

const PRIORITIES: { key: ComplaintPriority; label: string; color: string }[] = [
  { key: ComplaintPriority.LOW, label: 'Low', color: colors.priority.low },
  { key: ComplaintPriority.MEDIUM, label: 'Medium', color: colors.priority.medium },
  { key: ComplaintPriority.HIGH, label: 'High', color: colors.priority.high },
  { key: ComplaintPriority.URGENT, label: 'Urgent', color: colors.priority.urgent },
];

const CATEGORY_ICONS: Record<string, string> = {
  noise: 'volume-high-outline',
  property_dispute: 'home-outline',
  domestic: 'people-outline',
  theft: 'lock-closed-outline',
  vandalism: 'hammer-outline',
  public_disturbance: 'warning-outline',
  boundary_dispute: 'resize-outline',
  financial_dispute: 'cash-outline',
  other: 'ellipsis-horizontal-outline',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function EditComplaintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useUIStore();

  const [complaint, setComplaint] = useState<ComplaintWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditComplaintFormData>({
    resolver: zodResolver(editComplaintSchema),
    defaultValues: {
      respondent_name: '',
      respondent_address: '',
      respondent_phone: '',
      category: ComplaintCategory.OTHER,
      description: '',
      priority: ComplaintPriority.MEDIUM,
    },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  // -------------------------------------------------------------------------
  // Fetch complaint
  // -------------------------------------------------------------------------

  const fetchComplaint = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data) {
        const c = data as ComplaintWithRelations;
        setComplaint(c);
        reset({
          respondent_name: c.respondent_name ?? '',
          respondent_address: c.respondent_address ?? '',
          respondent_phone: '',
          category: c.category,
          description: c.description ?? '',
          priority: c.priority,
        });
      }
    } catch (err) {
      console.error('Failed to fetch complaint:', err);
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const onSubmit = async (formData: EditComplaintFormData) => {
    if (!id) return;

    setSubmitting(true);
    try {
      const { error } = await updateComplaint(id, {
        respondent_name: formData.respondent_name.trim(),
        respondent_address: formData.respondent_address?.trim() || undefined,
        category: formData.category,
        description: formData.description.trim(),
        priority: formData.priority,
      } as any);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      showToast('Complaint updated successfully', 'success');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update complaint');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

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

  // Only allow editing when the status is 'submitted'
  const isEditable = complaint.status === 'submitted';

  if (!isEditable) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.readOnlyCard}>
            <View style={styles.readOnlyIconRow}>
              <Ionicons name="lock-closed-outline" size={40} color={colors.grey[400]} />
            </View>
            <Text style={styles.readOnlyTitle}>Editing Not Available</Text>
            <Text style={styles.readOnlyMessage}>
              This complaint can no longer be edited because its status has progressed
              beyond "Submitted". Only complaints with a "Submitted" status can be
              modified.
            </Text>
            <Text style={styles.readOnlyStatus}>
              Current status:{' '}
              <Text style={{ fontWeight: fontWeight.bold }}>
                {complaint.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </Text>
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="primary"
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>Edit Complaint</Text>
        <Text style={styles.stepSubtitle}>
          Update the respondent information and complaint details below.
        </Text>

        {/* Respondent Information */}
        <Card header="Respondent Information" style={styles.sectionCard}>
          <Controller
            control={control}
            name="respondent_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Respondent Name *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Full name of the respondent"
                error={errors.respondent_name?.message}
                leftIcon={
                  <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="respondent_address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Respondent Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Address of the respondent"
                error={errors.respondent_address?.message}
                leftIcon={
                  <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="respondent_phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Respondent Phone"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Contact number (optional)"
                keyboardType="phone-pad"
                error={errors.respondent_phone?.message}
                leftIcon={
                  <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
                }
              />
            )}
          />
        </Card>

        {/* Category */}
        <Card header="Category *" style={styles.sectionCard}>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category.message}</Text>
          )}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.key && styles.categoryCardSelected,
                ]}
                onPress={() => setValue('category', cat.key, { shouldDirty: true })}
              >
                <Ionicons
                  name={
                    (CATEGORY_ICONS[cat.key] ?? 'ellipsis-horizontal-outline') as any
                  }
                  size={24}
                  color={
                    selectedCategory === cat.key
                      ? colors.primary[700]
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.key && styles.categoryLabelSelected,
                  ]}
                  numberOfLines={2}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Priority */}
        <Card header="Priority" style={styles.sectionCard}>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.key}
                style={[
                  styles.priorityChip,
                  {
                    borderColor:
                      selectedPriority === p.key ? p.color : colors.border,
                    backgroundColor:
                      selectedPriority === p.key ? p.color + '15' : colors.white,
                  },
                ]}
                onPress={() => setValue('priority', p.key, { shouldDirty: true })}
              >
                <View
                  style={[styles.priorityDot, { backgroundColor: p.color }]}
                />
                <Text
                  style={[
                    styles.priorityText,
                    {
                      color:
                        selectedPriority === p.key
                          ? p.color
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Description */}
        <Card header="Description *" style={styles.sectionCard}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Describe your complaint in detail (minimum 20 characters)..."
                multiline
                numberOfLines={6}
                error={errors.description?.message}
                inputStyle={{ minHeight: 120, textAlignVertical: 'top' as any }}
              />
            )}
          />
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title="Save Changes"
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          loading={submitting}
          disabled={!isDirty}
          style={{ flex: 1 }}
          leftIcon={
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
          }
        />
      </View>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 80,
    justifyContent: 'center',
  },
  categoryCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  categoryLabelSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  // Read-only state
  readOnlyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  readOnlyIconRow: {
    marginBottom: spacing.md,
  },
  readOnlyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  readOnlyMessage: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  readOnlyStatus: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
