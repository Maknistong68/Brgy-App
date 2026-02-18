import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { verifyOtp, signInWithPhone } from '@/services/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow single digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Move back on backspace when current field is empty
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getOtpString = (): string => otp.join('');

  const handleVerify = async () => {
    const otpString = getOtpString();

    if (otpString.length !== OTP_LENGTH) {
      setVerifyError('Please enter the complete 6-digit code.');
      return;
    }

    if (!phone) {
      setVerifyError('Phone number is missing. Please go back and try again.');
      return;
    }

    setVerifyError(null);
    setIsSubmitting(true);

    const { error } = await verifyOtp(phone, otpString);

    setIsSubmitting(false);

    if (error) {
      setVerifyError(error.message || 'Invalid code. Please try again.');
      return;
    }

    // On success, the auth listener will detect the session and redirect.
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;

    setCanResend(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setVerifyError(null);

    const { error } = await signInWithPhone(phone);

    if (error) {
      setVerifyError(error.message || 'Failed to resend OTP. Please try again.');
      setCanResend(true);
      setCooldown(0);
    }
  };

  const maskedPhone = phone
    ? phone.replace(/(\+63)(\d{3})(\d{3})(\d{4})/, '$1 $2 *** $4')
    : '';

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
              <Ionicons name="chatbox-outline" size={48} color={colors.primary[600]} />
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.phoneDisplay}>{maskedPhone}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.form}>
            {verifyError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error.main} />
                <Text style={styles.errorBannerText}>{verifyError}</Text>
              </View>
            )}

            <View style={styles.otpContainer}>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    otp[index] ? styles.otpInputFilled : null,
                  ]}
                  value={otp[index]}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  textContentType="oneTimeCode"
                />
              ))}
            </View>

            <Button
              title="Verify"
              onPress={handleVerify}
              loading={isSubmitting}
              disabled={isSubmitting || getOtpString().length !== OTP_LENGTH}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.lg }}
            />

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <Pressable onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </Pressable>
              ) : (
                <Text style={styles.resendCooldown}>
                  Resend code in {cooldown}s
                </Text>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.footerLink}>
                <Ionicons name="arrow-back" size={14} color={colors.primary[600]} />
                {'  '}Change phone number
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
  },
  phoneDisplay: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginTop: spacing.xs,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendLink: {
    fontSize: fontSize.md,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  resendCooldown: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
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
