import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FirestoreService, type UserProfile, UserRole } from '@/lib/firestore';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View, FlatList, Alert, Modal, TextInput } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function UserManagement() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const scheme = useColorScheme() ?? 'light';
  const { user, userProfile } = useAuth();

  const load = React.useCallback(async () => {
    if (!user || userProfile?.role !== 'admin') return;

    try {
      setLoading(true);
      setError(null);
      const allUsers = await FirestoreService.listAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  useFocusEffect(React.useCallback(() => {
    load();
  }, [load]));

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await FirestoreService.updateUserRole(userId, newRole);
      await load(); // Reload users
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const confirmRoleChange = (user: UserProfile, newRole: UserRole) => {
    Alert.alert(
      'Confirm Role Change',
      `Change ${user.displayName}'s role from ${user.role} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleRoleChange(user.id, newRole) }
      ]
    );
  };

  const getRoleColor = (role: UserRole) => {
    return role === 'admin' ? '#ff6b6b' : '#4ecdc4';
  };

  const getRoleIcon = (role: UserRole) => {
    return role === 'admin' ? 'shield-checkmark' : 'person';
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <ThemedText style={styles.userName}>{item.displayName}</ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <Ionicons name={getRoleIcon(item.role)} size={12} color="white" />
              <ThemedText style={styles.roleText}>{item.role.toUpperCase()}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
          <ThemedText style={styles.userDate}>
            Joined: {new Date(item.created_at).toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={[styles.statusIndicator, { 
          backgroundColor: item.isActive ? '#4ecdc4' : '#ff6b6b' 
        }]} />
      </View>

      <View style={styles.userActions}>
        {item.role === 'staff' ? (
          <Button
            title="Promote to Admin"
            onPress={() => confirmRoleChange(item, 'admin')}
            variant="secondary"
            style={styles.actionButton}
          />
        ) : (
          <Button
            title="Demote to Staff"
            onPress={() => confirmRoleChange(item, 'staff')}
            variant="secondary"
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: Colors[scheme].background }]}>
        <ThemedText>Loading users...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: Colors[scheme].background }]}>
        <ThemedText style={{ color: 'red', marginBottom: 8 }}>{error}</ThemedText>
        <Button title="Retry" onPress={load} variant="secondary" />
      </View>
    );
  }

  const adminUsers = users.filter(u => u.role === 'admin');
  const staffUsers = users.filter(u => u.role === 'staff');

  return (
    <View style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <ThemedText style={styles.summaryTitle}>User Summary</ThemedText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryNumber}>{adminUsers.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Admins</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryNumber}>{staffUsers.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Staff</ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryNumber}>{users.filter(u => u.isActive).length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Active</ThemedText>
          </View>
        </View>
      </Card>

      {/* Users List */}
      <View style={styles.listHeader}>
        <ThemedText style={styles.listTitle}>All Users ({users.length})</ThemedText>
      </View>

      {users.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={{ opacity: 0.7 }}>No users found.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
