import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: ViewStyle;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select a date',
  minimumDate,
  maximumDate,
  containerStyle,
}: FormDatePickerProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

  const openPicker = (currentValue: string | Date | undefined) => {
    const date = currentValue ? new Date(currentValue) : new Date();
    setTempYear(date.getFullYear());
    setTempMonth(date.getMonth());
    setTempDay(date.getDate());
    setModalVisible(true);
  };

  const goToPrevMonth = () => {
    if (tempMonth === 0) {
      setTempMonth(11);
      setTempYear((y) => y - 1);
    } else {
      setTempMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (tempMonth === 11) {
      setTempMonth(0);
      setTempYear((y) => y + 1);
    } else {
      setTempMonth((m) => m + 1);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const hasError = !!error;
        const displayValue = value
          ? format(new Date(value), 'MMM d, yyyy')
          : null;

        const daysInMonth = getDaysInMonth(tempYear, tempMonth);
        const firstDayOfWeek = new Date(tempYear, tempMonth, 1).getDay();

        const calendarDays: (number | null)[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
          calendarDays.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
          calendarDays.push(d);
        }

        const isDayDisabled = (day: number): boolean => {
          const date = new Date(tempYear, tempMonth, day);
          if (minimumDate && date < minimumDate) return true;
          if (maximumDate && date > maximumDate) return true;
          return false;
        };

        const handleConfirm = () => {
          const selected = new Date(tempYear, tempMonth, tempDay);
          onChange(selected.toISOString());
          setModalVisible(false);
        };

        return (
          <View style={[styles.container, containerStyle]}>
            {label && (
              <Text style={[styles.label, hasError && styles.labelError]}>
                {label}
              </Text>
            )}

            <Pressable
              style={[styles.selectButton, hasError && styles.selectButtonError]}
              onPress={() => openPicker(value)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.grey[500]} />
              <Text
                style={[
                  styles.selectText,
                  !displayValue && styles.placeholderText,
                ]}
              >
                {displayValue || placeholder}
              </Text>
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
                <Pressable style={styles.modalContent} onPress={() => {}}>
                  {/* Month/Year navigation */}
                  <View style={styles.calendarHeader}>
                    <Pressable onPress={goToPrevMonth} hitSlop={8}>
                      <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                    </Pressable>
                    <Text style={styles.monthYearText}>
                      {MONTHS[tempMonth]} {tempYear}
                    </Text>
                    <Pressable onPress={goToNextMonth} hitSlop={8}>
                      <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
                    </Pressable>
                  </View>

                  {/* Day of week headers */}
                  <View style={styles.weekRow}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <Text key={d} style={styles.weekDayText}>{d}</Text>
                    ))}
                  </View>

                  {/* Calendar grid */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((day, idx) => {
                      if (day === null) {
                        return <View key={`empty-${idx}`} style={styles.dayCell} />;
                      }

                      const isSelected = day === tempDay;
                      const disabled = isDayDisabled(day);

                      return (
                        <Pressable
                          key={day}
                          style={[
                            styles.dayCell,
                            isSelected && styles.dayCellSelected,
                            disabled && styles.dayCellDisabled,
                          ]}
                          onPress={() => !disabled && setTempDay(day)}
                          disabled={disabled}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.dayTextSelected,
                              disabled && styles.dayTextDisabled,
                            ]}
                          >
                            {day}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={handleConfirm}
                    >
                      <Text style={styles.confirmText}>Confirm</Text>
                    </Pressable>
                  </View>
                </Pressable>
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
    gap: spacing.sm,
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
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthYearText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.grey[500],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  dayTextDisabled: {
    color: colors.grey[400],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  confirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
  },
  confirmText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
