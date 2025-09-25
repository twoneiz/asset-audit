import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FirestoreService, type Assessment } from '@/lib/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Home() {
  const [total, setTotal] = React.useState(0);
  const [today, setToday] = React.useState(0);
  const [recent, setRecent] = React.useState<Assessment[]>([]);
  const scheme = useColorScheme() ?? 'light';
  const { user } = useAuth();

  const load = React.useCallback(async () => {
    if (!user) return;
    const rows = await FirestoreService.listAssessments(user.uid);
    setTotal(rows.length);
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    setToday(rows.filter((r: Assessment) => r.created_at >= start.getTime() && r.created_at <= end.getTime()).length);
    setRecent(rows.slice(0, 3));
  }, [user]);

  React.useEffect(() => { load(); }, [load]);
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Card style={styles.metricsRow}>
        <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
          <ThemedText style={styles.title}>{total}</ThemedText>
          <ThemedText>Total Audits</ThemedText>
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
          <ThemedText style={styles.title}>{today}</ThemedText>
          <ThemedText>Today</ThemedText>
        </View>
      </Card>

      <Card>
        <ThemedText style={[styles.title, { marginBottom: 6 }]}>Start New Audit</ThemedText>
        <ThemedText style={{ marginBottom: 12, opacity: 0.8 }}>Capture and assess a new asset</ThemedText>
        <Button title="Begin Audit" onPress={() => router.push('/(app)/(tabs)/capture')} />
      </Card>

      <Card>
        <ThemedText style={[styles.title, { marginBottom: 8 }]}>Recent Activity</ThemedText>
        {recent.length === 0 ? (
          <ThemedText style={{ marginBottom: 12, opacity: 0.8 }}>No audits yet</ThemedText>
        ) : (
          recent.map((it) => (
            <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: it.photo_uri }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: '600' }}>{it.category} - {it.element}</ThemedText>
                <ThemedText style={{ opacity: 0.8 }}>{new Date(it.created_at).toLocaleString()}</ThemedText>
              </View>
              <Button title="Open" onPress={() => router.push({ pathname: '/(app)/history/[id]', params: { id: it.id ?? '' } })} variant="secondary" />
            </View>
          ))
        )}
        <Button title="View All History" onPress={() => router.push('/(app)/history')} variant="secondary" />
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  title:{ fontSize:18, fontWeight:'600', marginBottom:8 },
  logo:{ width:180, height:40, alignSelf:'center', marginBottom:16 },
  metricsRow:{ flexDirection:'row', alignItems:'stretch', marginBottom:16 },
});
