export type ClaimType = 'DEMORA' | 'CANCELACION' | 'ENTREGA_INCOMPLETA';

export function normalizeClaimState(state?: string | null): string {
  return (state || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function getPromisedDate(tracking: any): Date | null {
  const raw = tracking?.fechaLimiteEntrega || tracking?.fechaEntregaPrometida || tracking?.fechaEntregaEstimada || tracking?.fechaPrometida;
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getAvailableClaimTypes(tracking: any): ClaimType[] {
  const timeline = Array.isArray(tracking?.timeline) ? tracking.timeline : [];
  const normalizedState = normalizeClaimState(tracking?.estado);

  const hasCancellation = timeline.some((step: any) => normalizeClaimState(step?.estado) === 'CANCELADA');
  const hasDelivered = timeline.some((step: any) => ['ENTREGADA', 'COMPLETADA'].includes(normalizeClaimState(step?.estado)));
  const promisedDate = getPromisedDate(tracking);
  const isDelayed = promisedDate ? new Date().getTime() > promisedDate.getTime() : false;
  const isTerminal = ['CANCELADA', 'RECHAZADA', 'ENTREGADA', 'COMPLETADA'].includes(normalizedState);
  const isPreDeliveryState = ['EN_PREPARACION', 'PREPARACION', 'EN_CAMINO', 'ENVIADO', 'PROCESANDO', 'ACEPTADA', 'PENDIENTE', 'SOLICITADA'].includes(normalizedState);

  const options: ClaimType[] = [];

  if (hasCancellation || ['CANCELADA', 'RECHAZADA'].includes(normalizedState)) {
    options.push('CANCELACION');
  }

  if (hasDelivered || ['ENTREGADA', 'COMPLETADA'].includes(normalizedState) || (!isTerminal && !hasCancellation && !hasDelivered && isPreDeliveryState)) {
    options.push('ENTREGA_INCOMPLETA');
  }

  if (!isTerminal && !hasCancellation && !hasDelivered && isDelayed) {
    options.push('DEMORA');
  }

  return options;
}
