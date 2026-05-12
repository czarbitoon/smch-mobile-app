// smch-mobile-app/components/SkeletonLoader.tsx
// Simple skeleton loader component to mask ngrok tunnel latency

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonParagraph: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <View style={styles.paragraphContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          height={12}
          width={i === lines - 1 ? '80%' : '100%'}
          borderRadius={4}
          style={{ marginBottom: i < lines - 1 ? 12 : 0 }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  paragraphContainer: {
    paddingHorizontal: 4,
  },
});
