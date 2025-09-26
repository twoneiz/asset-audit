import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const scheme = useColorScheme() ?? 'light';

  const handleSignUp = async () => {
    if (!email || !password || !name || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      // All self-registered users are assigned 'staff' role for security
      await signUp(email, password, name, 'staff');
      // Staff users always redirect to staff dashboard
      router.replace('/(app)/(tabs)');
    } catch (e:any) {
      Alert.alert('Error', e?.message ?? 'Sign-up failed');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[scheme].background }]}
    >
      <View style={styles.form}>
        <ThemedText style={styles.title}>Create Account</ThemedText>
        <ThemedText style={styles.subtitle}>Sign up to get started</ThemedText>

        <Input label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password-new" />
        <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="password-new" />

        {/* Account Type Information */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoLabel}>Account Type: Staff Member</ThemedText>
          <ThemedText style={styles.infoDescription}>
            Staff members can capture images and create assessments. You will only be able to view your own assessments.
          </ThemedText>
          <ThemedText style={styles.adminNote}>
            Note: Administrator accounts can only be created by existing administrators through the admin dashboard.
          </ThemedText>
        </View>

        <Button title="Create Account" onPress={handleSignUp} disabled={loading} style={styles.button} />
        <Button title="Already have an account? Sign In" onPress={() => router.replace('/(auth)/sign-in')} variant="secondary" />
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  form:{ flex:1, justifyContent:'center', maxWidth:400, width:'100%', alignSelf:'center', gap:16 },
  title:{ fontSize:32, fontWeight:'bold', textAlign:'center' },
  subtitle:{ fontSize:16, opacity:0.7, textAlign:'center', marginBottom:16 },
  button:{ marginTop:8 },
  infoSection: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  infoDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: 8,
  },
  adminNote: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
