import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { updateProfile } from '@/services/profile';
import { profileSchema, type ProfileFormData } from '@/validations';
import { Button, Input } from '@/components/ui';
import { colors, spacing, fontSize, fontWeight } from '@/theme';
import { Gender, CivilStatus } from '@/types/enums';

const GENDER_OPTIONS = [
  { key: Gender.MALE, label: 'Male' },
  { key: Gender.FEMALE, label: 'Female' },
  { key: Gender.OTHER, label: 'Other' },
  { key: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
];

const CIVIL_STATUS_OPTIONS = [
  { key: CivilStatus.SINGLE, label: 'Single' },
  { key: CivilStatus.MARRIED, label: 'Married' },
  { key: CivilStatus.WIDOWED, label: 'Widowed' },
  { key: CivilStatus.SEPARATED, label: 'Separated' },
  { key: CivilStatus.DIVORCED, label: 'Divorced' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const { showToast } = useUIStore();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      middleName: profile?.middle_name ?? '',
      phone: profile?.phone ?? '',
      gender: (profile?.gender as any) ?? 'male',
      birthDate: profile?.date_of_birth ?? '',
      civilStatus: (profile?.civil_status as any) ?? 'single',
      address: profile?.address ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { data: updatedProfile, error } = await updateProfile(profile.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName ?? undefined,
        phone: data.phone ?? undefined,
        gender: data.gender as any,
        date_of_birth: data.birthDate,
        civil_status: data.civilStatus as any,
        address: data.address,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (updatedProfile) {
        setProfile(updatedProfile as any);
      }

      showToast('Profile updated successfully!', 'success');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="First Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Your first name"
              error={errors.firstName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Last Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Your last name"
              error={errors.lastName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="middleName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Middle Name"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Your middle name (optional)"
              error={errors.middleName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="09171234567"
              keyboardType="phone-pad"
              error={errors.phone?.message}
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.text.secondary} />}
            />
          )}
        />

        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
          Personal Details
        </Text>

        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Date of Birth *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="YYYY-MM-DD"
              error={errors.birthDate?.message}
              leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />}
            />
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Gender *</Text>
              <View style={styles.optionRow}>
                {GENDER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.optionChip,
                      value === option.key && styles.optionChipSelected,
                    ]}
                    onPress={() => onChange(option.key)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        value === option.key && styles.optionChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="civilStatus"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Civil Status *</Text>
              <View style={styles.optionRow}>
                {CIVIL_STATUS_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.optionChip,
                      value === option.key && styles.optionChipSelected,
                    ]}
                    onPress={() => onChange(option.key)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        value === option.key && styles.optionChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.civilStatus && (
                <Text style={styles.errorText}>{errors.civilStatus.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Address *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Your complete address"
              multiline
              numberOfLines={3}
              error={errors.address?.message}
              inputStyle={{ minHeight: 80, textAlignVertical: 'top' as any }}
              leftIcon={<Ionicons name="location-outline" size={18} color={colors.text.secondary} />}
            />
          )}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          fullWidth
          loading={saving}
          leftIcon={<Ionicons name="checkmark" size={18} color={colors.white} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Pressable needed for inline usage
import { Pressable } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionChipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  optionChipText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  optionChipTextSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});
