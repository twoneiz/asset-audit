import React from 'react';
import { Alert, StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { exportZip, importZip } from '@/lib/exportImport';
import { useThemePreference } from '@/lib/theme-context';
import { clearAllData, listAssessments } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const scheme = useColorScheme() ?? 'light';
  const [busy, setBusy] = React.useState<'export' | 'import' | null>(null);
  const { preferred, setPreferred } = useThemePreference();
  const [counts, setCounts] = React.useState({ total: 0, sizeKB: 0 });

  const recalc = React.useCallback(async () => {
    const rows = await listAssessments();
    let bytes = 0;

    const FS: any = FileSystem as any;
    const doc = FS.documentDirectory as string | undefined;
    const cache = FS.cacheDirectory as string | undefined;
    const photoDirs = [doc ? doc + 'photos/' : null, cache ? cache + 'photos/' : null].filter(Boolean) as string[];
    for (const dir of photoDirs) {
      try {
        const names = await FileSystem.readDirectoryAsync(dir);
        for (const name of names) {
          try {
            const info = await FileSystem.getInfoAsync(dir + name, { size: true } as any);
            if ((info as any).exists && typeof (info as any).size === 'number') bytes += (info as any).size as number;
          } catch {}
        }
      } catch {}
    }

    const dbCandidates = [
      doc ? doc + 'SQLite/asset_audit.db' : null,
      cache ? cache + 'SQLite/asset_audit.db' : null,
    ].filter(Boolean) as string[];
    for (const p of dbCandidates) {
      try {
        const info = await FileSystem.getInfoAsync(p, { size: true } as any);
        if ((info as any).exists && typeof (info as any).size === 'number') bytes += (info as any).size as number;
      } catch {}
    }

    if (bytes === 0) {
      for (const r of rows) {
        try {
          const info = await FileSystem.getInfoAsync(r.photo_uri, { size: true } as any);
          if ((info as any).exists && typeof (info as any).size === 'number') bytes += (info as any).size as number;
        } catch {}
      }
    }

    setCounts({ total: rows.length, sizeKB: Math.ceil(bytes / 1024) });
  }, []);

  React.useEffect(() => { recalc(); }, [recalc]);
  useFocusEffect(React.useCallback(() => { recalc(); }, [recalc]));

  const onExport = async () => {
    try { setBusy('export'); const path = await exportZip();
      Alert.alert('Export complete', `Saved: ${path.split('/').pop()}`);
    } catch (e: any) { Alert.alert('Export failed', String(e?.message || e)); }
    finally { setBusy(null); }
  };

  const onImport = async () => {
    try { setBusy('import'); const ok = await importZip();
      if (ok) { Alert.alert('Import complete', 'Your data has been imported.'); await recalc(); }
    } catch (e: any) { Alert.alert('Import failed', String(e?.message || e)); }
    finally { setBusy(null); }
  };

  return (
    <ScrollView style={{ backgroundColor: Colors[scheme].background }} contentContainerStyle={styles.container}>
      <ThemedText type="title" style={{ marginBottom: 12 }}>Settings</ThemedText>

      <Card>
        <ThemedText style={styles.cardTitle}>Appearance</ThemedText>
        <View style={{ gap: 8 }}>
          <Button title={preferred === 'light' ? 'Light •' : 'Light'} onPress={() => setPreferred('light')} variant={preferred === 'light' ? 'primary' : 'secondary'} />
          <Button title={preferred === 'dark' ? 'Dark •' : 'Dark'} onPress={() => setPreferred('dark')} variant={preferred === 'dark' ? 'primary' : 'secondary'} />
          <Button title={preferred === 'system' ? 'System •' : 'System'} onPress={() => setPreferred('system')} variant={preferred === 'system' ? 'primary' : 'secondary'} />
        </View>
      </Card>

      <Card>
        <ThemedText style={styles.cardTitle}>Data Management</ThemedText>
        <ThemedText style={{ marginBottom: 8 }}>Total Audits: {counts.total}   •   Storage: {counts.sizeKB} KB</ThemedText>
        <Button title={busy === 'export' ? 'Exporting' : 'Export Data (ZIP)'} onPress={onExport} disabled={!!busy} />
        <View style={{ height: 8 }} />
        <Button title={busy === 'import' ? 'Importing' : 'Import Data (ZIP)'} onPress={onImport} disabled={!!busy} variant="secondary" />
        <View style={{ height: 8 }} />
        <Button title="Clear All Data" onPress={() => {
          Alert.alert('Clear all data', 'This will remove all assessments and photos from this device.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await clearAllData(); await recalc(); } },
          ]);
        }} variant="danger" />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="information-circle-outline" size={18} color={Colors[scheme].text} style={{ marginRight: 6 }} />
          <ThemedText style={styles.cardTitle}>About Asset Audit</ThemedText>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText>Version</ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors[scheme].tint }]}>
            <ThemedText style={{ color: '#fff', fontWeight: '700' }}>
              {Constants?.expoConfig?.version || (Constants as any)?.manifest?.version || Constants?.nativeAppVersion || '1.0.0'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText>Platform</ThemedText>
          <ThemedText style={{ opacity: 0.9 }}>
            {Platform.OS === 'web' ? 'Mobile Web App' : Platform.OS === 'ios' ? 'iOS App' : 'Android App'}
          </ThemedText>
        </View>
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
