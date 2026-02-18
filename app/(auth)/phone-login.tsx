import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { signInWithPhone } from '@/services/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+63|0)(9\d{9})$/,
      'Enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567)',
    ),
});

type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;

export default function PhoneLoginScreen() {
  const router = useRouter();
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: '',
    },
  });

  const normalizePhone = (phone: string): string => {
    // Convert 09xx to +639xx format for Supabase
    if (phone.startsWith('0')) {
      return '+63' + phone.slice(1);
    }
    return phone;
  };

  const onSubmit = async (data: PhoneLoginFormData) => {
    setPhoneError(null);

    const normalizedPhone = normalizePhone(data.phone);
    const { error } = await signInWithPhone(normalizedPhone);

    if (error) {
      setPhoneError(error.message || 'Failed to send OTP. Please try again.');
      return;
    }

    // Navigate to OTP verification with the phone number
    router.push({
      pathname: '/(auth)/verify-otp',
      params: { phone: normalizedPhone },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="phone-portrait-outline"
                size={48}
                color={colors.primary[600]}
              />
            </View>
            <Text style={styles.title}>Phone Login</Text>
            <Text style={styles.subtitle}>
              We'll send a one-time verification code to your Philippine mobile number.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {phoneError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error.main} />
                <Text style={styles.errorBannerText}>{phoneError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="09171234567"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  helperText="Format: 09XXXXXXXXX or +639XXXXXXXXX"
                  leftIcon={
                    <Ionicons name="call-outline" size={20} color={colors.grey[500]} />
                  }
                />
              )}
            />

            <Button
              title="Send OTP"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>
                <Ionicons name="mail-outline" size={14} color={colors.primary[600]} />
                {'  '}Sign in with email instead
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  form: {
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error.main,
  },
  errorBannerText: {
    fontSize: fontSize.sm,
    color: colors.error.main,
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    fontSize: fontSize.md,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
