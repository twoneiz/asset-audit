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
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const scheme = useColorScheme() ?? 'light';

  const handleSignUp = async () => {
    if (!email || !password || !name) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      // Redirect based on role
      if (role === 'admin') {
        router.replace('/(app)/(admin-tabs)');
      } else {
        router.replace('/(app)/(tabs)');
      }
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

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <ThemedText style={styles.roleLabel}>Account Type</ThemedText>
          <View style={styles.roleButtons}>
            <Button
              title={role === 'staff' ? 'Staff Member •' : 'Staff Member'}
              onPress={() => setRole('staff')}
              variant={role === 'staff' ? 'primary' : 'secondary'}
              style={styles.roleButton}
            />
            <Button
              title={role === 'admin' ? 'Administrator •' : 'Administrator'}
              onPress={() => setRole('admin')}
              variant={role === 'admin' ? 'primary' : 'secondary'}
              style={styles.roleButton}
            />
          </View>
          <ThemedText style={styles.roleDescription}>
            {role === 'staff'
              ? 'Staff members can capture images and create assessments. They can only view their own assessments.'
              : 'Administrators can view all assessments from all users and manage user accounts.'
            }
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
  roleSection: {
    marginVertical: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
  },
  roleDescription: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 16,
  },
});
