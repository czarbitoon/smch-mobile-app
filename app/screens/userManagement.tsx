import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useUserRole from '../utils/useUserRole';
import { API_URL } from "../../utils/api";


const UserManagement = () => {
  const userRole = useUserRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // Remove this line:
  
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
      if (err?.response?.status === 401) {
        setError("Unauthorized. Please login again.");
        setUsers([]);
        await AsyncStorage.removeItem("token");
      } else if (err?.response?.status === 403) {
        setError("Forbidden. You do not have access to user management.");
        setUsers([]);
      } else {
        setError(err.response?.data?.error || "Failed to fetch users.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Unauthorized. Please login again.");
        return;
      }
      await axios.put(
        `${API_URL}/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      if (err?.response?.status === 401) {
        Alert.alert("Error", "Unauthorized. Please login again.");
      } else if (err?.response?.status === 403) {
        Alert.alert("Error", "Forbidden. You do not have access to change roles.");
      } else {
        Alert.alert("Error", err.response?.data?.error || "Failed to change role.");
      }
    }
  };

  const handleDeactivate = async (id) => {
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
      fetchUsers();
    } catch (err) {
      if (err?.response?.status === 401) {
        Alert.alert("Error", "Unauthorized. Please login again.");
      } else if (err?.response?.status === 403) {
        Alert.alert("Error", "Forbidden. You do not have access to deactivate users.");
      } else {
        Alert.alert("Error", err.response?.data?.error || "Failed to deactivate user.");
      }
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.role}>Role: {item.user_role}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRoleChange(item.id, item.user_role === 'admin' ? 'staff' : 'admin')}
        >
          <Text style={styles.actionText}>{item.user_role === 'admin' ? "Demote to Staff" : "Promote to Admin"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#d32f2f" }]}
          onPress={() => handleDeactivate(item.id)}
        >
          <Text style={styles.actionText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={async () => {
        if (userRole === 'admin' || userRole === 'superadmin') {
          router.replace('/screens/adminDashboard');
        } else if (userRole === 'staff') {
          router.replace('/screens/staffDashboard');
        } else if (userRole === 'user') {
          router.replace('/screens/userDashboard');
        } else {
          router.replace('/(tabs)/index');
        }
      }} testID="back-btn">
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <Text style={styles.title}>User Management</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loadingIndicator} size="large" color="#1976d2" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={fetchUsers}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
        <Text style={styles.refreshBtnText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  userCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 4,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  deactivateBtn: {
    backgroundColor: '#e53935',
    marginLeft: 8,
    shadowColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 40,
  },
  refreshBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

export default UserManagement;