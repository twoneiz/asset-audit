import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function Input({ label, labelColor, labelStyle, ...props }: { label?: string; labelColor?: string; labelStyle?: TextStyle } & TextInputProps) {
  const scheme = useColorScheme() ?? 'light';
  const base = {
    backgroundColor: Colors[scheme].card,
    borderColor: Colors[scheme].border,
    color: Colors[scheme].text,
  } as const;
  const ph = scheme === 'light' ? '#64748B' : '#94A3B8';
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={[styles.label, labelColor ? { color: labelColor } : null, labelStyle]}>{label}</Text> : null}
      <TextInput placeholderTextColor={ph} style={[styles.input, base, props.multiline ? styles.multiline : null]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
