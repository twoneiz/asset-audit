import React from 'react';
import { Alert, StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { exportZip, importZip } from '@/lib/exportImport';
import { useThemePreference } from '@/lib/theme-context';
// Removed old SQLite imports - now using FirestoreService
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/AuthContext';
import { FirestoreService } from '@/lib/firestore';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings() {
  const scheme = useColorScheme() ?? 'light';
  const [busy, setBusy] = React.useState<'export' | 'import' | null>(null);
  const { preferred, setPreferred } = useThemePreference();
  const [counts, setCounts] = React.useState({ total: 0, sizeKB: 0 });
  const { user, userProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const recalc = React.useCallback(async () => {
    if (!user) return;
    const rows = await FirestoreService.listAssessments(user.uid);
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>

      {/* User Profile Section */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="person-circle-outline" size={18} color={Colors[scheme].text} style={{ marginRight: 6 }} />
          <ThemedText style={styles.cardTitle}>User Profile</ThemedText>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.labelText}>Name</ThemedText>
          <ThemedText style={styles.valueText} numberOfLines={2} ellipsizeMode="tail">
            {user?.displayName || 'Unknown'}
          </ThemedText>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.labelText}>Email</ThemedText>
          <ThemedText style={styles.valueText} numberOfLines={1} ellipsizeMode="tail">
            {user?.email || 'Unknown'}
          </ThemedText>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.labelText}>Role</ThemedText>
          <View style={[styles.badge, {
            backgroundColor: userProfile?.role === 'admin' ? '#ff6b6b' : '#4ecdc4'
          }]}>
            <ThemedText style={styles.badgeText}>
              {userProfile?.role?.toUpperCase() || 'UNKNOWN'}
            </ThemedText>
          </View>
        </View>
        <View style={{ height: 12 }} />
        <Button title="Sign Out" onPress={handleSignOut} variant="danger" />
      </Card>

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
        <Button title="Clear My Data" onPress={() => {
          Alert.alert('Clear my data', 'This will remove all your assessments and photos.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              if (user) {
                await FirestoreService.clearUserData(user.uid);
                await recalc();
              }
            } },
          ]);
        }} variant="danger" />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="information-circle-outline" size={18} color={Colors[scheme].text} style={{ marginRight: 6 }} />
          <ThemedText style={styles.cardTitle}>About Asset Audit</ThemedText>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.labelText}>Version</ThemedText>
          <View style={[styles.badge, { backgroundColor: Colors[scheme].tint }]}>
            <ThemedText style={styles.badgeText}>
              {Constants?.expoConfig?.version || (Constants as any)?.manifest?.version || Constants?.nativeAppVersion || '1.0.0'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <ThemedText style={styles.labelText}>Platform</ThemedText>
          <ThemedText style={styles.valueText}>
            {Platform.OS === 'web' ? 'Mobile Web App' : Platform.OS === 'ios' ? 'iOS App' : 'Android App'}
          </ThemedText>
        </View>
      </Card>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  pageTitle: {
    marginBottom: 20,
    textAlign: 'center',
    // Ensure proper spacing and visibility
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to handle multi-line text
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 32, // Ensure consistent row height
  },
  labelText: {
    flex: 0,
    minWidth: 60,
    marginRight: 12,
  },
  valueText: {
    flex: 1,
    opacity: 0.9,
    textAlign: 'right',
    // Ensure text wraps properly within container
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0, // Prevent badge from shrinking
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
