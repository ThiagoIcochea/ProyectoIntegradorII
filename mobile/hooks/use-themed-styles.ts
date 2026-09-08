import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { paletteFor, darkColors } from '@/constants/theme';
import { useTheme } from './use-theme';

type Palette = typeof darkColors;
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (palette: Palette) => T): T {
  const { theme } = useTheme();
  return useMemo(() => StyleSheet.create(factory(paletteFor(theme))), [factory, theme]);
}
