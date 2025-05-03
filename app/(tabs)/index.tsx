import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  useEffect(() => {
    const checkRoleAndNavigate = async () => {
      const token = await AsyncStorage.getItem('token');
      const userRole = await AsyncStorage.getItem('user_role');
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
        default:
          router.replace('/auth/login');
      }
    };
    checkRoleAndNavigate();
  }, []);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976d2" />
    </View>
  );
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
