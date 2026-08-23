import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '../../constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: { backgroundColor: Colors.primary, textColor: 'white', borderColor: Colors.primary },
    secondary: { backgroundColor: Colors.surface, textColor: Colors.primary, borderColor: Colors.primary },
    ghost: { backgroundColor: 'transparent', textColor: Colors.primary, borderColor: 'transparent' },
    danger: { backgroundColor: Colors.danger, textColor: 'white', borderColor: Colors.danger },
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, borderRadius: Radius.sm },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15, borderRadius: Radius.md },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16, borderRadius: Radius.lg },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.backgroundColor, borderColor: v.borderColor },
        s,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: v.textColor, fontSize: s.fontSize }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  text: { fontWeight: '700' },
  icon: { marginRight: 2 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
});