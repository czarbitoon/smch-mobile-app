import * as React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export type ThemedViewProps = ViewProps & {
  style?: any;
  children: React.ReactNode;
};

export function ThemedView({ style, ...props }: ThemedViewProps) {
  return <View style={[styles.view, style]} {...props} />;
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: '#fff',
  },
});