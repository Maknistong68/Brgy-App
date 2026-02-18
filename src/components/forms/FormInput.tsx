import React from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import { colors } from '@/theme';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  editable?: boolean;
}

export function FormInput<T extends FieldValues>({
  control, name, label, placeholder, secureTextEntry, multiline, numberOfLines,
  keyboardType, autoCapitalize, leftIcon, editable,
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          leftIcon={
            leftIcon ? (
              <Ionicons name={leftIcon as any} size={20} color={colors.grey[500]} />
            ) : undefined
          }
          editable={editable}
        />
      )}
    />
  );
}
