import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AdvertisementsCarousel } from '@/components/advertisements-carousel';
import { Button, Card, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useAuth } from '@/hooks/use-auth';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import AdminOperations from '@/app/admin-operations';
import ProviderDashboard from '@/app/provider-dashboard';

const money = (value: any) => value == null ? 'Cotizar' : `S/ ${Number(value).toFixed(2)}`;

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
  if (loading) return <Loading />;

  const name = profile?.nombres || profile?.razonSocial || session?.email?.split('@')[0] || 'usuario';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} accessibilityLabel="Resumen de inicio">
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PANEL DE COMPRAS</Text>
        <Text accessibilityRole="header" style={styles.title}>Hola, {name}</Text>
        <Text style={styles.heroCopy}>Encuentra tecnología, compara proveedores y prepara tu próxima solicitud RFQ en un solo lugar.</Text>
        <Button title="Explorar catálogo" accessibilityHint="Abre el catálogo de productos B2B" onPress={() => router.push('/(tabs)/catalog')} />
      </View>

      <AdvertisementsCarousel />

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text accessibilityRole="header" style={styles.section}>Productos recomendados</Text>
          <Text style={styles.copy}>Basados en las compras más recientes de la plataforma.</Text>
        </View>
        <Text style={styles.count}>{recommended.length} disponibles</Text>
      </View>

      {recommended.length ? recommended.map((item, index) => {
        const name = item.producto || item.nombre || 'Producto';
        return <Card key={String(item.idProducto || item.id || index)}><Text accessibilityRole="header" style={styles.cardTitle}>#{index + 1} {name}</Text><Text style={styles.copy}>{item.marca || 'Sin marca'} · {item.categoria || 'Sin categoría'} · {money(item.precioUnitario ?? item.precio)}</Text><Button title="Ver proveedores y reseñas" variant="secondary" accessibilityLabel={`Ver proveedores y reseñas de ${name}`} onPress={() => router.push({ pathname: '/reviews', params: { productId: String(item.idProducto || item.id), product: String(name) } })} /></Card>;
      }) : <Card><Text style={styles.copy}>Aún no hay productos recomendados disponibles.</Text></Card>}

      <View style={styles.quickActions}>
        <Card style={styles.actionCard}><Text accessibilityRole="header" style={styles.cardTitle}>Top proveedores</Text><Text style={styles.copy}>Consulta cumplimiento, satisfacción, tiempos de entrega y reseñas.</Text><Button title="Ver ranking" variant="secondary" onPress={() => router.push('/top-providers')} /></Card>
        <Card style={styles.actionCard}><Text accessibilityRole="header" style={styles.cardTitle}>Mis solicitudes</Text><Text style={styles.copy}>Consulta el estado de tus compras y su seguimiento.</Text><Button title="Ver solicitudes" variant="secondary" onPress={() => router.push('/(tabs)/requests')} /></Card>
      </View>
    </ScrollView>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  hero: { padding: spacing.lg, borderRadius: 18, gap: 10, backgroundColor: c.navy, borderWidth: 1, borderColor: c.border },
  eyebrow: { color: c.primaryLight, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 34 },
  heroCopy: { color: c.accentText, lineHeight: 21, marginBottom: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionTitleWrap: { flex: 1, gap: 4 },
  section: { fontSize: 20, fontWeight: '800', color: c.text },
  copy: { color: c.muted, lineHeight: 21 },
  count: { color: c.accentText, fontSize: 12, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  quickActions: { gap: spacing.md },
  actionCard: { gap: spacing.sm }
}));
