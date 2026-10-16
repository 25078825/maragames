import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { darkColors, lightColors, type Colors, type ColorScheme } from './tokens';

export type ThemeMode = 'system' | 'dark' | 'light';

type ThemeValue = {
  mode: ThemeMode;
  scheme: ColorScheme;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'maragames.themeMode';

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme: ColorScheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
    return {
      mode,
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      setMode: (next) => {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    };
  }, [mode, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

type Styles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function makeStyles<T extends Styles>(factory: (c: Colors) => T & Styles) {
  const cache = new WeakMap<Colors, T>();
  return function useStyles(): T {
    const { colors } = useTheme();
    const cached = cache.get(colors);
    if (cached) return cached;
    const styles: T = factory(colors);
    cache.set(colors, styles);
    return styles;
  };
}
