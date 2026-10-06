/**
 * The backend never sends the raw `EstadoSolicitud` enum name for `estado` — every endpoint
 * (SolicitudService#formatearEstado) sends a pre-translated Spanish label instead. Most of those
 * labels happen to normalize back to the enum spelling (e.g. "Pago pendiente" -> PAGO_PENDIENTE),
 * but a few don't:
 *   PAGO_VALIDANDO -> "Validando pago"   -> normalizes to VALIDANDO_PAGO
 *   PAGADA         -> "Pagado"           -> normalizes to PAGADO
 *   ENTREGADA      -> "Entregado"        -> normalizes to ENTREGADO
 * Comparing those against the real enum token (as several screens did) silently never matches.
 * Route every comparison through `normalizeEstado` so it always lands on the real token.
 */
const ALIASES: Record<string, string> = {
  VALIDANDO_PAGO: 'PAGO_VALIDANDO',
  PAGADO: 'PAGADA',
  ENTREGADO: 'ENTREGADA',
};

export function normalizeEstado(value: unknown): string {
  const raw = String(value || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents, e.g. "PREPARACIÓN" -> "PREPARACION"
    .replace(/\s+/g, '_');
  return ALIASES[raw] || raw;
}

export const isTerminalEstado = (value: unknown) => ['COMPLETADA', 'ENTREGADA', 'CANCELADA'].includes(normalizeEstado(value));

/**
 * Business-facing label. The backend's own names don't match the lifecycle a person actually sees:
 * a request is created directly in PAGO_PENDIENTE, before any provider review, and only becomes
 * payable once the provider approves it (PEDIDO_APROBADO) — so "Pago pendiente" shown at creation
 * reads as "I can pay now" when that's not true yet. Show the step that's actually happening.
 */
const LABELS: Record<string, string> = {
  PAGO_PENDIENTE: 'Creado',
  PEDIDO_APROBADO: 'Pago pendiente',
  PAGO_VALIDANDO: 'Validando pago',
  PAGADA: 'Pagada',
  EN_PREPARACION: 'En preparación',
  EN_CAMINO: 'En camino',
  ENTREGADA: 'Entregada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  EN_RECLAMO: 'En reclamo',
};

export function estadoLabel(rawEstado: unknown): string {
  const token = normalizeEstado(rawEstado);
  return LABELS[token] || token.replaceAll('_', ' ');
}
