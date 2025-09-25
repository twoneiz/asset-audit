import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AppStackLayout() {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors[scheme].background },
        headerTintColor: Colors[scheme].tint,
        headerTitleStyle: { fontWeight: '700', color: Colors[scheme].text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="history/index" options={{ title: 'History' }} />
      <Stack.Screen name="history/[id]" options={{ title: 'Assessment' }} />
      <Stack.Screen name="review" options={{ title: 'Review Summary' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
