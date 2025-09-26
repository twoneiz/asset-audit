import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FirestoreService, type Assessment, type UserProfile } from '@/lib/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
// import { DebugInfo } from '@/components/DebugInfo';

export default function AdminDashboard() {
  const [totalAssessments, setTotalAssessments] = React.useState(0);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [todayAssessments, setTodayAssessments] = React.useState(0);
  const [recentAssessments, setRecentAssessments] = React.useState<Assessment[]>([]);
  const [activeUsers, setActiveUsers] = React.useState(0);
  const scheme = useColorScheme() ?? 'light';
  const { user, userProfile } = useAuth();

  const load = React.useCallback(async () => {
    // Debug logging (disabled for cleaner output)
    // console.log('Admin Dashboard - Loading data...');
    // console.log('Admin Dashboard - User:', user?.uid);
    // console.log('Admin Dashboard - User Profile:', userProfile);
    // console.log('Admin Dashboard - User Role:', userProfile?.role);

    if (!user) {
      // console.log('Admin Dashboard - No user, skipping load');
      return;
    }

    if (!userProfile) {
      // console.log('Admin Dashboard - No user profile yet, skipping load');
      return;
    }

    if (userProfile.role !== 'admin') {
      // console.log('Admin Dashboard - User is not admin, role:', userProfile.role);
      return;
    }

    try {
      // console.log('Admin Dashboard - Loading all assessments...');
      // Load all assessments
      const allAssessments = await FirestoreService.listAllAssessments();
      // console.log('Admin Dashboard - Loaded assessments:', allAssessments.length);
      setTotalAssessments(allAssessments.length);
      
      // Calculate today's assessments
      const start = new Date(); 
      start.setHours(0, 0, 0, 0);
      const end = new Date(); 
      end.setHours(23, 59, 59, 999);
      const todayCount = allAssessments.filter((assessment: Assessment) => 
        assessment.created_at >= start.getTime() && assessment.created_at <= end.getTime()
      ).length;
      setTodayAssessments(todayCount);
      
      // Get recent assessments
      setRecentAssessments(allAssessments.slice(0, 5));
      
      // Load all users
      const allUsers = await FirestoreService.listAllUsers();
      setTotalUsers(allUsers.length);
      setActiveUsers(allUsers.filter(user => user.isActive).length);
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    }
  }, [user, userProfile]);

  useFocusEffect(React.useCallback(() => {
    load();
  }, [load]));

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
      <View style={styles.header}>
        <ThemedText style={styles.welcomeText}>Welcome, Admin</ThemedText>
        <ThemedText style={styles.subtitle}>System Overview</ThemedText>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsRow}>
        <Card style={[styles.metricCard, { backgroundColor: Colors[scheme].tint + '20' }]}>
          <View style={styles.metricContent}>
            <Ionicons name="document-text-outline" size={24} color={Colors[scheme].tint} />
            <ThemedText style={styles.metricNumber}>{totalAssessments}</ThemedText>
            <ThemedText style={styles.metricLabel}>Total Assessments</ThemedText>
          </View>
        </Card>
        
        <Card style={[styles.metricCard, { backgroundColor: Colors[scheme].tint + '20' }]}>
          <View style={styles.metricContent}>
            <Ionicons name="today-outline" size={24} color={Colors[scheme].tint} />
            <ThemedText style={styles.metricNumber}>{todayAssessments}</ThemedText>
            <ThemedText style={styles.metricLabel}>Today</ThemedText>
          </View>
        </Card>
      </View>

      <View style={styles.metricsRow}>
        <Card style={[styles.metricCard, { backgroundColor: Colors[scheme].tint + '20' }]}>
          <View style={styles.metricContent}>
            <Ionicons name="people-outline" size={24} color={Colors[scheme].tint} />
            <ThemedText style={styles.metricNumber}>{totalUsers}</ThemedText>
            <ThemedText style={styles.metricLabel}>Total Users</ThemedText>
          </View>
        </Card>
        
        <Card style={[styles.metricCard, { backgroundColor: Colors[scheme].tint + '20' }]}>
          <View style={styles.metricContent}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Colors[scheme].tint} />
            <ThemedText style={styles.metricNumber}>{activeUsers}</ThemedText>
            <ThemedText style={styles.metricLabel}>Active Users</ThemedText>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card>
        <ThemedText style={[styles.title, { marginBottom: 12 }]}>Quick Actions</ThemedText>
        <View style={styles.actionButtons}>
          <Button 
            title="View All Assessments" 
            onPress={() => router.push('/(app)/(admin-tabs)/all-assessments')} 
            style={styles.actionButton}
          />
          <Button 
            title="Manage Users" 
            onPress={() => router.push('/(app)/(admin-tabs)/users')} 
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Recent Assessments */}
      <Card>
        <ThemedText style={[styles.title, { marginBottom: 12 }]}>Recent Assessments</ThemedText>
        {recentAssessments.length === 0 ? (
          <ThemedText style={{ opacity: 0.7 }}>No assessments yet.</ThemedText>
        ) : (
          recentAssessments.map((assessment) => (
            <View key={assessment.id} style={styles.assessmentItem}>
              <Image source={{ uri: assessment.photo_uri }} style={styles.assessmentThumb} />
              <View style={styles.assessmentInfo}>
                <ThemedText style={styles.assessmentTitle}>
                  {assessment.category} — {assessment.element}
                </ThemedText>
                <ThemedText style={styles.assessmentDate}>
                  {new Date(assessment.created_at).toLocaleString()}
                </ThemedText>
              </View>
              <Button 
                title="View" 
                onPress={() => router.push({ 
                  pathname: '/(app)/history/[id]', 
                  params: { id: assessment.id ?? '' } 
                })} 
                variant="secondary" 
                style={styles.viewButton}
              />
            </View>
          ))
        )}
        {recentAssessments.length > 0 && (
          <Button 
            title="View All Assessments" 
            onPress={() => router.push('/(app)/(admin-tabs)/all-assessments')} 
            variant="secondary" 
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16 
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  metricsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 16 
  },
  metricCard: {
    flex: 1,
    padding: 16,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  assessmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  assessmentThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  assessmentDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  viewButton: {
    paddingHorizontal: 16,
  },
});
