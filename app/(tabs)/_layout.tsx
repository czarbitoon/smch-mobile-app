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

  React.useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem('user_role');
      setRole(storedRole !== null ? storedRole : null);
      setLoading(false);
    };
    getRole();
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
      { name: 'profile', title: 'Profile', icon: 'person.crop.circle' },
    ];
  } else if (role === 'staff') {
    screens = [
      { name: 'index', title: 'Home', icon: 'house.fill' },
      { name: 'devices', title: 'Devices', icon: 'desktopcomputer' },
      { name: 'reports', title: 'Reports', icon: 'doc.text.fill' },
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
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name={screen.icon} color={color} />
            ),
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
        />
      ))}
    </Tabs>
  );
}
