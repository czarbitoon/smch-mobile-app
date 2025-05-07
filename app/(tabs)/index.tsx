import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  useEffect(() => {
    let isMounted = true;
    const checkRoleAndNavigate = async () => {
      const token = await AsyncStorage.getItem('token');
      const userRole = await AsyncStorage.getItem('user_role');
      if (!isMounted) return;
      // Only redirect to login if token or userRole is missing, not on back navigation
      if (!token || !userRole) {
        // Redirect to login if missing
        router.replace('/auth/login');
        return;
      }
      switch (userRole) {
        case 'user':
          router.replace('/(tabs)/reports');
          break;
        case 'staff':
          router.replace('/(tabs)/reports');
          break;
        case 'admin':
          router.replace('/(tabs)/reports');
          break;
        default:
          // Redirect to login for unknown roles
          router.replace('/auth/login');
          break;
      }
    };
    checkRoleAndNavigate();
    return () => { isMounted = false; };
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
