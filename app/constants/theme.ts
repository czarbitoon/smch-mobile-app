// Global theme configuration - Unified design system
export const colors = {
  // Primary colors - matching web app
  primary: "#2196f3",
  primaryLight: "#64b5f6",
  primaryDark: "#1976d2",
  
  // Secondary colors
  secondary: "#3f51b5",
  secondaryLight: "#7986cb",
  secondaryDark: "#303f9f",
  
  // Background colors
  background: "#f8f9fa",
  surface: "#ffffff",
  
  // Status colors
  error: "#f44336",
  errorLight: "#e57373",
  errorDark: "#d32f2f",
  warning: "#ff9800",
  warningLight: "#ffb74d",
  warningDark: "#f57c00",
  info: "#00bcd4",
  infoLight: "#4dd0e1",
  infoDark: "#0097a7",
  success: "#4caf50",
  successLight: "#81c784",
  successDark: "#388e3c",
  
  // Text colors
  textPrimary: "#212121",
  textSecondary: "#757575",
  textDisabled: "#9e9e9e",
  
  // Border and divider
  border: "#e0e0e0",
  divider: "#e0e0e0"
};

// 8pt grid spacing system
export const spacing = {
  xs: 4,   // 0.5 * 8pt
  sm: 8,   // 1 * 8pt
  md: 16,  // 2 * 8pt
  lg: 24,  // 3 * 8pt
  xl: 32,  // 4 * 8pt
  xxl: 40, // 5 * 8pt
  xxxl: 48 // 6 * 8pt
};

// Typography system - matching web app
export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  
  // Font weights
  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightSemiBold: "600",
  fontWeightBold: "700",
  
  // Font sizes - responsive scale
  h1: {
    fontSize: 40,
    fontWeight: "600",
    lineHeight: 1.2
  },
  h2: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 1.3
  },
  h3: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 1.3
  },
  h4: {
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 1.4
  },
  h5: {
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 1.4
  },
  h6: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 1.4
  },
  body1: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 1.5
  },
  body2: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 1.5
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 1.4
  },
  button: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "none"
  }
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

// Shadow system
export const shadows = {
  none: "none",
  sm: "0px 1px 3px rgba(0, 0, 0, 0.08)",
  md: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  lg: "0px 4px 12px rgba(0, 0, 0, 0.12)",
  xl: "0px 8px 24px rgba(0, 0, 0, 0.16)"
};

const theme = { 
  colors, 
  spacing, 
  typography, 
  borderRadius, 
  shadows 
};

export default theme;