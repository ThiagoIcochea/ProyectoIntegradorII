import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, Loading, confirm } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { enrichDetallesConCatalogo } from '@/utils/solicitud';

const state = (value: any) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
const money = (value: any) => value == null ? '-' : `S/ ${Number(value).toFixed(2)}`;
const voucher = (value: any) => value.comprobanteUrl || value.comprobante_url || value.voucherUrl || value.archivoUrl || value.adjuntoUrl;

export default function ProviderPayments() {
  const styles = useStyles();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const result: any = await b2bService.providerPayments(); setItems(Array.isArray(result) ? result : result?.data || []); }
    catch (error) { Alert.alert('No se pudieron cargar los pagos', apiError(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const change = async (id: number, action: 'approve' | 'reject') => {
    try { if (action === 'approve') await b2bService.approvePayment(id); else await b2bService.rejectPayment(id); await load(); Alert.alert(action === 'approve' ? 'Pago aprobado' : 'Pago rechazado'); }
    catch (error) { Alert.alert('No se pudo actualizar el pago', apiError(error)); }
  };
  const open = async (item: any) => {
    const requestId = Number(item.idSolicitud || 0);
    if (!requestId) { setSelected(item); return; }
    try {
      const [requests, catalog]: [any[], any] = await Promise.all([b2bService.providerRequests(), b2bService.providerProducts().catch(() => [])]);
      const request = requests.find(value => Number(value.idSolicitud) === requestId);
      const details = enrichDetallesConCatalogo(request?.detalles || item.detalles || [], Array.isArray(catalog) ? catalog : catalog?.data || []);
      setSelected(request ? { ...item, ...request, detalles: details } : item);
    } catch { setSelected(item); }
  };

  if (loading) return <Loading />;
  return <>
    <FlatList
      style={styles.root}
      data={items}
      keyExtractor={(item, index) => String(item.idPago || item.id || index)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<><Text accessibilityRole="header" style={styles.title}>Pagos recibidos</Text><Text style={styles.copy}>Revisa el comprobante y valida el pago de cada solicitud.</Text></>}
      ListEmptyComponent={<EmptyState title="Sin pagos" detail="No hay pagos recibidos para validar." />}
      renderItem={({ item }) => {
        const current = state(item.estado || item.estadoPago);
        const canValidate = ['VALIDANDO', 'PENDIENTE', 'PAGO_VALIDANDO'].includes(current);
        const name = item.nombreEmpresa || item.nombreClienteEmpresa || `Pago #${item.idPago || ''}`;
        return <Card><Text accessibilityRole="header" style={styles.name}>{name}</Text><Text style={styles.detail}>Estado: {current.replaceAll('_', ' ')}</Text><Text style={styles.amount}>{money(item.monto || item.total || item.totalSolicitud)}</Text><Text style={styles.detail}>Operación: {item.codigoOperacion || '-'} · Solicitud: #{item.idSolicitud || '-'}</Text><View style={styles.actions}><Button title="Ver detalle" variant="secondary" accessibilityLabel={`Ver detalle de ${name}`} onPress={() => void open(item)} />{voucher(item) ? <Button title="Ver comprobante" variant="secondary" accessibilityHint="Abre el comprobante en el navegador" onPress={() => void Linking.openURL(voucher(item))} /> : null}{canValidate ? <><Button title="Aceptar pago" accessibilityLabel={`Aceptar pago de ${name}`} onPress={() => void change(Number(item.idPago || item.id), 'approve')} /><Button title="Rechazar pago" variant="danger" accessibilityLabel={`Rechazar pago de ${name}`} onPress={() => confirm('Rechazar pago', 'El pago quedará rechazado.', () => void change(Number(item.idPago || item.id), 'reject'))} /></> : null}</View></Card>;
      }} />
    <RequestDetailModal item={selected} visible={Boolean(selected)} onClose={() => setSelected(null)} />
  </>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  list: { padding: spacing.md, gap: 12 },
  title: { fontSize: 25, fontWeight: '800', color: c.text },
  copy: { color: c.muted, lineHeight: 20, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '800', color: c.text },
  detail: { color: c.muted, lineHeight: 20 },
  amount: { fontSize: 18, fontWeight: '800', color: c.accentText },
  actions: { gap: 8 }
}));
