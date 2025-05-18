import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from "../utils/api";

const AdminDashboard = () => {
  const router = useRouter();
  // Placeholder user data; replace with context/provider logic
  const user = { name: 'Admin', email: 'admin@example.com' };
  const [stats, setStats] = useState({ users: 0, devices: 0, reports: 0, offices: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
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
        <View style={[styles.widget, styles.card, {backgroundColor: '#e3e7fa'}]}><Text style={styles.widgetTitle}>Users</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.users}</Text></View>
        <View style={[styles.widget, styles.card, {backgroundColor: '#e3e7fa'}]}><Text style={styles.widgetTitle}>Devices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.devices}</Text></View>
      </View>
      <View style={styles.widgetRow}>
        <View style={[styles.widget, styles.card, {backgroundColor: '#e3e7fa'}]}><Text style={styles.widgetTitle}>Reports</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.reports}</Text></View>
        <View style={[styles.widget, styles.card, {backgroundColor: '#e3e7fa'}]}><Text style={styles.widgetTitle}>Offices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.offices}</Text></View>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity style={[styles.menuButton, styles.card]} onPress={() => router.push('/(tabs)/devices')}><Text style={styles.menuButtonText}>Devices</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuButton, styles.card]} onPress={() => router.push('/(tabs)/offices')}><Text style={styles.menuButtonText}>Offices</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuButton, styles.card]} onPress={() => router.push('/(tabs)/reports')}><Text style={styles.menuButtonText}>Reports</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuButton, styles.card]} onPress={() => router.push('/screens/userManagement')}><Text style={styles.menuButtonText}>Users</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#90caf9',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
    letterSpacing: 0.2,
  },
  profileEmail: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    gap: 12,
  },
  widget: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 2,
    backgroundColor: '#e3e7fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetTitle: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  widgetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.2,
  },
  menuSection: {
    width: '100%',
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginHorizontal: 2,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#1976d2',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default AdminDashboard;