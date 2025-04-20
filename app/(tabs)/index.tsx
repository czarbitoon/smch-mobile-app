import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
      } else {
        const storedRole = await AsyncStorage.getItem('type');
        setRole(storedRole);
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }
  if (role === 'staff') {
    const StaffDashboard = require('./staffDashboard').default;
    return <StaffDashboard />;
  }
  if (role === 'user') {
    return <UserDashboard />;
  }
  // fallback for unknown roles
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Unknown role. Please contact support.</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to SMCH Admin</Text>
      <View style={styles.menuSection}>
        <Button title="Devices" onPress={() => router.push('/(tabs)/devices')} />
        <Button title="Offices" onPress={() => router.push('/(tabs)/offices')} />
        <Button title="Reports" onPress={() => router.push('/(tabs)/reports')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  menuSection: {
    width: '100%',
    gap: 16,
  },
});
