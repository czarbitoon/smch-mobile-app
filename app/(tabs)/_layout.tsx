// The tab layout is already role-based and clean.
import { Tabs, Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notifCount, setNotifCount] = useState(0);

  React.useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem('user_role');
      setRole(storedRole !== null ? storedRole : null);
      setLoading(false);
    };
    getRole();
  }, []);

  React.useEffect(() => {
    const fetchNotifCount = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        // Defensive: support both { unread_count } and { data: { unread_count } }
        let count = 0;
        if (typeof data.unread_count === 'number') {
          count = data.unread_count;
        } else if (data.data && typeof data.data.unread_count === 'number') {
          count = data.data.unread_count;
        }
        setNotifCount(count);
      } catch (e) {
        setNotifCount(0);
        if (__DEV__) console.error('Failed to fetch notification count', e);
      }
    };
    fetchNotifCount();
  }, []);

  if (loading) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
      <Text style={{fontSize:18,color:'#888'}}>Loading...</Text>
    </View>
  );

  let screens = [];
  if (role === 'admin' || role === 'superadmin') {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'offices', title: 'Offices', icon: 'building.2.fill' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
      { name: 'notifications', title: 'Notifications', icon: 'bell.fill' },
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else if (role === 'staff') {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
      { name: 'notifications', title: 'Notifications', icon: 'bell.fill' },
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else if (role === 'user') {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else {
    // For unknown or unauthenticated roles, show only the Slot (child route)
    return <Slot />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, focused }) => {
              if (screen.name === 'notifications') {
                return (
                  <View>
                    <IconSymbol size={28} name={screen.icon} color={color} />
                    {notifCount > 0 && (
                      <View style={{
                        position: 'absolute',
                        right: -2,
                        top: -2,
                        backgroundColor: 'red',
                        borderRadius: 8,
                        minWidth: 16,
                        height: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 2,
                        borderWidth: 1,
                        borderColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                      }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{notifCount}</Text>
                      </View>
                    )}
                  </View>
                );
              }
              return <IconSymbol size={28} name={screen.icon} color={color} />;
            },
            tabBarTestID: screen.name === 'notifications' ? 'tab-notifications' : undefined,
            tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
            tabBarStyle: {
              ...Platform.select({ ios: { position: 'absolute' }, default: {} }),
              backgroundColor: '#f8f9fa',
              borderTopWidth: 0.5,
              borderTopColor: '#e0e0e0',
              height: 60,
              paddingBottom: Platform.OS === 'ios' ? 10 : 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 8,
            },
          }}
          listeners={screen.name === 'notifications' ? {
            tabPress: (e) => {
              e.preventDefault();
              // Redirect to reports screen instead of notifications
              const router = require('expo-router').useRouter();
              router.replace('/(tabs)/reports');
            },
          } : undefined}
        />
      ))}
    </Tabs>
  );
}
