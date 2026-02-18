import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/authStore';
import { useComplaintStore } from '@/stores/complaintStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Badge } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { COMPLAINT_CATEGORY_LABELS } from '@/constants';
import { ComplaintCategory, ComplaintPriority } from '@/types/enums';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['Respondent', 'Details', 'Attachments', 'Review'];

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

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function NewComplaintScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { addComplaint } = useComplaintStore();
  const { showToast } = useUIStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Respondent
  const [respondentName, setRespondentName] = useState('');
  const [respondentAddress, setRespondentAddress] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');

  // Step 2: Details
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);
  const [description, setDescription] = useState('');

  // Step 3: Attachments
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!respondentName.trim()) {
        newErrors.respondentName = 'Respondent name is required';
      }
    }

    if (step === 1) {
      if (!category) {
        newErrors.category = 'Please select a category';
      }
      if (!description.trim()) {
        newErrors.description = 'Description is required';
      } else if (description.trim().length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const newAttachments: AttachmentFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!profile) return;

    setSubmitting(true);
    try {
      const complaintData = {
        barangay_id: profile.barangay_id,
        complainant_id: profile.user_id,
        respondent_name: respondentName.trim(),
        respondent_address: respondentAddress.trim() || null,
        category,
        description: description.trim(),
        priority,
        status: 'submitted',
      };

      const { data, error } = await supabase
        .from('complaints')
        .insert(complaintData)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Upload attachments if any
      if (attachments.length > 0 && data) {
        for (const attachment of attachments) {
          const filePath = `${data.id}/${attachment.name}`;
          await supabase.storage
            .from('complaint-attachments')
            .upload(filePath, {
              uri: attachment.uri,
              name: attachment.name,
              type: attachment.type,
            } as unknown as File);

          const { data: urlData } = supabase.storage
            .from('complaint-attachments')
            .getPublicUrl(filePath);

          await supabase.from('complaint_attachments').insert({
            complaint_id: data.id,
            uploaded_by: profile.id,
            file_name: attachment.name,
            file_url: urlData.publicUrl,
            file_type: attachment.type,
            file_size: attachment.size,
          });
        }
      }

      if (data) {
        addComplaint(data);
      }

      showToast('Complaint filed successfully!', 'success');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {STEPS.map((step, index) => (
        <View key={step} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              index <= currentStep
                ? styles.progressDotActive
                : styles.progressDotInactive,
            ]}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.progressDotText,
                  index <= currentStep && styles.progressDotTextActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.progressLabel,
              index <= currentStep && styles.progressLabelActive,
            ]}
          >
            {step}
          </Text>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.progressLine,
                index < currentStep
                  ? styles.progressLineActive
                  : styles.progressLineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Respondent Information</Text>
      <Text style={styles.stepSubtitle}>
        Provide details about the person you are filing a complaint against.
      </Text>

      <Input
        label="Respondent Name *"
        value={respondentName}
        onChangeText={setRespondentName}
        placeholder="Full name of the respondent"
        error={errors.respondentName}
        leftIcon={<Ionicons name="person-outline" size={18} color={colors.text.secondary} />}
      />

      <Input
        label="Respondent Address"
        value={respondentAddress}
        onChangeText={setRespondentAddress}
        placeholder="Address of the respondent"
        leftIcon={<Ionicons name="location-outline" size={18} color={colors.text.secondary} />}
      />

      <Input
        label="Respondent Phone"
        value={respondentPhone}
        onChangeText={setRespondentPhone}
        placeholder="Contact number (optional)"
        keyboardType="phone-pad"
        leftIcon={<Ionicons name="call-outline" size={18} color={colors.text.secondary} />}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Complaint Details</Text>
      <Text style={styles.stepSubtitle}>
        Select a category and describe your complaint.
      </Text>

      {/* Category Grid */}
      <Text style={styles.fieldLabel}>Category *</Text>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.categoryCard,
              category === cat.key && styles.categoryCardSelected,
            ]}
            onPress={() => setCategory(cat.key)}
          >
            <Ionicons
              name={(CATEGORY_ICONS[cat.key] ?? 'ellipsis-horizontal-outline') as any}
              size={24}
              color={
                category === cat.key ? colors.primary[700] : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.categoryLabel,
                category === cat.key && styles.categoryLabelSelected,
              ]}
              numberOfLines={2}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Priority */}
      <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p.key}
            style={[
              styles.priorityChip,
              {
                borderColor: priority === p.key ? p.color : colors.border,
                backgroundColor: priority === p.key ? p.color + '15' : colors.white,
              },
            ]}
            onPress={() => setPriority(p.key)}
          >
            <View
              style={[styles.priorityDot, { backgroundColor: p.color }]}
            />
            <Text
              style={[
                styles.priorityText,
                { color: priority === p.key ? p.color : colors.text.secondary },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Description */}
      <Input
        label="Description *"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your complaint in detail (minimum 20 characters)..."
        multiline
        numberOfLines={6}
        error={errors.description}
        inputStyle={{ minHeight: 120, textAlignVertical: 'top' as any }}
      />
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Attachments</Text>
      <Text style={styles.stepSubtitle}>
        Add photos or evidence to support your complaint (optional).
      </Text>

      <Pressable style={styles.uploadButton} onPress={pickImage}>
        <Ionicons name="cloud-upload-outline" size={32} color={colors.primary[600]} />
        <Text style={styles.uploadText}>Tap to upload images</Text>
        <Text style={styles.uploadSubtext}>JPG, PNG up to 10MB each</Text>
      </Pressable>

      {attachments.length > 0 && (
        <View style={styles.attachmentList}>
          {attachments.map((file, index) => (
            <View key={`${file.name}-${index}`} style={styles.attachmentPreviewContainer}>
              <Image
                source={{ uri: file.uri }}
                style={styles.attachmentPreviewImage}
                resizeMode="cover"
              />
              <Pressable
                style={styles.removeAttachmentOverlay}
                onPress={() => removeAttachment(index)}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </Pressable>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {file.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>
        Please review your complaint before submitting.
      </Text>

      <Card header="Respondent Information" style={{ marginBottom: spacing.md }}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{respondentName}</Text>
        </View>
        {respondentAddress ? (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Address:</Text>
            <Text style={styles.reviewValue}>{respondentAddress}</Text>
          </View>
        ) : null}
        {respondentPhone ? (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Phone:</Text>
            <Text style={styles.reviewValue}>{respondentPhone}</Text>
          </View>
        ) : null}
      </Card>

      <Card header="Complaint Details" style={{ marginBottom: spacing.md }}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Category:</Text>
          <Badge
            label={getCategoryLabel(category ?? '')}
            variant="info"
            size="sm"
          />
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Priority:</Text>
          <Badge
            label={
              PRIORITIES.find((p) => p.key === priority)?.label ?? 'Medium'
            }
            variant={
              priority === 'urgent' || priority === 'high'
                ? 'error'
                : priority === 'medium'
                ? 'warning'
                : 'success'
            }
            size="sm"
          />
        </View>
        <View style={[styles.reviewRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <Text style={styles.reviewLabel}>Description:</Text>
          <Text style={styles.reviewValue}>{description}</Text>
        </View>
      </Card>

      {attachments.length > 0 && (
        <Card header={`Attachments (${attachments.length})`}>
          <View style={styles.reviewAttachmentList}>
            {attachments.map((file, index) => (
              <Image
                key={`review-${index}`}
                source={{ uri: file.uri }}
                style={styles.reviewAttachmentPreview}
                resizeMode="contain"
              />
            ))}
          </View>
        </Card>
      )}
    </View>
  );

  const getCategoryLabel = (cat: string): string => {
    return COMPLAINT_CATEGORY_LABELS[cat] ?? cat;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderProgressBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={{ flex: 1, marginRight: spacing.sm }}
          />
        )}
        {currentStep < STEPS.length - 1 ? (
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title="Submit Complaint"
            onPress={handleSubmit}
            variant="primary"
            loading={submitting}
            style={{ flex: 1 }}
            leftIcon={
              <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary[600],
  },
  progressDotInactive: {
    backgroundColor: colors.grey[300],
  },
  progressDotText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  progressDotTextActive: {
    color: colors.white,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginLeft: 4,
    marginRight: 4,
  },
  progressLabelActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  progressLine: {
    width: 16,
    height: 2,
    marginHorizontal: 2,
  },
  progressLineActive: {
    backgroundColor: colors.primary[600],
  },
  progressLineInactive: {
    backgroundColor: colors.grey[300],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.md,
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
  uploadButton: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginTop: spacing.sm,
  },
  uploadSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  attachmentList: {
    gap: spacing.md,
  },
  attachmentPreviewContainer: {
    position: 'relative',
  },
  attachmentPreviewImage: {
    width: SCREEN_WIDTH - 32,
    height: Math.min((SCREEN_WIDTH - 32) * 0.75, 300),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.grey[200],
  },
  removeAttachmentOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  reviewLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    minWidth: 80,
  },
  reviewValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  reviewAttachmentList: {
    gap: spacing.md,
  },
  reviewAttachmentPreview: {
    width: SCREEN_WIDTH - 64,
    height: Math.min((SCREEN_WIDTH - 64) * 0.75, 300),
    borderRadius: borderRadius.md,
    backgroundColor: colors.grey[200],
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});
