import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const router = useRouter();
  // Placeholder user data; replace with context/provider logic
  const user = { name: 'Admin', email: 'admin@example.com' };
  const [stats, setStats] = useState({ users: 0, devices: 0, reports: 0, offices: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/admin/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        // Defensive: handle possible response shapes
        if (res.data && typeof res.data === 'object') {
          if (res.data.stats) {
            setStats({
              users: res.data.stats.users ?? 0,
              devices: res.data.stats.devices ?? 0,
              reports: res.data.stats.reports ?? 0,
              offices: res.data.stats.offices ?? 0,
            });
          } else {
            setStats({
              users: res.data.users ?? 0,
              devices: res.data.devices ?? 0,
              reports: res.data.reports ?? 0,
              offices: res.data.offices ?? 0,
            });
          }
        } else {
          setStats({ users: 0, devices: 0, reports: 0, offices: 0 });
        }
      } catch (e) {
        setStats({ users: 0, devices: 0, reports: 0, offices: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/auth/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.profileCard}>
        <View style={styles.avatar} />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>
      <View style={styles.widgetRow}>
        <View style={styles.widget}><Text style={styles.widgetTitle}>Users</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.users}</Text></View>
        <View style={styles.widget}><Text style={styles.widgetTitle}>Devices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.devices}</Text></View>
      </View>
      <View style={styles.widgetRow}>
        <View style={styles.widget}><Text style={styles.widgetTitle}>Reports</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.reports}</Text></View>
        <View style={styles.widget}><Text style={styles.widgetTitle}>Offices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.offices}</Text></View>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/(tabs)/devices')}><Text style={styles.menuButtonText}>Devices</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/(tabs)/offices')}><Text style={styles.menuButtonText}>Offices</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/(tabs)/reports')}><Text style={styles.menuButtonText}>Reports</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/screens/userManagement')}><Text style={styles.menuButtonText}>Users</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#90caf9',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuSection: {
    width: '100%',
    gap: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  menuButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    paddingVertical: 18,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  widgetRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  widget: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 1,
  },
  widgetTitle: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  widgetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AdminDashboard;