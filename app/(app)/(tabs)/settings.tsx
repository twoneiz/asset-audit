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
import { StorageCalculationService, type FormattedStorageMetrics } from '@/lib/storageCalculation';

export default function Settings() {
  const scheme = useColorScheme() ?? 'light';
  const [busy, setBusy] = React.useState<'export' | 'import' | null>(null);
  const { preferred, setPreferred } = useThemePreference();
  const [storageMetrics, setStorageMetrics] = React.useState<FormattedStorageMetrics | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [calculationError, setCalculationError] = React.useState<string | null>(null);
  const { user, userProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // Create dynamic styles based on current color scheme
  const createStyles = (scheme: 'light' | 'dark') => StyleSheet.create({
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

    // Storage metrics styles - now properly themed
    loadingContainer: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[scheme].card,
      borderRadius: 8,
      marginBottom: 8,
    },
    loadingText: {
      fontSize: 14,
      opacity: 0.8,
    },
    errorContainer: {
      padding: 16,
      backgroundColor: scheme === 'dark' ? '#7f1d1d' : '#fee2e2', // Dark red for dark mode, light red for light mode
      borderRadius: 8,
      marginBottom: 8,
    },
    errorText: {
      color: scheme === 'dark' ? '#fca5a5' : '#dc2626', // Light red text for dark mode, dark red for light mode
      fontSize: 14,
      marginBottom: 8,
    },
    noDataContainer: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors[scheme].card,
      borderRadius: 8,
      marginBottom: 8,
    },
    noDataText: {
      fontSize: 14,
      opacity: 0.8,
      marginBottom: 8,
    },
    metricsContainer: {
      backgroundColor: Colors[scheme].card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    metricLabel: {
      fontSize: 14,
      opacity: 0.8,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: Colors[scheme].border,
      marginTop: 8,
      paddingTop: 8,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors[scheme].tint,
    },
    lastUpdated: {
      fontSize: 12,
      opacity: 0.6,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const styles = createStyles(scheme);

  const calculateStorageMetrics = React.useCallback(async () => {
    if (!user) {
      setStorageMetrics(null);
      setCalculationError(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      console.log('Calculating Firebase storage metrics for user:', user.uid);
      const metrics = await StorageCalculationService.getFormattedUserStorageMetrics(user.uid);
      console.log('Storage metrics calculated:', metrics);
      setStorageMetrics(metrics);
    } catch (error) {
      console.error('Error calculating storage metrics:', error);
      setCalculationError(error instanceof Error ? error.message : 'Failed to calculate storage usage');
      setStorageMetrics(null);
    } finally {
      setIsCalculating(false);
    }
  }, [user]);

  React.useEffect(() => { calculateStorageMetrics(); }, [calculateStorageMetrics]);
  useFocusEffect(React.useCallback(() => { calculateStorageMetrics(); }, [calculateStorageMetrics]));

  const onExport = async () => {
    try { setBusy('export'); const path = await exportZip();
      Alert.alert('Export complete', `Saved: ${path.split('/').pop()}`);
    } catch (e: any) { Alert.alert('Export failed', String(e?.message || e)); }
    finally { setBusy(null); }
  };

  const onImport = async () => {
    try { setBusy('import'); const ok = await importZip();
      if (ok) { Alert.alert('Import complete', 'Your data has been imported.'); await calculateStorageMetrics(); }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="server-outline" size={18} color={Colors[scheme].text} style={{ marginRight: 6 }} />
          <ThemedText style={styles.cardTitle}>Data Management</ThemedText>
        </View>

        {/* Storage Metrics Display */}
        {isCalculating ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Calculating storage usage...</ThemedText>
          </View>
        ) : calculationError ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Error: {calculationError}</ThemedText>
            <Button
              title="Retry Calculation"
              onPress={calculateStorageMetrics}
              variant="secondary"
              size="sm"
            />
          </View>
        ) : storageMetrics ? (
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricLabel}>Total Assessments:</ThemedText>
              <ThemedText style={styles.metricValue}>{storageMetrics.assessmentCount}</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricLabel}>Images Stored:</ThemedText>
              <ThemedText style={styles.metricValue}>{storageMetrics.imageCount}</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricLabel}>Firestore Data:</ThemedText>
              <ThemedText style={styles.metricValue}>{storageMetrics.formattedFirestoreSize}</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricLabel}>Image Storage:</ThemedText>
              <ThemedText style={styles.metricValue}>{storageMetrics.formattedStorageSize}</ThemedText>
            </View>
            <View style={[styles.metricRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Total Storage:</ThemedText>
              <ThemedText style={styles.totalValue}>{storageMetrics.formattedTotalSize}</ThemedText>
            </View>
            <ThemedText style={styles.lastUpdated}>
              Last updated: {new Date(storageMetrics.lastCalculated).toLocaleString()}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <ThemedText style={styles.noDataText}>No storage data available</ThemedText>
            <Button
              title="Calculate Storage"
              onPress={calculateStorageMetrics}
              variant="secondary"
              size="sm"
            />
          </View>
        )}

        <View style={{ height: 16 }} />

        {/* Action Buttons */}
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
                await calculateStorageMetrics();
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
