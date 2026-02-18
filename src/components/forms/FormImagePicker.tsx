import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

interface FormImagePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  maxImages?: number;
  containerStyle?: ViewStyle;
}

const THUMBNAIL_SIZE = 88;

export function FormImagePicker<T extends FieldValues>({
  control,
  name,
  label,
  maxImages = 5,
  containerStyle,
}: FormImagePickerProps<T>) {
  const requestPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload images.',
      );
      return false;
    }
    return true;
  };

  const pickImage = async (currentImages: string[], onChange: (value: string[]) => void) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (currentImages.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxImages - currentImages.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      const combined = [...currentImages, ...newUris].slice(0, maxImages);
      onChange(combined);
    }
  };

  const takePhoto = async (currentImages: string[], onChange: (value: string[]) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take photos.',
      );
      return;
    }

    if (currentImages.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      onChange([...currentImages, result.assets[0].uri].slice(0, maxImages));
    }
  };

  const removeImage = (currentImages: string[], index: number, onChange: (value: string[]) => void) => {
    const updated = currentImages.filter((_, i) => i !== index);
    onChange(updated);
  };

  const showPickerOptions = (currentImages: string[], onChange: (value: string[]) => void) => {
    Alert.alert('Add Image', 'Choose a source', [
      { text: 'Camera', onPress: () => takePhoto(currentImages, onChange) },
      { text: 'Photo Library', onPress: () => pickImage(currentImages, onChange) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const images: string[] = Array.isArray(value) ? value : [];
        const hasError = !!error;
        const canAddMore = images.length < maxImages;

        return (
          <View style={[styles.container, containerStyle]}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, hasError && styles.labelError]}>
                {label}
              </Text>
              <Text style={styles.counter}>
                {images.length}/{maxImages}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeImage(images, index, onChange)}
                    hitSlop={4}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.error.main} />
                  </Pressable>
                </View>
              ))}

              {canAddMore && (
                <Pressable
                  style={styles.addButton}
                  onPress={() => showPickerOptions(images, onChange)}
                >
                  <Ionicons name="add" size={32} color={colors.grey[500]} />
                  <Text style={styles.addText}>Add</Text>
                </Pressable>
              )}
            </ScrollView>

            {hasError && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  labelError: {
    color: colors.error.main,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: borderRadius.md,
    backgroundColor: colors.grey[200],
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  addButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey[50],
  },
  addText: {
    fontSize: fontSize.xs,
    color: colors.grey[500],
    marginTop: 2,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
});
