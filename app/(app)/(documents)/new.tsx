import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Badge } from '@/components/ui';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { DOCUMENT_TYPE_LABELS } from '@/constants';
import { DocumentType } from '@/types/enums';
import { formatCurrency, getDocumentTypeLabel } from '@/utils/format';

const STEPS = ['Type', 'Details', 'Purpose & Fee', 'Review'];

const DOC_TYPES = Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => ({
  key: key as DocumentType,
  label,
}));

const DOC_TYPE_ICONS: Record<string, string> = {
  barangay_clearance: 'shield-checkmark-outline',
  barangay_id: 'card-outline',
  certificate_of_residency: 'home-outline',
  certificate_of_indigency: 'heart-outline',
  business_clearance: 'briefcase-outline',
  cedula: 'document-outline',
  other: 'ellipsis-horizontal-outline',
};

const DEFAULT_FEES: Record<string, number> = {
  barangay_clearance: 50,
  barangay_id: 100,
  certificate_of_residency: 50,
  certificate_of_indigency: 0,
  business_clearance: 200,
  cedula: 50,
  other: 50,
};

export default function NewDocumentRequestScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { addDocument } = useDocumentStore();
  const { showToast } = useUIStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Document Type
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  // Step 2: Dynamic form data
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Step 3: Purpose & fee
  const [purpose, setPurpose] = useState('');
  const [fee, setFee] = useState(0);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load fee when doc type changes
  useEffect(() => {
    if (documentType) {
      const loadFee = async () => {
        if (!profile?.barangay_id) return;
        const { data } = await supabase
          .from('document_fee_schedules')
          .select('fee')
          .eq('barangay_id', profile.barangay_id)
          .eq('document_type', documentType)
          .eq('is_active', true)
          .single();

        if (data) {
          setFee(data.fee);
        } else {
          setFee(DEFAULT_FEES[documentType] ?? 50);
        }
      };
      loadFee();
    }
  }, [documentType, profile?.barangay_id]);

  const getFormFieldsForType = (type: DocumentType | null): { key: string; label: string; placeholder: string; required?: boolean }[] => {
    if (!type) return [];

    switch (type) {
      case DocumentType.BARANGAY_CLEARANCE:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'clearance_purpose', label: 'Clearance Purpose', placeholder: 'e.g., Employment, Travel' },
        ];
      case DocumentType.BUSINESS_CLEARANCE:
        return [
          { key: 'business_name', label: 'Business Name', placeholder: 'Name of your business', required: true },
          { key: 'business_address', label: 'Business Address', placeholder: 'Full address of business', required: true },
          { key: 'business_nature', label: 'Nature of Business', placeholder: 'e.g., Sari-sari store, Restaurant' },
          { key: 'owner_name', label: 'Owner Name', placeholder: 'Full name of the owner' },
        ];
      case DocumentType.CERTIFICATE_OF_RESIDENCY:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'years_of_residency', label: 'Years of Residency', placeholder: 'How many years living in barangay' },
        ];
      case DocumentType.CERTIFICATE_OF_INDIGENCY:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'reason', label: 'Reason for Request', placeholder: 'e.g., Medical assistance, Educational' },
        ];
      case DocumentType.BARANGAY_ID:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'emergency_contact', label: 'Emergency Contact', placeholder: 'Name and phone number' },
        ];
      case DocumentType.CEDULA:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'annual_income', label: 'Annual Income', placeholder: 'Approximate annual income' },
        ];
      default:
        return [
          { key: 'full_name', label: 'Full Name', placeholder: 'Your complete name', required: true },
          { key: 'details', label: 'Additional Details', placeholder: 'Provide relevant details' },
        ];
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!documentType) {
        newErrors.documentType = 'Please select a document type';
      }
    }

    if (step === 1) {
      const fields = getFormFieldsForType(documentType);
      for (const field of fields) {
        if (field.required && !formData[field.key]?.trim()) {
          newErrors[field.key] = `${field.label} is required`;
        }
      }
    }

    if (step === 2) {
      if (!purpose.trim()) {
        newErrors.purpose = 'Purpose is required';
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

  const updateFormField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!profile || !documentType) return;

    setSubmitting(true);
    try {
      const requestData = {
        barangay_id: profile.barangay_id,
        requestor_id: profile.user_id,
        document_type: documentType,
        form_data: formData,
        purpose: purpose.trim(),
        status: 'submitted',
        payment_status: fee === 0 ? 'waived' : 'pending',
        amount: fee,
      };

      const { data, error } = await supabase
        .from('document_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data) {
        addDocument(data);
      }

      showToast('Document request submitted!', 'success');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to submit request');
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
      <Text style={styles.stepTitle}>Select Document Type</Text>
      <Text style={styles.stepSubtitle}>
        Choose the type of document you need from the barangay.
      </Text>
      {errors.documentType && (
        <Text style={styles.errorText}>{errors.documentType}</Text>
      )}
      <View style={styles.typeGrid}>
        {DOC_TYPES.map((docType) => (
          <Pressable
            key={docType.key}
            style={[
              styles.typeCard,
              documentType === docType.key && styles.typeCardSelected,
            ]}
            onPress={() => {
              setDocumentType(docType.key);
              setFormData({});
            }}
          >
            <Ionicons
              name={(DOC_TYPE_ICONS[docType.key] ?? 'document-outline') as any}
              size={28}
              color={
                documentType === docType.key
                  ? colors.primary[700]
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.typeLabel,
                documentType === docType.key && styles.typeLabelSelected,
              ]}
              numberOfLines={2}
            >
              {docType.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => {
    const fields = getFormFieldsForType(documentType);

    return (
      <View>
        <Text style={styles.stepTitle}>Document Details</Text>
        <Text style={styles.stepSubtitle}>
          Fill in the required information for your{' '}
          {getDocumentTypeLabel(documentType ?? '')}.
        </Text>

        {fields.map((field) => (
          <Input
            key={field.key}
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={formData[field.key] ?? ''}
            onChangeText={(text) => updateFormField(field.key, text)}
            placeholder={field.placeholder}
            error={errors[field.key]}
          />
        ))}
      </View>
    );
  };

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Purpose & Fee</Text>
      <Text style={styles.stepSubtitle}>
        State the purpose for your document request.
      </Text>

      <Input
        label="Purpose *"
        value={purpose}
        onChangeText={setPurpose}
        placeholder="What do you need this document for?"
        multiline
        numberOfLines={4}
        error={errors.purpose}
        inputStyle={{ minHeight: 100, textAlignVertical: 'top' as any }}
      />

      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.feeRow}>
          <View>
            <Text style={styles.feeLabel}>Processing Fee</Text>
            <Text style={styles.feeSubtext}>
              {getDocumentTypeLabel(documentType ?? '')}
            </Text>
          </View>
          <Text style={styles.feeAmount}>
            {fee === 0 ? 'FREE' : formatCurrency(fee)}
          </Text>
        </View>
        {fee > 0 && (
          <Text style={styles.feeNote}>
            Payment is to be made at the barangay office. Please bring exact
            change if possible.
          </Text>
        )}
      </Card>
    </View>
  );

  const renderStep4 = () => {
    const fields = getFormFieldsForType(documentType);

    return (
      <View>
        <Text style={styles.stepTitle}>Review & Submit</Text>
        <Text style={styles.stepSubtitle}>
          Please review your request details before submitting.
        </Text>

        <Card
          header="Document Type"
          style={{ marginBottom: spacing.md }}
        >
          <Badge
            label={getDocumentTypeLabel(documentType ?? '')}
            variant="primary"
          />
        </Card>

        <Card header="Form Details" style={{ marginBottom: spacing.md }}>
          {fields.map((field) => (
            <View key={field.key} style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{field.label}:</Text>
              <Text style={styles.reviewValue}>
                {formData[field.key] || 'N/A'}
              </Text>
            </View>
          ))}
        </Card>

        <Card header="Purpose & Fee" style={{ marginBottom: spacing.md }}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Purpose:</Text>
            <Text style={styles.reviewValue}>{purpose}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Fee:</Text>
            <Text style={[styles.reviewValue, { fontWeight: fontWeight.bold }]}>
              {fee === 0 ? 'FREE' : formatCurrency(fee)}
            </Text>
          </View>
        </Card>
      </View>
    );
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

      {/* Navigation */}
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
            title="Submit Request"
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
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginBottom: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 100,
    justifyContent: 'center',
  },
  typeCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  typeLabelSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  feeSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  feeAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  feeNote: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  navigationButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});
