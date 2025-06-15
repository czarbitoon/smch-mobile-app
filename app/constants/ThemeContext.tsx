import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import theme, { colors as lightColors } from '../constants/theme';

const darkColors = {
  ...lightColors,
  background: '#181a1b',
  surface: '#23272f',
  textPrimary: '#f5f5f5',
  textSecondary: '#b0b0b0',
  border: '#333',
  divider: '#333',
};

const ThemeContext = createContext({
  darkMode: false,
  setDarkMode: () => {},
  colors: lightColors,
  theme,
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Try to load preference from storage, else use system
    (async () => {
      const stored = await Promise.resolve(
        typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem('dark_mode')
          : null
      );
      if (stored !== null) setDarkMode(stored === 'true');
      else setDarkMode(Appearance.getColorScheme() === 'dark');
    })();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('dark_mode', darkMode.toString());
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      colors: darkMode ? darkColors : lightColors,
      theme: { ...theme, colors: darkMode ? darkColors : lightColors },
    }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
