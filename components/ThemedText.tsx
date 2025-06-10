import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import theme from '@/app/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'button' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color: theme.colors.textPrimary },
        styles[type] || styles.default,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.body1.lineHeight * theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
  },
  h1: {
    fontSize: theme.typography.h1.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h1.lineHeight * theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    marginBottom: theme.spacing.lg,
  },
  h2: {
    fontSize: theme.typography.h2.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h2.lineHeight * theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    marginBottom: theme.spacing.md,
  },
  h3: {
    fontSize: theme.typography.h3.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h3.lineHeight * theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    marginBottom: theme.spacing.md,
  },
  h4: {
    fontSize: theme.typography.h4.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h4.lineHeight * theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    marginBottom: theme.spacing.sm,
  },
  h5: {
    fontSize: theme.typography.h5.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h5.lineHeight * theme.typography.h5.fontSize,
    fontWeight: theme.typography.h5.fontWeight,
    marginBottom: theme.spacing.sm,
  },
  h6: {
    fontSize: theme.typography.h6.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.h6.lineHeight * theme.typography.h6.fontSize,
    fontWeight: theme.typography.h6.fontWeight,
    marginBottom: theme.spacing.sm,
  },
  body1: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.body1.lineHeight * theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
  },
  body2: {
    fontSize: theme.typography.body2.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.body2.lineHeight * theme.typography.body2.fontSize,
    fontWeight: theme.typography.body2.fontWeight,
  },
  caption: {
    fontSize: theme.typography.caption.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.caption.lineHeight * theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
    color: theme.colors.textSecondary,
  },
  button: {
    fontSize: theme.typography.button.fontSize,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.button.fontWeight,
    textTransform: theme.typography.button.textTransform,
  },
  link: {
    fontSize: theme.typography.body1.fontSize,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.body1.lineHeight * theme.typography.body1.fontSize,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeightMedium,
  },
});