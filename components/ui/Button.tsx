import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  disabled,
  style,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: Variant;
}) {
  const scheme = useColorScheme() ?? 'light';
  const primaryBg = Colors[scheme].tint;
  const bgByVariant: Record<Variant, string> = {
    primary: primaryBg,
    secondary: scheme === 'light' ? '#E5E7EB' : '#374151',
    danger: '#DC2626',
  };
  const fgByVariant: Record<Variant, string> = {
    primary: '#ffffff',
    secondary: Colors[scheme].text,
    danger: '#ffffff',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bgByVariant[variant], opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: fgByVariant[variant] }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
