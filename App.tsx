import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from './hooks/useColorScheme';
import RootNavigator from './app';

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <ThemeProvider value={colorScheme}>
          <View style={styles.container}>
            <RootNavigator />
            <StatusBar style="auto" />
          </View>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

registerRootComponent(App);