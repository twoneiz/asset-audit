import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Index() {
  const { user, userProfile, loading } = useAuth();
  const scheme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    if (!user) {
      // Not authenticated - redirect to sign-in
      router.replace('/(auth)/sign-in');
      return;
    }

    if (user && userProfile) {
      // Authenticated with profile - redirect based on role
      if (userProfile.role === 'admin') {
        router.replace('/(app)/(admin-tabs)');
      } else {
        router.replace('/(app)/(tabs)');
      }
      return;
    }

    // Authenticated but no profile yet - wait for profile to load
    // The AuthContext will handle this case
  }, [user, userProfile, loading]);

  // Show loading screen while determining where to redirect
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: Colors[scheme].background 
    }}>
      <ThemedText style={{ fontSize: 18, opacity: 0.7 }}>
        Loading...
      </ThemedText>
    </View>
  );
}
