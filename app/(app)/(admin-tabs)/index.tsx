import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container, Column, Row, Grid } from '@/components/ui/Layout';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FirestoreService, type Assessment, type UserProfile } from '@/lib/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveUtils, Typography, Spacing, DeviceType } from '@/constants/responsive';
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
    <Container style={{ backgroundColor: Colors[scheme].background }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Column spacing="lg" style={styles.content}>
          {/* Header */}
          <Column spacing="xs" align="center" style={styles.header}>
            <ThemedText style={styles.welcomeText}>Welcome, Admin</ThemedText>
            <ThemedText style={styles.subtitle}>System Overview</ThemedText>
          </Column>

          {/* Metrics Cards */}
          <Grid columns={DeviceType.isPhone ? 2 : 4} spacing="md">
            <Card
              variant="elevated"
              padding="md"
              style={{
                ...styles.metricCard,
                backgroundColor: Colors[scheme].tint + '20',
              }}
            >
              <Column spacing="sm" align="center">
                <Ionicons
                  name="document-text-outline"
                  size={ResponsiveUtils.fontSize(24)}
                  color={Colors[scheme].tint}
                />
                <ThemedText style={styles.metricNumber}>{totalAssessments}</ThemedText>
                <ThemedText style={styles.metricLabel}>Total Assessments</ThemedText>
              </Column>
            </Card>

            <Card
              variant="elevated"
              padding="md"
              style={{
                ...styles.metricCard,
                backgroundColor: Colors[scheme].tint + '20',
              }}
            >
              <Column spacing="sm" align="center">
                <Ionicons
                  name="today-outline"
                  size={ResponsiveUtils.fontSize(24)}
                  color={Colors[scheme].tint}
                />
                <ThemedText style={styles.metricNumber}>{todayAssessments}</ThemedText>
                <ThemedText style={styles.metricLabel}>Today</ThemedText>
              </Column>
            </Card>

            <Card
              variant="elevated"
              padding="md"
              style={{
                ...styles.metricCard,
                backgroundColor: Colors[scheme].tint + '20',
              }}
            >
              <Column spacing="sm" align="center">
                <Ionicons
                  name="people-outline"
                  size={ResponsiveUtils.fontSize(24)}
                  color={Colors[scheme].tint}
                />
                <ThemedText style={styles.metricNumber}>{totalUsers}</ThemedText>
                <ThemedText style={styles.metricLabel}>Total Users</ThemedText>
              </Column>
            </Card>

            <Card
              variant="elevated"
              padding="md"
              style={{
                ...styles.metricCard,
                backgroundColor: Colors[scheme].tint + '20',
              }}
            >
              <Column spacing="sm" align="center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={ResponsiveUtils.fontSize(24)}
                  color={Colors[scheme].tint}
                />
                <ThemedText style={styles.metricNumber}>{activeUsers}</ThemedText>
                <ThemedText style={styles.metricLabel}>Active Users</ThemedText>
              </Column>
            </Card>
          </Grid>

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
        </Column>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: ResponsiveUtils.fontSize(Typography.responsive.heading),
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ResponsiveUtils.fontSize(Typography.responsive.body),
    opacity: 0.7,
    textAlign: 'center',
  },
  title: {
    fontSize: ResponsiveUtils.fontSize(Typography.responsive.title),
    fontWeight: '600',
  },
  metricCard: {
    minHeight: ResponsiveUtils.getResponsiveValue({
      phone: 120,
      tablet: 140,
      desktop: 160,
      default: 120,
    }),
  },
  metricNumber: {
    fontSize: ResponsiveUtils.fontSize(Typography.responsive.heading),
    fontWeight: '700',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: ResponsiveUtils.fontSize(Typography.xs),
    opacity: 0.7,
    textAlign: 'center',
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
  assessmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
  assessmentThumb: {
    width: ResponsiveUtils.getResponsiveValue({
      phone: 48,
      tablet: 56,
      desktop: 64,
      default: 48,
    }),
    height: ResponsiveUtils.getResponsiveValue({
      phone: 48,
      tablet: 56,
      desktop: 64,
      default: 48,
    }),
    borderRadius: ResponsiveUtils.getBorderRadius('sm'),
    marginRight: Spacing.md,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: ResponsiveUtils.fontSize(Typography.base),
    fontWeight: '600',
    marginBottom: 2,
  },
  assessmentDate: {
    fontSize: ResponsiveUtils.fontSize(Typography.xs),
    opacity: 0.7,
  },
  viewButton: {
    paddingHorizontal: Spacing.md,
  },
});
