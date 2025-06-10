import { View, type ViewProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import theme from '@/app/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'surface' | 'container';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'default',
  spacing = 'md',
  shadow = 'none',
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const getVariantStyle = () => {
    switch (variant) {
      case 'card':
        return styles.card;
      case 'surface':
        return styles.surface;
      case 'container':
        return styles.container;
      default:
        return styles.default;
    }
  };

  const getSpacingStyle = () => {
    return { padding: theme.spacing[spacing] || theme.spacing.md };
  };

  const getShadowStyle = () => {
    if (shadow === 'none') return {};
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: shadow === 'sm' ? 1 : shadow === 'md' ? 2 : shadow === 'lg' ? 4 : 8,
      },
      shadowOpacity: 0.08,
      shadowRadius: shadow === 'sm' ? 3 : shadow === 'md' ? 8 : shadow === 'lg' ? 12 : 24,
      elevation: shadow === 'sm' ? 2 : shadow === 'md' ? 4 : shadow === 'lg' ? 8 : 16,
    };
  };

  return (
    <View 
      style={[
        getVariantStyle(),
        getSpacingStyle(),
        getShadowStyle(),
        style
      ]} 
      {...otherProps} 
    />
  );
}

const styles = StyleSheet.create({
  default: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  surface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: 0,
  },
});