import * as React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'link' | 'defaultSemiBold';
  children: React.ReactNode;
};

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.text,
        type === 'title' && styles.title,
        type === 'link' && styles.link,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#222',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  defaultSemiBold: {
    fontWeight: '600',
  },
});