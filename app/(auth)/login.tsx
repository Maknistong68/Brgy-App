import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { loginSchema, type LoginFormData } from '@/validations';
import { signInWithEmail, quickSignIn } from '@/services/auth';
import { UserRole } from '@/types';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const QUICK_SIGN_IN_ROLES: { role: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { role: UserRole.RESIDENT, label: 'Resident', icon: 'person' },
  { role: UserRole.STAFF, label: 'Staff', icon: 'briefcase' },
  { role: UserRole.SECRETARY, label: 'Secretary', icon: 'document-text' },
  { role: UserRole.TREASURER, label: 'Treasurer', icon: 'cash' },
  { role: UserRole.CAPTAIN, label: 'Captain', icon: 'shield' },
  { role: UserRole.SYSTEM_ADMIN, label: 'Admin', icon: 'settings' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [quickSignInRole, setQuickSignInRole] = useState<UserRole | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);

    const { error } = await signInWithEmail(data.email, data.password);

    if (error) {
      setLoginError(error.message || 'Invalid email or password. Please try again.');
      return;
    }

    // Navigate to the app on success
    router.replace('/(app)/(home)');
  };

  const handleQuickSignIn = async (role: UserRole) => {
    setLoginError(null);
    setQuickSignInRole(role);

    try {
      const { error } = await quickSignIn(role);

      if (error) {
        setLoginError(error.message || 'Quick sign-in failed.');
        setQuickSignInRole(null);
        return;
      }

      router.replace('/(app)/(home)');
    } catch (e) {
      setLoginError('Quick sign-in failed unexpectedly.');
      setQuickSignInRole(null);
    }
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
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={64} color={colors.primary[600]} />
            </View>
            <Text style={styles.appTitle}>Brgy App</Text>
            <Text style={styles.subtitle}>
              Your barangay services, at your fingertips
            </Text>
          </View>

          {/* Quick Sign-In (mock mode only) */}
          {USE_MOCK && (
            <View style={styles.quickSignInCard}>
              <Text style={styles.quickSignInTitle}>Quick Sign In</Text>
              <Text style={styles.quickSignInSubtitle}>
                Tap a role to instantly sign in as that user
              </Text>
              <View style={styles.roleGrid}>
                {QUICK_SIGN_IN_ROLES.map(({ role, label, icon }) => {
                  const isLoading = quickSignInRole === role;
                  const isDisabled = quickSignInRole !== null;
                  return (
                    <Pressable
                      key={role}
                      style={[
                        styles.roleButton,
                        isDisabled && !isLoading && styles.roleButtonDisabled,
                        isLoading && styles.roleButtonActive,
                      ]}
                      onPress={() => handleQuickSignIn(role)}
                      disabled={isDisabled}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name={icon} size={22} color={isDisabled ? colors.grey[400] : colors.primary[700]} />
                      )}
                      <Text
                        style={[
                          styles.roleButtonText,
                          isLoading && styles.roleButtonTextActive,
                          isDisabled && !isLoading && styles.roleButtonTextDisabled,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.form}>
            {loginError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error.main} />
                <Text style={styles.errorBannerText}>{loginError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color={colors.grey[500]} />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.grey[500]}
                    />
                  }
                />
              )}
            />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              size="lg"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Phone Login */}
            <Button
              title="Sign in with Phone"
              onPress={() => router.push('/(auth)/phone-login')}
              variant="outline"
              fullWidth
              size="lg"
              leftIcon={
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={colors.primary[600]}
                />
              }
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}> Create Account</Text>
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
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Quick Sign In
  quickSignInCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  quickSignInTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  quickSignInSubtitle: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  roleButton: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
    minHeight: 72,
  },
  roleButtonDisabled: {
    opacity: 0.5,
  },
  roleButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[700],
  },
  roleButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginTop: spacing.xs,
  },
  roleButtonTextActive: {
    color: colors.white,
  },
  roleButtonTextDisabled: {
    color: colors.grey[400],
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: fontSize.md,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
