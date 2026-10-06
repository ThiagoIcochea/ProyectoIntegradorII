import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useAuth } from '@/hooks/use-auth';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { normalizeEstado, estadoLabel } from '@/utils/solicitud';

const money = (v: any) => `S/ ${Number(v || 0).toFixed(2)}`;
const asArray = (v: any): any[] => (Array.isArray(v) ? v : v?.data || []);
const APPROVED = ['PAGADA', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADA', 'COMPLETADA', 'PEDIDO_APROBADO'];
const PENDING = ['PAGO_PENDIENTE', 'PAGO_VALIDANDO'];
const REJECTED = ['CANCELADA', 'RECHAZADA'];
const STATUS_COLORS: Record<string, string> = { COMPLETADA: '#22c55e', ENTREGADA: '#14b8a6', CANCELADA: '#ef4444', PAGO_PENDIENTE: '#f59e0b', PAGO_VALIDANDO: '#60a5fa', PEDIDO_APROBADO: '#38bdf8', EN_PREPARACION: '#a78bfa', EN_CAMINO: '#fb923c', EN_RECLAMO: '#f43f5e' };
const FALLBACK_INSIGHTS = [
  'Pagos por validar: reduce los estados de validación con revisiones diarias.',
  'Solicitudes pendientes: responde RFQ dentro de un SLA operativo.',
  'API del proveedor: conecta stock, precios y estados sin reprocesos manuales.',
  'Reclamos abiertos: cierra casos con evidencia y resolución.',
  'Ingresos en soles: prioriza solicitudes de mayor valor estimado en S/.',
];

function buildMonthlyHistory(requests: any[]) {
  const buckets = new Map<string, { count: number; total: number }>();
  requests.forEach(r => {
    const date = r?.fechaCreacion ? new Date(r.fechaCreacion) : new Date();
    const label = date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
    const cur = buckets.get(label) || { count: 0, total: 0 };
    cur.count++; cur.total += Number(r?.total || 0);
    buckets.set(label, cur);
  });
  const max = Math.max(1, ...Array.from(buckets.values()).map(v => v.count));
  return Array.from(buckets.entries()).slice(-6).map(([label, v]) => ({ label, ...v, width: Math.max(8, Math.round((v.count / max) * 100)) }));
}

function buildStatusChart(requests: any[]) {
  const buckets = new Map<string, number>();
  requests.forEach(r => { const t = normalizeEstado(r?.estado) || 'SIN_ESTADO'; buckets.set(t, (buckets.get(t) || 0) + 1); });
  const max = Math.max(1, ...Array.from(buckets.values()));
  return Array.from(buckets.entries()).map(([token, count]) => ({ token, label: estadoLabel(token), count, width: Math.max(8, Math.round((count / max) * 100)), color: STATUS_COLORS[token] || '#3b82f6' }));
}

function getRfqCode(r: any) {
  const date = r?.fechaCreacion ? new Date(r.fechaCreacion) : new Date();
  const id = String(r?.idSolicitud || 0).padStart(4, '0');
  return `RFQ-${date.getFullYear()}-${id}`;
}

function parseInsightItems(value: any): string[] {
  const cleaned = String(value || '')
    .replace(/\r/g, '\n')
    .replace(/\*\*(Diagnostico breve|Diagnóstico breve|Riesgos operativos|Tres acciones priorizadas)\*\*/gi, '\n')
    .replace(/\bUSD\b|\bdolares\b|\bdólares\b|k\s*USD/gi, 'S/')
    .replace(/\bsoles peruanos\b/gi, 'soles');
  const items = cleaned
    .split(/\n+|(?=\s*\d+[).\s-]+\s*)/)
    .map(item => item.replace(/^\s*\d+[).\-\s]+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, 5);
  if (items.length >= 5) return items;
  return [...items, ...FALLBACK_INSIGHTS].slice(0, 5);
}

