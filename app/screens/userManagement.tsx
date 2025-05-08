import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={async () => {
      try {
        const userRole = await AsyncStorage.getItem('user_role');
        if (userRole === 'admin' || userRole === 'superadmin') {
          router.replace('/screens/adminDashboard');
        } else if (userRole === 'staff') {
          router.replace('/screens/staffDashboard');
        } else if (userRole === 'user') {
          router.replace('/screens/userDashboard');
        } else {
          router.replace('/(tabs)/index');
        }
      } catch {
        router.replace('/(tabs)/index');
      }
    }} testID="back-btn">
      <Ionicons name="arrow-back" size={28} color="#1976d2" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  email: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    backgroundColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    color: "#d32f2f",
    textAlign: "center",
    marginTop: 32,
  },
});

export default UserManagement;