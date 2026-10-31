import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { applyTheme } from '@/constants/theme';

export type AppTheme = 'dark' | 'light';
type Value = { theme: AppTheme; ready: boolean; toggleTheme: () => Promise<void> };
const Context = createContext<Value | null>(null);
const KEY = 'nethink_theme';

const webStorage = () => Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
const getTheme = async () => {
  const storage = webStorage();
  return storage ? storage.getItem(KEY) : SecureStore.getItemAsync(KEY);
};
const setTheme = async (theme: AppTheme) => {
  const storage = webStorage();
  if (storage) { storage.setItem(KEY, theme); return; }
  await SecureStore.setItemAsync(KEY, theme);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setCurrentTheme] = useState<AppTheme>('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getTheme().then(value => {
      const next: AppTheme = value === 'light' ? 'light' : 'dark';
      applyTheme(next);
      setCurrentTheme(next);
    }).finally(() => setReady(true));
  }, []);
  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setCurrentTheme(next);
    await setTheme(next);
  };
  return <Context.Provider value={{ theme, ready, toggleTheme }}>{children}</Context.Provider>;
}

export const useTheme = () => {
  const value = useContext(Context);
  if (!value) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return value;
};
