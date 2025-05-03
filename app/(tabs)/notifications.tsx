import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setNotifications(response.data.data.notifications || []);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/notifications/clear`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
              setNotifications([]);
            } catch {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {loading && <ActivityIndicator size="large" color="#007bff" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && notifications.length === 0 && (
        <Text style={styles.empty}>No notifications found.</Text>
      )}
      {!loading && notifications.map((notif) => (
        <Swipeable
          key={notif.id}
          renderRightActions={() => (
            <Button
              title="Delete"
              color="#e53935"
              onPress={async () => {
                try {
                  const token = await AsyncStorage.getItem('token');
                  await axios.delete(`${API_URL}/notifications/${notif.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  fetchNotifications();
                } catch {
                  Alert.alert('Error', 'Failed to delete notification');
                }
              }}
            />
          )}
        >
          <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{notif.title}</Text>
            <Text style={styles.notificationBody}>{notif.body}</Text>
            <Text style={styles.notificationDate}>{notif.created_at}</Text>
          </View>
        </Swipeable>
      ))}
      <View style={{ height: 24 }} />
      <Button title="Clear All Notifications" color="#e53935" onPress={handleClearAll} disabled={loading || notifications.length === 0} />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  notificationCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  empty: {
    color: '#888',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
});

export default NotificationsScreen;

const handleDeleteNotification = async (id) => {
  try {
    await axios.delete(`${API_URL}/notifications/${id}`);
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  } catch {
    Alert.alert('Error', 'Failed to delete notification');
  }
};