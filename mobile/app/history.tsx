import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Button, Card, EmptyState, Loading } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { enrichDetallesConCatalogo, estadoLabel, normalizeEstado } from '@/utils/solicitud';

export default function History() {
  const [items, setItems] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const styles = useStyles();
  const load = useCallback(async () => {
    try { setItems(await b2bService.history()); }
    catch (error) { Alert.alert('No se pudo cargar el historial', apiError(error)); setItems([]); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const open = async (item: any) => {
    try {
      const catalog = await b2bService.catalog({ categorias: null, marcas: null, precioMin: null, precioMax: null, especificaciones: [] }).catch(() => []);
      setSelected({ ...item, detalles: enrichDetallesConCatalogo(item.detalles || [], catalog) });
    } catch { setSelected(item); }
  };

  if (!items) return <Loading />;

  return <SafeAreaView style={styles.root}>
    <BackButton />
    <FlatList
      data={items}
      keyExtractor={(item, index) => String(item.idSolicitud || item.id || index)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<><Text accessibilityRole="header" style={styles.title}>Historial de solicitudes</Text><Text style={styles.copy}>Consulta compras completadas, entregadas y canceladas.</Text></>}
      ListEmptyComponent={<EmptyState title="Sin historial" detail="Las solicitudes finalizadas aparecerán aquí." />}
      renderItem={({ item }) => {
        const requestId = item.idSolicitud || item.id;
        const name = item.nombreProveedor || item.razonSocial || item.proveedor || `Solicitud #${requestId}`;
        return <Card><Text accessibilityRole="header" style={styles.name}>{name}</Text><Text style={styles.meta}>Estado: {estadoLabel(item.estado)}</Text><Text style={styles.meta}>Actualizada: {item.fechaActualizacionEstado || item.fechaFinalizacion || item.fechaCreacion || '—'}</Text><Button title="Ver detalle" variant="secondary" accessibilityLabel={`Ver detalle de ${name}`} onPress={() => void open(item)} />{normalizeEstado(item.estado) === 'ENTREGADA' ? <Button title="Evaluar" accessibilityLabel={`Evaluar la compra a ${name}`} onPress={() => router.push(`/evaluate/${requestId}` as never)} /> : null}</Card>;
      }} />
    <RequestDetailModal item={selected} visible={Boolean(selected)} onClose={() => setSelected(null)} isClient />
  </SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  list: { padding: spacing.md, gap: 12 },
  title: { fontSize: 25, fontWeight: '800', color: c.text },
  copy: { color: c.muted, lineHeight: 20 },
  name: { fontSize: 16, fontWeight: '800', color: c.text },
  meta: { color: c.muted, lineHeight: 20 }
}));
