import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { applyTheme } from '@/constants/theme';

export type AppTheme = 'dark' | 'light';
type Value = { theme: AppTheme; ready: boolean; toggleTheme: () => Promise<void> };
const Context = createContext<Value | null>(null);
const KEY = 'nethink_theme';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => { SecureStore.getItemAsync(KEY).then(v => { const next: AppTheme = v === 'light' ? 'light' : 'dark'; applyTheme(next); setTheme(next); }).finally(() => setReady(true)); }, []);
  const toggleTheme = async () => { const next = theme === 'dark' ? 'light' : 'dark'; applyTheme(next); setTheme(next); await SecureStore.setItemAsync(KEY, next); };
  return <Context.Provider value={{ theme, ready, toggleTheme }}>{children}</Context.Provider>;
}
export const useTheme = () => { const value = useContext(Context); if (!value) throw new Error('useTheme debe usarse dentro de ThemeProvider'); return value; };
