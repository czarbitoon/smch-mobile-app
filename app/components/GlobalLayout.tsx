import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';

interface GlobalLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export default function GlobalLayout({ children, header, bottomNav }: GlobalLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fb" />
      {header}
      <View style={styles.container}>{children}</View>
      {bottomNav}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingBottom: 64, // space for bottom nav
  },
});
