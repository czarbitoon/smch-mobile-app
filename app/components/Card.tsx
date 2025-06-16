import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export default function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        activeOpacity={0.85}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      },
    }),
  },
});
