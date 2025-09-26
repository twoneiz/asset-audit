import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const scheme = useColorScheme() ?? 'light';

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await signIn(email, password);
      // Note: RouteProtection will handle the role-based redirect automatically
      // We don't need to manually redirect here as the AuthContext will trigger
      // the RouteProtection logic which will redirect based on user role
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Sign-in failed');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[scheme].background }]}
    >
      <View style={styles.form}>
        <ThemedText style={styles.title}>Asset Audit</ThemedText>
        <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>

        <Input label="Email" value={email} onChangeText={setEmail}
               keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Password" value={password} onChangeText={setPassword}
               secureTextEntry autoComplete="password" />

        <Button title="Sign In" onPress={handleSignIn} disabled={loading} style={styles.button} />
        <Button title="Create New Account" onPress={() => router.push('/(auth)/sign-up')} variant="secondary" />
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
});
