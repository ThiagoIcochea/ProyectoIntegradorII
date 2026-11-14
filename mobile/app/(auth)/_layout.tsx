import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { BackButton } from '@/components/ui';
import { paletteFor } from '@/constants/theme';

export default function AuthLayout() {
  const { theme } = useTheme();
  const colors = paletteFor(theme);
  return <Stack screenOptions={{
    animation: 'fade_from_bottom',
    animationDuration: 240,
    headerStyle: { backgroundColor: colors.navy },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '800' },
    headerShadowVisible: false,
    headerLeft: () => <BackButton fallback="/(auth)/login" color="#fff" />,
  }}>
    <Stack.Screen name="login" options={{ headerShown: false }} />
    <Stack.Screen name="forgot-password" options={{ title: 'Recuperar contraseña' }} />
    <Stack.Screen name="reset-password" options={{ title: 'Nueva contraseña' }} />
    <Stack.Screen name="role-selection" options={{ title: 'Crear cuenta' }} />
    <Stack.Screen name="register-client" options={{ title: 'Registro de cliente' }} />
    <Stack.Screen name="register-provider" options={{ title: 'Registro de proveedor' }} />
  </Stack>;
}
