import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: Colors[scheme].text },
        headerTintColor: Colors[scheme].tint,
        headerStyle: { backgroundColor: Colors[scheme].background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="capture" options={{ title: 'Capture', tabBarIcon: ({ color }) => <Ionicons name="camera-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="assess" options={{ title: 'Assess', tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} />
    </Tabs>
  );
}
