import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'decimal' | 'password' | 'date' | 'tel';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad' | 'phone-pad';
  style?: object;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  hint?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  keyboardType,
  style,
  error,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 4,
  disabled = false,
  hint,
}: InputProps) {
  const getKeyboardType = () => {
    if (keyboardType) return keyboardType;
    switch (type) {
      case 'email': return 'email-address';
      case 'number': return 'numeric';
      case 'decimal': return 'decimal-pad';
      case 'tel': return 'phone-pad';
      default: return 'default';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text3}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        keyboardType={getKeyboardType()}
        autoCapitalize={type === 'email' ? 'none' : 'sentences'}
        autoCompleteType={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
        textAlignVertical="top"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: object;
  error?: string;
  disabled?: boolean;
  hint?: string;
}

export function Select({
  label,
  value,
  onValueChange,
  children,
  style,
  error,
  disabled = false,
  hint,
}: SelectProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.selectWrapper}>
        <TextInput
          style={[
            styles.selectInput,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onValueChange}
          editable={false}
          caretHidden
        >
          {children}
        </TextInput>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

interface TextareaProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  rows?: number;
  style?: object;
  error?: string;
  disabled?: boolean;
  hint?: string;
}

export function Textarea({
  label,
  value,
  onChangeText,
  placeholder,
  rows = 4,
  style,
  error,
  disabled = false,
  hint,
}: TextareaProps) {
  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
      numberOfLines={rows}
      style={style}
      error={error}
      disabled={disabled}
      hint={hint}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md, width: '100%' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  input: {
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 100,
    paddingVertical: Spacing.md,
  },
  inputError: { borderColor: Colors.danger },
  inputDisabled: { backgroundColor: Colors.surface2, opacity: 0.7 },
  selectWrapper: { position: 'relative' },
  selectInput: {
    height: 48,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  errorText: { fontSize: 11, color: Colors.danger, marginTop: Spacing.xs, fontWeight: '600' },
  hintText: { fontSize: 11, color: Colors.text3, marginTop: Spacing.xs },
});