export default function ProviderDashboard() {
  const { session } = useAuth();
  const styles = useStyles();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [providerName, setProviderName] = useState('proveedor');
  const [apiConnected, setApiConnected] = useState(false);
  const [metrics, setMetrics] = useState<{ title: string; value: string; change: string }[]>([]);
  const [historyChart, setHistoryChart] = useState<any[]>([]);
  const [statusChart, setStatusChart] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [insightItems, setInsightItems] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const sub = session?.idUsuario ? await b2bService.subscriptionStatus(Number(session.idUsuario)) : null;
      setSubscription(sub);
      const hasDashboard = Number((sub as any)?.idPlan) === 3 && !(sub as any)?.bloqueado;
      if (!hasDashboard) { setLoading(false); return; }

      const [requestsRaw, apiConfig, claimsRaw] = await Promise.all([
        b2bService.providerRequests().catch(() => []),
        b2bService.providerApi().catch(() => ({})),
        b2bService.providerClaims().catch(() => []),
      ]);
      const requests = asArray(requestsRaw);
      const claims = asArray(claimsRaw);

      const approved = requests.filter((r: any) => APPROVED.includes(normalizeEstado(r?.estado)));
      const pending = requests.filter((r: any) => PENDING.includes(normalizeEstado(r?.estado)));
      const rejected = requests.filter((r: any) => REJECTED.includes(normalizeEstado(r?.estado)));
      const estimatedIncome = approved.reduce((sum: number, r: any) => sum + Number(r?.total || 0), 0);
      const connected = ['OK', 'ACTIVO'].includes(String((apiConfig as any)?.estado || '').toUpperCase());

      setProviderName((requests[0] as any)?.nombreProveedor || session?.email?.split('@')[0] || 'proveedor');
      setApiConnected(connected);
      setMetrics([
        { title: 'Solicitudes recibidas', value: String(requests.length), change: `${pending.length} pendientes de acción` },
        { title: 'Solicitudes aprobadas', value: String(approved.length), change: `${rejected.length} rechazadas/canceladas` },
        { title: 'Ingresos estimados', value: money(estimatedIncome), change: 'Sobre solicitudes aprobadas' },
      ]);

      const history = buildMonthlyHistory(requests);
      const status = buildStatusChart(requests);
      setHistoryChart(history);
      setStatusChart(status);

      setRecentRequests(requests.slice(0, 5).map((r: any) => ({
        id: getRfqCode(r),
        client: r?.nombreEmpresa || r?.nombreCliente || 'Cliente sin nombre',
        location: r?.direccionEnvio || r?.rucEmpresa || 'Sin dirección registrada',
        products: `${r?.detalles?.length || 0} item${r?.detalles?.length === 1 ? '' : 's'}`,
        date: r?.fechaCreacion ? new Date(r.fechaCreacion).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha',
        status: estadoLabel(r?.estado),
        statusToken: normalizeEstado(r?.estado),
      })));

      setLoading(false);
      setLoadingInsights(true);
      try {
        const res: any = await b2bService.providerInsights({
          solicitudes: requests.length,
          aprobadas: approved.length,
          pendientes: pending.length,
          rechazadas: rejected.length,
          reclamosAbiertos: claims.filter((c: any) => !['RESUELTO', 'RECHAZADO'].includes(String(c?.estado || '').toUpperCase())).length,
          ingresosEstimados: estimatedIncome,
          moneda: 'PEN',
          contexto: 'Peru',
          formatoEsperado: 'exactamente 5 ideas clave y criticas a mejorar en lista numerada',
          apiConectada: connected,
          historico: history,
          estados: status,
        });
        setInsightItems(parseInsightItems(res?.analysis));
      } catch {
        setInsightItems(FALLBACK_INSIGHTS);
      } finally {
        setLoadingInsights(false);
      }
    } catch (e) {
      setLoadError(apiError(e));
      setLoading(false);
    }
  }, [session?.idUsuario, session?.email]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Loading />;

  const hasDashboard = Number((subscription as any)?.idPlan) === 3 && !(subscription as any)?.bloqueado;

  if (!hasDashboard) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hola, {session?.email?.split('@')[0] || 'proveedor'}</Text>
        <Card>
          <Text style={styles.cardTitle}>Dashboard con gráficos e insights</Text>
          <Text style={styles.copy}>{(subscription as any)?.mensaje || 'El dashboard con reportes, gráficos e insights está disponible con el plan Premium.'}</Text>
          <Text style={styles.copy}>Plan actual: {(subscription as any)?.plan || 'Freemium'}</Text>
          <Button title="Ver planes y beneficios" onPress={() => router.push('/provider-operations')} />
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Operación del proveedor</Text>
          <Button title="Ver solicitudes" onPress={() => router.push('/(tabs)/requests')} />
          <Button title="Abrir herramientas" variant="secondary" onPress={() => router.push('/(tabs)/more')} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Resumen general · Premium</Text>
          <Text style={styles.title}>Hola, {providerName}</Text>
        </View>
        <View style={[styles.apiChip, !apiConnected && styles.apiChipPending]}>
          <Text style={styles.apiChipText}>{apiConnected ? 'API conectada' : 'API pendiente'}</Text>
        </View>
      </View>
      <Text style={styles.copy}>Aquí tienes el resumen de tu actividad y solicitudes en la plataforma.</Text>

      <View style={styles.metricsGrid}>
        {metrics.map(m => (
          <Card key={m.title} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{m.title}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricChange}>{m.change}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={styles.cardTitle}>Histórico de solicitudes</Text>
        <Text style={styles.copy}>Volumen mensual e ingresos asociados.</Text>
        {historyChart.length ? historyChart.map(item => (
          <View key={item.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${item.width}%` as any }]} /></View>
            <Text style={styles.barCount}>{item.count}</Text>
          </View>
        )) : <Text style={styles.copy}>Aún no hay histórico suficiente.</Text>}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Estados operativos</Text>
        <Text style={styles.copy}>Distribución actual de solicitudes.</Text>
        {statusChart.map(item => (
          <View key={item.token} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${item.width}%` as any, backgroundColor: item.color }]} /></View>
            <Text style={styles.barCount}>{item.count}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Insights para mejorar rendimiento</Text>
        {loadingInsights ? <Text style={styles.copy}>Analizando métricas...</Text> : insightItems.map((item, i) => (
          <Text key={i} style={styles.insightItem}>{i + 1}. {item}</Text>
        ))}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Solicitudes recientes RFQ</Text>
          <Button title="Ver todas" variant="secondary" onPress={() => router.push('/(tabs)/requests')} />
        </View>
        {recentRequests.length ? recentRequests.map(r => (
          <View key={r.id} style={styles.requestRow}>
            <Text style={styles.requestId}>{r.id}</Text>
            <Text style={styles.copy}>{r.client} · {r.products}</Text>
            <Text style={styles.copy}>{r.location}</Text>
            <View style={styles.rowBetween}>
              <Text style={[styles.statusBadge, { color: STATUS_COLORS[r.statusToken] || '#3b82f6' }]}>{r.status}</Text>
              <Text style={styles.copy}>{r.date}</Text>
            </View>
          </View>
        )) : <Text style={styles.copy}>No hay solicitudes recientes.</Text>}
      </Card>
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
    </ScrollView>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 27, fontWeight: '800', color: c.text },
  copy: { color: c.muted, lineHeight: 21 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  eyebrow: { color: c.muted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  apiChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: c.surfaceSoft, borderWidth: 1, borderColor: c.success },
  apiChipPending: { borderColor: c.warning },
  apiChipText: { fontSize: 12, fontWeight: '700', color: c.text },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { flexGrow: 1, flexBasis: '47%', gap: 4 },
  metricLabel: { color: c.muted, fontSize: 13, fontWeight: '600' },
  metricValue: { fontSize: 24, fontWeight: '800', color: c.text },
  metricChange: { color: c.muted, fontSize: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 8 },
  barLabel: { width: 70, fontSize: 12, color: c.muted },
  barTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: c.surfaceSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: c.primary },
  barCount: { width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700', color: c.text },
  insightItem: { color: c.text, marginTop: 6, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  requestRow: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10, marginTop: 10, gap: 4 },
  requestId: { fontWeight: '800', color: c.text },
  statusBadge: { fontWeight: '700', fontSize: 12 },
  errorText: { color: c.dangerText, textAlign: 'center' },
}));
