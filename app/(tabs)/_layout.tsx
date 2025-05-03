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

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [role, setRole] = useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem('user_role');
      setRole(storedRole !== null ? Number(storedRole) : null);
      setLoading(false);
    };
    getRole();
  }, []);

  if (loading) return null;

  let screens = [];
  if (role === 2 || role === 3) {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'offices', title: 'Offices', icon: 'building.2.fill' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
      { name: 'notifications', title: 'Notifications', icon: 'bell.fill' },
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else if (role === 1) {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
      { name: 'notifications', title: 'Notifications', icon: 'bell.fill' },
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else if (role === 0) {
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={screen.icon} color={color} />, 
          }}
        />
      ))}
    </Tabs>
  );
}
