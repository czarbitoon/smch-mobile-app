  import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Platform, Dimensions, TouchableOpacity } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useUserRole from '../utils/useUserRole';
import { API_URL } from "../../utils/api";
import GlobalLayout from '../components/GlobalLayout';
import Card from '../components/Card';


const { width } = Dimensions.get('window');

type User = {
  id: string | number;
  name: string;
  email: string;
  user_role: string;
  [key: string]: any;
};

const UserManagement = () => {
  const userRole = useUserRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const userRole = await AsyncStorage.getItem("user_role");
      if (!token) {
        setError("Unauthorized. Please login again.");
        setUsers([]);
        setLoading(false);
        return;
      }
      if (userRole !== "admin" && userRole !== "staff" && userRole !== "superadmin") {
        setError("Forbidden. You do not have access to user management.");
        setUsers([]);
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data || res.data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (id: string | number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Unauthorized. Please login again.");
        return;
      }
      await axios.put(
        `${API_URL}/users/${id}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users => users.filter(u => u.id !== id));
    } catch (err) {
      handleError(err);
    }
  };

  const handleUserPress = (user: User) => {
    // Navigate to user details or edit screen in the future
    Alert.alert('User', `${user.name}\n${user.email}\nRole: ${user.user_role}`);
  };

  const renderItem = ({ item }: { item: User }) => (
    <Card onPress={() => handleUserPress(item)} style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>Role: <Text style={styles.roleText}>{item.user_role}</Text></Text>
      </View>
      <TouchableOpacity
        style={styles.deactivateIcon}
        onPress={() => handleDeactivate(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="person-remove" size={22} color="#e53935" />
      </TouchableOpacity>
    </Card>
  );

  const handleError = (err: any) => {
    if (err?.response?.status === 401) {
      setError("Unauthorized. Please login again.");
      setUsers([]);
      AsyncStorage.removeItem("token");
    } else if (err?.response?.status === 403) {
      setError("Forbidden. You do not have access to user management.");
      setUsers([]);
    } else {
      setError(err.response?.data?.error || "Failed to fetch users.");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <GlobalLayout
      header={
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={async () => {
            if (userRole === 'admin' || userRole === 'superadmin') {
              router.replace('/screens/adminDashboard');
            } else if (userRole === 'staff') {
              router.replace('/screens/staffDashboard');
            } else if (userRole === 'user') {
              router.replace('/screens/userDashboard');
            }
          }} testID="back-btn">
            <Ionicons name="arrow-back" size={28} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.header}>User Management</Text>
        </View>
      }
      bottomNav={
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}><Text style={[styles.navText, styles.navTextActive]}>Devices</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Offices</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Reports</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Profile</Text></TouchableOpacity>
        </View>
      }
    >
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item, idx) => idx.toString()}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Add User', 'Add user action')}>
        <Ionicons name="person-add" size={28} color="#fff" />
      </TouchableOpacity>
    </GlobalLayout>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#f7f9fb',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
    zIndex: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 10,
    zIndex: 20,
    padding: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1883e6',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 6,
    padding: 18,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  userEmail: {
    color: '#555',
    fontSize: 13,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#1883e6',
  },
  roleText: {
    color: '#1883e6',
    textDecorationLine: 'underline',
  },
  deactivateIcon: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 80,
    backgroundColor: '#1883e6',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1883e6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  navBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#1883e6',
  },
  navText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#1883e6',
    fontWeight: 'bold',
  },
  error: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 15,
    marginVertical: 12,
    textAlign: 'center',
  },
});

export default UserManagement;