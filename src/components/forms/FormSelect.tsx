import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  containerStyle?: ViewStyle;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select an option',
  options,
  containerStyle,
}: FormSelectProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find((opt) => opt.value === value);
        const hasError = !!error;

        return (
          <View style={[styles.container, containerStyle]}>
            {label && (
              <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
            )}

            <Pressable
              style={[
                styles.selectButton,
                hasError && styles.selectButtonError,
              ]}
              onPress={() => setModalVisible(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !selectedOption && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.grey[500]}
              />
            </Pressable>

            {hasError && <Text style={styles.errorText}>{error.message}</Text>}

            <Modal
              visible={modalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setModalVisible(false)}
            >
              <Pressable
                style={styles.overlay}
                onPress={() => setModalVisible(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{label}</Text>
                    <Pressable
                      onPress={() => setModalVisible(false)}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={24} color={colors.text.primary} />
                    </Pressable>
                  </View>

                  <FlatList
                    data={options}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => {
                      const isSelected = item.value === value;
                      return (
                        <Pressable
                          style={[
                            styles.optionItem,
                            isSelected && styles.optionItemSelected,
                          ]}
                          onPress={() => {
                            onChange(item.value);
                            setModalVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={colors.primary[600]}
                            />
                          )}
                        </Pressable>
                      );
                    }}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                  />
                </View>
              </Pressable>
            </Modal>
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error.main,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 4,
    minHeight: 48,
  },
  selectButtonError: {
    borderColor: colors.error.main,
  },
  selectText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.disabled,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    maxHeight: '70%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  optionItemSelected: {
    backgroundColor: colors.primary[50],
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  optionTextSelected: {
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
});
