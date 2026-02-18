import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '@/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { regenerateJoinCode } from '@/services/barangay';

interface BarangayQRCodeProps {
  barangayId: string;
  joinCode: string;
  onCodeRegenerated: (newCode: string) => void;
}

export default function BarangayQRCode({
  barangayId,
  joinCode,
  onCodeRegenerated,
}: BarangayQRCodeProps) {
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(joinCode);
    Toast.show({ type: 'success', text1: 'Copied!', text2: 'Join code copied to clipboard.' });
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Join Code',
      'This will invalidate the current QR code and join code. Anyone who has the old code will no longer be able to use it. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            const { data: newCode, error } = await regenerateJoinCode(barangayId);
            setRegenerating(false);

            if (error || !newCode) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message ?? 'Failed to regenerate code.',
              });
              return;
            }

            onCodeRegenerated(newCode);
            Toast.show({ type: 'success', text1: 'Code Regenerated', text2: `New code: ${newCode}` });
          },
        },
      ],
    );
  };

  return (
    <Card
      header={
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="qr-code" size={22} color={colors.primary[600]} />
            <Text style={styles.headerText}>Join Code & QR</Text>
          </View>
        </View>
      }
    >
      {/* QR Code */}
      <View style={styles.qrWrap}>
        <QRCode value={joinCode} size={180} backgroundColor={colors.white} />
      </View>

      {/* Join Code Display */}
      <Text style={styles.codeLabel}>Join Code</Text>
      <Text style={styles.codeValue}>{joinCode}</Text>
      <Text style={styles.codeHint}>
        Share this code or QR with residents so they can join your barangay.
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Copy Code"
          onPress={handleCopy}
          variant="outline"
          size="sm"
          style={styles.btn}
          leftIcon={<Ionicons name="copy-outline" size={16} color={colors.primary[600]} />}
        />
        <Button
          title="Regenerate"
          onPress={handleRegenerate}
          variant="ghost"
          size="sm"
          loading={regenerating}
          style={styles.btn}
          leftIcon={<Ionicons name="refresh-outline" size={16} color={colors.primary[600]} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  qrWrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  codeLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  codeValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 6,
    marginTop: spacing.xs,
  },
  codeHint: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
  },
});
