import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
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
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { Barangay } from '@/types';
import BarangayQRCode from '@/components/admin/BarangayQRCode';

// ---------------------------------------------------------------------------
// Info Row Sub-component
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[infoRowStyles.row, !isLast && infoRowStyles.rowBorder]}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1.5,
    textAlign: 'right',
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const barangayId = profile?.barangay_id ?? '';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [barangay, setBarangay] = useState<Barangay | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formMunicipality, setFormMunicipality] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formZipCode, setFormZipCode] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // ---------- Data Fetching ----------

  const populateForm = (brgy: Barangay) => {
    setFormName(brgy.name ?? '');
    setFormMunicipality(brgy.municipality ?? '');
    setFormProvince(brgy.province ?? '');
    setFormRegion(brgy.region ?? '');
    setFormZipCode(brgy.zip_code ?? '');
    setFormPhone(brgy.contact_number ?? '');
    setFormEmail(brgy.email ?? '');
    setFormAddress(brgy.address ?? '');
  };

  const fetchBarangay = useCallback(async () => {
    if (!barangayId) return;

    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('*')
        .eq('id', barangayId)
        .single();

      if (error) {
        console.error('Failed to fetch barangay:', error);
        return;
      }

      const brgy = data as Barangay;
      setBarangay(brgy);
      populateForm(brgy);
    } catch (error) {
      console.error('Failed to fetch barangay:', error);
    } finally {
      setLoading(false);
    }
  }, [barangayId]);

  useEffect(() => {
    fetchBarangay();
  }, [fetchBarangay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBarangay();
    setRefreshing(false);
  }, [fetchBarangay]);

  // ---------- Save ----------

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation', 'Barangay name is required.');
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('barangays')
        .update({
          name: formName.trim(),
          municipality: formMunicipality.trim(),
          province: formProvince.trim(),
          region: formRegion.trim(),
          zip_code: formZipCode.trim(),
          contact_number: formPhone.trim() || null,
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', barangayId)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      const updatedBrgy = data as Barangay;
      setBarangay(updatedBrgy);
      setEditing(false);
      Alert.alert('Success', 'Barangay settings updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (barangay) {
      populateForm(barangay);
    }
    setEditing(false);
  };

  // ---------- Render ----------

  if (loading) {
    return <LoadingSpinner label="Loading settings..." />;
  }

  if (!barangay) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.grey[400]} />
        <Text style={styles.errorText}>
          Barangay information not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary[600]]}
          tintColor={colors.primary[600]}
        />
      }
    >
      {/* Barangay Info Card (View Mode) */}
      {!editing && (
        <Card
          header={
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="business"
                  size={22}
                  color={colors.primary[600]}
                />
                <Text style={styles.cardHeaderText}>Barangay Information</Text>
              </View>
              <Pressable onPress={() => setEditing(true)} hitSlop={12}>
                <Ionicons name="create-outline" size={22} color={colors.primary[600]} />
              </Pressable>
            </View>
          }
        >
          <InfoRow label="Name" value={barangay.name} />
          <InfoRow label="Municipality / City" value={barangay.municipality} />
          <InfoRow label="Province" value={barangay.province} />
          <InfoRow label="Region" value={barangay.region} />
          <InfoRow label="ZIP Code" value={barangay.zip_code} />
          <InfoRow label="Phone" value={barangay.contact_number ?? '-'} />
          <InfoRow label="Email" value={barangay.email ?? '-'} />
          <InfoRow label="Address" value={barangay.address ?? '-'} isLast />
        </Card>
      )}

      {/* Join Code & QR Card (View Mode) */}
      {!editing && barangay.join_code && (
        <View style={{ marginTop: spacing.md }}>
          <BarangayQRCode
            barangayId={barangayId}
            joinCode={barangay.join_code}
            onCodeRegenerated={(newCode) =>
              setBarangay((prev) => prev ? { ...prev, join_code: newCode } : prev)
            }
          />
        </View>
      )}

      {/* Edit Mode */}
      {editing && (
        <Card
          header={
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="create"
                  size={22}
                  color={colors.primary[600]}
                />
                <Text style={styles.cardHeaderText}>Edit Information</Text>
              </View>
            </View>
          }
        >
          <Input
            label="Barangay Name"
            value={formName}
            onChangeText={setFormName}
            placeholder="e.g. Barangay San Antonio"
            leftIcon={<Ionicons name="business-outline" size={18} color={colors.text.secondary} />}
          />
          <Input
            label="Municipality / City"
            value={formMunicipality}
            onChangeText={setFormMunicipality}
            placeholder="e.g. Quezon City"
            leftIcon={<Ionicons name="location-outline" size={18} color={colors.text.secondary} />}
          />
          <Input
            label="Province"
            value={formProvince}
            onChangeText={setFormProvince}
            placeholder="e.g. Metro Manila"
          />
          <Input
            label="Region"
            value={formRegion}
            onChangeText={setFormRegion}
            placeholder="e.g. NCR"
          />
          <Input
            label="ZIP Code"
            value={formZipCode}
            onChangeText={setFormZipCode}
            placeholder="e.g. 1100"
            keyboardType="number-pad"
          />
          <Input
            label="Contact Number"
            value={formPhone}
            onChangeText={setFormPhone}
            placeholder="e.g. 09123456789"
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.text.secondary} />}
          />
          <Input
            label="Email"
            value={formEmail}
            onChangeText={setFormEmail}
            placeholder="e.g. brgy@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text.secondary} />}
          />
          <Input
            label="Address"
            value={formAddress}
            onChangeText={setFormAddress}
            placeholder="Full barangay address"
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80, textAlignVertical: 'top' as any }}
          />

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
              leftIcon={
                <Ionicons name="checkmark" size={18} color={colors.white} />
              }
            />
          </View>
        </Card>
      )}
    </ScrollView>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Card header
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
