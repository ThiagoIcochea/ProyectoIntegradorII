import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AdvertisementsCarousel } from '@/components/advertisements-carousel';
import { Button, Card, ScreenSkeleton } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import ProviderDashboard from '@/app/provider-dashboard';
import AdminOperations from '@/app/admin-operations';

const money = (value: any) => `S/ ${Number(value || 0).toFixed(2)}`;

export default function Home() {
  const { session } = useAuth();
  const styles = useStyles();
  const [profile, setProfile] = useState<any>(null);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [profileResult, recommendationsResult] = await Promise.allSettled([b2bService.profile(), b2bService.recommendations()]);
    if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
    else Alert.alert('No se pudo cargar el perfil', apiError(profileResult.reason));
    if (recommendationsResult.status === 'fulfilled') {
      const data: any = recommendationsResult.value;
      setRecommended((Array.isArray(data) ? data : data?.data || []).slice(0, 10));
    }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (session?.role === 'ADMIN') return <AdminOperations initialSection="dashboard" />;
  if (session?.role === 'PROVEEDOR') return <ProviderDashboard />;
  if (loading) return <ScreenSkeleton variant="dashboard" />;

  const name = profile?.nombres || profile?.razonSocial || session?.email?.split('@')[0] || 'usuario';
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>PANEL DE COMPRAS</Text>
    <Text style={styles.title}>Hola, {name}</Text>
    <Text style={styles.copy}>Descubre ofertas y prepara tus solicitudes B2B desde un solo lugar.</Text>
    <AdvertisementsCarousel />
    <Text style={styles.section}>Productos más consumidos</Text>
    {recommended.length ? recommended.map((item, index) => <Card key={String(item.idProducto || item.id || index)}><Text style={styles.rank}>#{index + 1}</Text><Text style={styles.cardTitle}>{item.producto || item.nombre || 'Producto'}</Text><Text style={styles.copy}>{item.marca || '-'} · {item.categoria || '-'} · {money(item.precioUnitario ?? item.precio)}</Text><Button title="Ver proveedores y reseñas" variant="secondary" onPress={() => router.push({ pathname: '/reviews', params: { productId: String(item.idProducto || item.id), product: String(item.producto || item.nombre || 'Producto') } })} /></Card>) : <Card><Text style={styles.copy}>Aún no hay productos recomendados disponibles.</Text></Card>}
    <Card><Text style={styles.cardTitle}>Top de proveedores</Text><Text style={styles.copy}>Consulta cumplimiento, satisfacción, tiempo promedio de entrega y reseñas.</Text><Button title="Ver ranking de proveedores" variant="secondary" onPress={() => router.push('/top-providers')} /></Card>
    <Card><Text style={styles.cardTitle}>Mis solicitudes</Text><Text style={styles.copy}>Consulta el estado y seguimiento de tus compras activas.</Text><Button title="Ver solicitudes" onPress={() => router.push('/(tabs)/requests')} /></Card>
  </ScrollView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: spacing.lg, gap: spacing.md },
  eyebrow: { color: c.accentText, fontSize: 12, fontWeight: '800', letterSpacing: .7, marginBottom: -8 },
  title: { fontSize: 29, fontWeight: '800', color: c.text, letterSpacing: -.7 },
  copy: { color: c.muted, lineHeight: 21 },
  section: { fontSize: 21, fontWeight: '800', color: c.text, marginTop: spacing.sm },
  rank: { alignSelf: 'flex-start', color: c.accentText, backgroundColor: c.surfaceSoft, fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: c.text },
}));
