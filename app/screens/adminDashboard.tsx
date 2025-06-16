import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import GlobalLayout from '../components/GlobalLayout';
import Card from '../components/Card';

const AdminDashboard = () => {
  const router = useRouter();
  const user = { name: 'Admin', email: 'admin@example.com' }; // Placeholder user data
  const [stats, setStats] = useState({ users: 0, devices: 0, reports: 0, offices: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/admin/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

  const handleCardPress = (route) => {
    router.push(route);
  };

  return (
    <GlobalLayout
      header={
        <View style={styles.headerRow}>
          <Text style={styles.header}>Admin Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      }
      bottomNav={
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}><Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Devices</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Reports</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}><Text style={styles.navText}>Profile</Text></TouchableOpacity>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar} />
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </Card>
        <View style={styles.widgetCol}>
          <Card onPress={() => handleCardPress('/screens/userManagement')} style={styles.widget}><Text style={styles.widgetTitle}>Users</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.users}</Text></Card>
          <Card onPress={() => handleCardPress('/(tabs)/devices')} style={styles.widget}><Text style={styles.widgetTitle}>Devices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.devices}</Text></Card>
          <Card onPress={() => handleCardPress('/(tabs)/reports')} style={styles.widget}><Text style={styles.widgetTitle}>Reports</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.reports}</Text></Card>
          <Card onPress={() => handleCardPress('/(tabs)/offices')} style={styles.widget}><Text style={styles.widgetTitle}>Offices</Text><Text style={styles.widgetValue}>{loadingStats ? '...' : stats.offices}</Text></Card>
        </View>
      </ScrollView>
    </GlobalLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f6fa',
    padding: 20,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  header: {
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
  widgetCol: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 12,
  },
  widget: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 18,
    marginVertical: 4,
    backgroundColor: '#e3e7fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    // Add ripple/touch feedback for Android
    ...Platform.select({
      android: {
        borderless: false,
      },
    }),
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  navText: {
    fontSize: 14,
    color: '#555',
  },
  navTextActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});

export default AdminDashboard;