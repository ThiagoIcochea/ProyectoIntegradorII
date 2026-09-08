import { describe, expect, it } from 'vitest';
import { getAvailableClaimTypes } from './claim-type-utils';

describe('getAvailableClaimTypes', () => {
  it('includes cancellation when the timeline has a cancellation event', () => {
    const tracking = {
      estado: 'EN_CAMINO',
      timeline: [{ estado: 'CANCELADA', descripcion: 'Pedido cancelado' }]
    };

    expect(getAvailableClaimTypes(tracking)).toEqual(expect.arrayContaining(['CANCELACION']));
  });

  it('includes incomplete-delivery when there is no successful delivery step', () => {
    const tracking = {
      estado: 'EN_CAMINO',
      timeline: [{ estado: 'EN_PREPARACION', descripcion: 'En preparación' }],
      fechaLimiteEntrega: '2026-01-10'
    };

    expect(getAvailableClaimTypes(tracking)).toEqual(expect.arrayContaining(['ENTREGA_INCOMPLETA']));
  });
});
