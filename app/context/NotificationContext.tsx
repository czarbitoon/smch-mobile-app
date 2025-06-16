import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

// Define notification type for better type safety
interface Notification {
  id?: string | number;
  message?: string;
  data?: { message?: string };
  created_at?: string;
  read_at?: string | null;
  [key: string]: any;
}

const NotificationContext = createContext<{
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  fetchNotifications: () => void;
}>({
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  fetchNotifications: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | number | null>(null);
  const [echo, setEcho] = useState<Echo<any> | null>(null);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.read_at).length);
    } catch (e) {
      // Handle error
    }
  }, []);

  // Mark all as read
  const markAllAsRead = async () => {
    const token = await AsyncStorage.getItem('token');
    await axios.post(`${API_URL}/notifications/mark-all-read`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    fetchNotifications();
  };

  // Get user id from /profile
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUserId(res.data.id || res.data.user?.id);
    })();
  }, []);

  // Listen for real-time notifications (Echo/Pusher)
  useEffect(() => {
    fetchNotifications();
    let echoInstance: Echo<any> | null = null;
    (async () => {
      if (
        process.env.EXPO_PUBLIC_PUSHER_APP_KEY &&
        process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER &&
        userId
      ) {
        const token = await AsyncStorage.getItem('token');
        echoInstance = new Echo({
          broadcaster: 'pusher',
          key: process.env.EXPO_PUBLIC_PUSHER_APP_KEY,
          cluster: process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER,
          wsHost: process.env.EXPO_PUBLIC_PUSHER_HOST || `ws-${process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER}.pusher.com`,
          wsPort: process.env.EXPO_PUBLIC_PUSHER_PORT ? Number(process.env.EXPO_PUBLIC_PUSHER_PORT) : 80,
          wssPort: process.env.EXPO_PUBLIC_PUSHER_PORT ? Number(process.env.EXPO_PUBLIC_PUSHER_PORT) : 443,
          forceTLS: false,
          encrypted: true,
          disableStats: true,
          enabledTransports: ['ws', 'wss'],
          authEndpoint: `${API_URL}/broadcasting/auth`,
          auth: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        });
        setEcho(echoInstance);
        echoInstance.private(`App.Models.User.${userId}`)
          .notification((notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(count => count + 1);
          });
      }
    })();
    // Clean up Echo connection on unmount
    return () => {
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, [userId, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
