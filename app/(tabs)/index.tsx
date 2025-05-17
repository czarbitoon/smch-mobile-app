import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserRole from '../utils/useUserRole';

export default function HomeScreen() {
  const router = useRouter();
  const userRole = useUserRole();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const checkRoleAndNavigate = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!isMounted) return;
        if (!token || !userRole) {
          router.replace('/auth/login');
          return;
        }
        switch (userRole) {
          case 'user':
            router.replace('/screens/userDashboard');
            break;
          case 'staff':
            router.replace('/screens/staffDashboard');
            break;
          case 'admin':
            router.replace('/screens/adminDashboard');
            break;
          case 'superadmin':
            router.replace('/screens/adminDashboard');
            break;
          default:
            router.replace('/auth/login');
            break;
        }
      } catch (err) {
        router.replace('/auth/login');
      }
    };
    checkRoleAndNavigate();
    return () => { isMounted = false; };
  }, [userRole]);
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }
  return null;
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
