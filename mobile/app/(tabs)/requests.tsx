import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, EmptyState, Loading, confirm } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useAuth } from '@/hooks/use-auth';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { enrichDetallesConCatalogo, estadoLabel, isTerminalEstado, normalizeEstado } from '@/utils/solicitud';

const state = (value: any) => normalizeEstado(value || 'PENDIENTE');
const money = (value: any) => value == null ? '-' : `S/ ${Number(value).toFixed(2)}`;
const terminal = (value: any) => isTerminalEstado(value);

export default function Requests() {
  const { session } = useAuth();
  const styles = useStyles();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = session?.role === 'PROVEEDOR' ? await b2bService.providerRequests() : session?.role === 'ADMIN' ? await b2bService.adminRequests() : await b2bService.myRequests();
      setItems(session?.role === 'CLIENTE' ? data.filter(item => !terminal(item.estado)) : data);
    } catch (error) {
      Alert.alert('No se pudieron cargar solicitudes', apiError(error));
    } finally { setLoading(false); }
  }, [session?.role]);

  useEffect(() => { void load(); }, [load]);
  const action = async (operation: () => Promise<unknown>) => {
    try { await operation(); await load(); Alert.alert('Operación realizada'); }
    catch (error) { Alert.alert('No se pudo completar', apiError(error)); }
  };
  const open = async (item: any) => {
    try {
      let catalog: any[] = [];
      let receptionCode: string | undefined;
      if (session?.role === 'PROVEEDOR') {
        const result: any = await b2bService.providerProducts().catch(() => []);
        catalog = Array.isArray(result) ? result : result?.data || [];
      } else if (session?.role === 'CLIENTE') {
        const [currentCatalog, tracking] = await Promise.all([b2bService.catalog({ categorias: null, marcas: null, precioMin: null, precioMax: null, especificaciones: [] }).catch(() => []), b2bService.requestTracking(Number(item.idSolicitud || item.id)).catch(() => null)]);
        catalog = currentCatalog;
        receptionCode = (tracking as any)?.codigoRecepcion;
      }
      setSelected({ ...item, codigoRecepcion: receptionCode || item.codigoRecepcion, detalles: enrichDetallesConCatalogo(item.detalles || [], catalog) });
    } catch { setSelected(item); }
  };

  if (loading) return <Loading />;

  return <>
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item, index) => String(item.idSolicitud || item.id || index)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={<><Text accessibilityRole="header" style={styles.heading}>{session?.role === 'CLIENTE' ? 'Mis solicitudes activas' : 'Solicitudes'}</Text><Text style={styles.subtitle}>Revisa productos, descuentos, contacto y fechas de cada solicitud.</Text></>}
      ListEmptyComponent={<EmptyState title="No hay solicitudes activas" detail="Las completadas, entregadas y canceladas aparecen en Historial." />}
      renderItem={({ item }) => {
        const requestId = Number(item.idSolicitud || item.id);
        const current = state(item.estado);
        const payable = current === 'PEDIDO_APROBADO';
        const providerCanProcess = current === 'PAGO_PENDIENTE';
        const name = item.nombreProveedor || item.proveedor || item.nombreCliente || item.nombreEmpresa || `Solicitud #${requestId}`;
        return <Card><View style={styles.row}><Text accessibilityRole="header" style={styles.title}>{name}</Text><Text style={styles.badge}>{estadoLabel(item.estado)}</Text></View><Text style={styles.detail}>RFQ-{String(requestId).padStart(4, '0')} · {item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleDateString('es-PE') : '-'}</Text><Text style={styles.amount}>{money(item.total)}</Text><View style={styles.actions}><Button title="Ver detalle" variant="secondary" accessibilityLabel={`Ver detalle de ${name}`} onPress={() => void open(item)} />{session?.role === 'CLIENTE' ? <><Button title="Tracking" variant="secondary" accessibilityLabel={`Ver seguimiento de ${name}`} onPress={() => router.push(`/request/${requestId}`)} />{payable ? <Button title="Pagar" accessibilityLabel={`Pagar solicitud de ${name}`} onPress={() => router.push(`/payment?id=${requestId}&providerId=${item.idProveedor || item.proveedorId || ''}` as never)} /> : null}{['PAGO_PENDIENTE', 'PEDIDO_APROBADO'].includes(current) ? <Button title="Cancelar" variant="danger" accessibilityLabel={`Cancelar solicitud de ${name}`} onPress={() => confirm('Cancelar solicitud', 'No podrás revertir esta acción.', () => void action(() => b2bService.cancelRequest(requestId)))} /> : null}</> : null}{session?.role === 'PROVEEDOR' && providerCanProcess ? <><Button title="Aprobar pedido" accessibilityLabel={`Aprobar pedido de ${name}`} onPress={() => void action(() => b2bService.approveRequest(requestId))} /><Button title="Rechazar" variant="danger" accessibilityLabel={`Rechazar pedido de ${name}`} onPress={() => void action(() => b2bService.rejectRequest(requestId, 'Rechazado desde móvil'))} /></> : null}</View></Card>;
      }} />
    <RequestDetailModal item={selected} visible={Boolean(selected)} onClose={() => setSelected(null)} isClient={session?.role === 'CLIENTE'} />
  </>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  list: { padding: spacing.md, gap: 12 },
  heading: { fontSize: 25, fontWeight: '800', color: c.text },
  subtitle: { color: c.muted, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: c.text },
  badge: { fontSize: 11, fontWeight: '700', color: c.accentText, backgroundColor: c.surfaceSoft, padding: 6, borderRadius: 8 },
  detail: { color: c.muted, lineHeight: 20 },
  amount: { fontSize: 17, fontWeight: '800', color: c.accentText },
  actions: { gap: 8 }
}));
