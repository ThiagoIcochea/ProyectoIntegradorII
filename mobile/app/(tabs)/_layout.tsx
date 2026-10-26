import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { paletteFor } from '@/constants/theme';

export default function TabsLayout() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const colors = paletteFor(theme);
  const client = session?.role === 'CLIENTE';
  const provider = session?.role === 'PROVEEDOR';
  const admin = session?.role === 'ADMIN';
  const icons: Record<string, any> = {
    index: 'home-outline', catalog: 'storefront-outline', requests: 'clipboard-outline', history: 'time-outline', profile: 'person-outline', more: 'ellipsis-horizontal-circle-outline', admin: 'speedometer-outline', 'admin-users': 'people-outline', 'admin-providers': 'business-outline', 'admin-more': 'grid-outline'
  };

  return (
    <Tabs screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.navy },
      headerTintColor: '#fff',
      headerTitleAlign: 'left',
      headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      headerShadowVisible: false,
      tabBarStyle: { backgroundColor: colors.surfaceRaised, borderTopColor: colors.border, height: 64, paddingTop: 6, paddingBottom: 6 },
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      sceneStyle: { backgroundColor: colors.bg },
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] || 'grid-outline'} size={size} color={color} />
    })}>
      <Tabs.Screen name="index" options={{ title: provider ? 'Inicio proveedor' : session?.role === 'ADMIN' ? 'Panel administrador' : 'Inicio', tabBarAccessibilityLabel: 'Ir al inicio' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Catálogo', href: client ? undefined : null, tabBarAccessibilityLabel: 'Abrir catálogo' }} />
      <Tabs.Screen name="requests" options={{ title: 'Solicitudes', href: session?.role === 'ADMIN' ? null : undefined, tabBarAccessibilityLabel: 'Abrir solicitudes' }} />
      <Tabs.Screen name="history" options={{ title: 'Historial', href: client ? undefined : null, tabBarAccessibilityLabel: 'Abrir historial' }} />
      <Tabs.Screen name="more" options={{ title: 'Más', href: provider ? undefined : null, tabBarAccessibilityLabel: 'Abrir más opciones' }} />
      <Tabs.Screen name="admin" options={{ title: 'Dashboard', href: null }} />
      <Tabs.Screen name="admin-users" options={{ title: 'Usuarios', href: admin ? undefined : null, tabBarAccessibilityLabel: 'Administrar usuarios' }} />
      <Tabs.Screen name="admin-providers" options={{ title: 'Proveedores', href: admin ? undefined : null, tabBarAccessibilityLabel: 'Administrar proveedores' }} />
      <Tabs.Screen name="admin-more" options={{ title: 'Más', href: admin ? undefined : null, tabBarAccessibilityLabel: 'Abrir opciones de administración' }} />
      <Tabs.Screen name="admin-products" options={{ href: null }} />
      <Tabs.Screen name="admin-logs" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', href: undefined, tabBarAccessibilityLabel: 'Abrir perfil' }} />
      <Tabs.Screen name="provider-claims" options={{ href: null }} />
      <Tabs.Screen name="provider-deliveries" options={{ href: null }} />
      <Tabs.Screen name="provider-payments" options={{ href: null }} />
      <Tabs.Screen name="provider-products" options={{ href: null }} />
      <Tabs.Screen name="provider-api" options={{ href: null }} />
    </Tabs>
  );
}
