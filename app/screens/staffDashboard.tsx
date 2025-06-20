import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Button, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalLayout from '../components/GlobalLayout';
import Card from '../components/Card';

const StaffDashboard = () => {
  const router = useRouter();
  // Placeholder user data; replace with context/provider logic
  const user = { name: 'Staff', email: 'staff@example.com' };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/auth/login');
  };

  // Card navigation handlers
  const handleCardPress = (route: any) => {
    router.push(route);
  };

  return (
    <GlobalLayout
      header={
        <View style={styles.headerRow}>
          <Text style={styles.header}>Staff Dashboard</Text>
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
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: '#f4f6fa' }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { width: 96, height: 96, borderRadius: 48, backgroundColor: '#90caf9', marginBottom: 18, borderWidth: 3, borderColor: '#1976d2', elevation: 2 }]} />
          <Text style={[styles.profileName, { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 4, letterSpacing: 0.2 }]}>{user.name}</Text>
          <Text style={[styles.profileEmail, { fontSize: 16, color: '#666', marginBottom: 2 }]}>{user.email}</Text>
        </Card>
        <View style={styles.widgetGrid}>
          <Card onPress={() => handleCardPress('/(tabs)/devices')} style={styles.widget}><Text style={styles.widgetTitle}>Devices</Text></Card>
          <Card onPress={() => handleCardPress('/(tabs)/reports')} style={styles.widget}><Text style={styles.widgetTitle}>Reports</Text></Card>
          <Card onPress={() => handleCardPress('/(tabs)/profile')} style={styles.widget}><Text style={styles.widgetTitle}>Profile</Text></Card>
          <Card onPress={() => handleCardPress('/deviceCreate')} style={styles.widget}><Text style={styles.widgetTitle}>Add Device</Text></Card>
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
    padding: 32,
    alignItems: 'center',
    marginBottom: 36,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(25,118,210,0.10)',
      },
      ios: {
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
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
  widgetGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  widget: {
    flexBasis: '48%',
    maxWidth: '48%',
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 18,
    backgroundColor: '#e3e7fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetTitle: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 18,
    marginVertical: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
      },
      ios: {
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e3e7fa',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  navBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  navTextActive: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
});

export default StaffDashboard;