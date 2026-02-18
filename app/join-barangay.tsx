import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '@/theme';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  searchBarangays,
  getBarangayByJoinCode,
  joinBarangay,
  type BarangaySearchResult,
} from '@/services/barangay';

// ---------------------------------------------------------------------------
// Conditional camera import — expo-camera is not available on web
// ---------------------------------------------------------------------------

let CameraViewComponent: React.ComponentType<any> | null = null;
let useCamPermissions: () => [any, () => Promise<any>] = () => [
  null,
  async () => ({ granted: false }),
];

if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraViewComponent = cam.CameraView;
    useCamPermissions = cam.useCameraPermissions;
  } catch {
    // expo-camera not installed or not linked
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JoinBarangayScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  // Selected barangay for confirmation
  const [selected, setSelected] = useState<BarangaySearchResult | null>(null);
  const [joining, setJoining] = useState(false);

  // QR Scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCamPermissions();
  const scannedRef = useRef(false);

  // Join Code
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeLooking, setCodeLooking] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BarangaySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- QR Scanner ----------

  const openScanner = async () => {
    // On web, QR scanning is not available — expand the join code input instead
    if (Platform.OS === 'web') {
      Toast.show({
        type: 'info',
        text1: 'QR Scanning Unavailable',
        text2: 'QR scanning requires the mobile app. Use a join code instead.',
      });
      setCodeExpanded(true);
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to scan QR codes. Please enable it in Settings.',
        );
        return;
      }
    }
    scannedRef.current = false;
    setScannerOpen(true);
  };

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    // The QR code contains the join code
    const code = data.trim();
    const { data: brgy, error } = await getBarangayByJoinCode(code);

    setScannerOpen(false);

    if (error || !brgy) {
      Toast.show({
        type: 'error',
        text1: 'Not Found',
        text2: 'This QR code does not match any barangay.',
      });
      return;
    }

    setSelected(brgy);
  };

  // ---------- Join Code ----------

  const handleCodeLookup = async () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Join code must be 6 characters.' });
      return;
    }

    setCodeLooking(true);
    const { data: brgy, error } = await getBarangayByJoinCode(code);
    setCodeLooking(false);

    if (error || !brgy) {
      Toast.show({ type: 'error', text1: 'Not Found', text2: 'No barangay matches this code.' });
      return;
    }

    setSelected(brgy);
    setCodeExpanded(false);
    setCodeInput('');
  };

  // ---------- Search ----------

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await searchBarangays(text.trim());
      setSearchResults(data ?? []);
      setSearching(false);
    }, 400);
  }, []);

  const handleSearchSelect = (item: BarangaySearchResult) => {
    setSelected(item);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ---------- Join ----------

  const handleJoin = async () => {
    if (!selected || !profile) return;

    setJoining(true);
    const { data: updatedProfile, error } = await joinBarangay(profile.id, selected.id);
    setJoining(false);

    if (error || !updatedProfile) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Join',
        text2: error?.message ?? 'An unexpected error occurred.',
      });
      return;
    }

    setProfile(updatedProfile as any);
    Toast.show({ type: 'success', text1: 'Welcome!', text2: `You joined ${selected.name}.` });
    router.replace('/(app)/(home)');
  };

  // ---------- Render ----------

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="business" size={48} color={colors.primary[600]} />
            <Text style={styles.title}>Join Your Barangay</Text>
            <Text style={styles.subtitle}>
              To get started, join your barangay using any of the methods below.
            </Text>
          </View>

          {/* Method Cards */}
          <View style={styles.methods}>
            {/* 1. Scan QR Code */}
            <Pressable style={styles.methodCard} onPress={openScanner}>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary[600]} />
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Scan QR Code</Text>
                <Text style={styles.methodDesc}>
                  {Platform.OS === 'web'
                    ? 'Scan the QR poster at your barangay hall (requires mobile app)'
                    : 'Scan the QR poster at your barangay hall'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
            </Pressable>

            {/* 2. Enter Join Code */}
            <Pressable
              style={styles.methodCard}
              onPress={() => setCodeExpanded((v) => !v)}
            >
              <Ionicons name="key-outline" size={24} color={colors.primary[600]} />
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Enter Join Code</Text>
                <Text style={styles.methodDesc}>
                  Type the 6-character code from your barangay
                </Text>
              </View>
              <Ionicons
                name={codeExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.grey[400]}
              />
            </Pressable>

            {codeExpanded && (
              <View style={styles.codeRow}>
                <TextInput
                  style={styles.codeInput}
                  value={codeInput}
                  onChangeText={(t) => setCodeInput(t.toUpperCase().slice(0, 6))}
                  placeholder="e.g. A3F7K2"
                  placeholderTextColor={colors.text.disabled}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  title="Look Up"
                  onPress={handleCodeLookup}
                  loading={codeLooking}
                  size="sm"
                  disabled={codeInput.trim().length !== 6}
                />
              </View>
            )}

            {/* 3. Search Barangay */}
            <Pressable style={styles.methodCard} onPress={() => setSearchOpen(true)}>
              <Ionicons name="search-outline" size={24} color={colors.primary[600]} />
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodTitle}>Search Barangay</Text>
                <Text style={styles.methodDesc}>
                  Find your barangay by name
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.grey[400]} />
            </Pressable>
          </View>

          {/* Confirmation Card */}
          {selected && (
            <View style={styles.confirmCard}>
              <View style={styles.confirmHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                <Text style={styles.confirmTitle}>Confirm Barangay</Text>
              </View>
              <Text style={styles.confirmName}>{selected.name}</Text>
              <Text style={styles.confirmLocation}>
                {selected.municipality}, {selected.province}
              </Text>
              <View style={styles.confirmButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setSelected(null)}
                  variant="outline"
                  size="sm"
                  style={styles.confirmBtn}
                />
                <Button
                  title="Join This Barangay"
                  onPress={handleJoin}
                  loading={joining}
                  size="sm"
                  style={styles.confirmBtn}
                  leftIcon={<Ionicons name="checkmark" size={16} color={colors.white} />}
                />
              </View>
            </View>
          )}
        </View>

        {/* QR Scanner Modal — native only */}
        {Platform.OS !== 'web' && CameraViewComponent && (
          <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
            <SafeAreaView style={styles.scannerContainer}>
              <View style={styles.scannerHeader}>
                <Text style={styles.scannerTitle}>Scan QR Code</Text>
                <Pressable onPress={() => setScannerOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={28} color={colors.text.primary} />
                </Pressable>
              </View>
              <CameraViewComponent
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScan}
              />
              <Text style={styles.scannerHint}>
                Point your camera at the barangay QR code
              </Text>
            </SafeAreaView>
          </Modal>
        )}

        {/* Search Modal */}
        <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}>
          <SafeAreaView style={styles.searchContainer}>
            <View style={styles.searchHeader}>
              <Text style={styles.scannerTitle}>Search Barangay</Text>
              <Pressable
                onPress={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                hitSlop={12}
              >
                <Ionicons name="close" size={28} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={20} color={colors.grey[500]} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Type barangay name..."
                placeholderTextColor={colors.text.disabled}
                autoFocus
              />
              {searching && <ActivityIndicator size="small" color={colors.primary[600]} />}
            </View>

            {searchQuery.trim().length > 0 && searchResults.length === 0 && !searching && (
              <Text style={styles.emptyText}>No barangays found.</Text>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: spacing.xxl }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultItem}
                  onPress={() => handleSearchSelect(item)}
                >
                  <Ionicons name="location-outline" size={20} color={colors.primary[600]} />
                  <View style={styles.resultText}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultLocation}>
                      {item.municipality}, {item.province}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  // Method Cards
  methods: {
    gap: spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  methodDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Code Input
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },

  // Confirmation Card
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: colors.success.main,
    ...shadows.md,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success.main,
  },
  confirmName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  confirmLocation: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmBtn: {
    flex: 1,
  },

  // QR Scanner
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  scannerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  camera: {
    flex: 1,
  },
  scannerHint: {
    textAlign: 'center',
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // Search Modal
  searchContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm + 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: fontSize.md,
    marginTop: spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  resultLocation: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
