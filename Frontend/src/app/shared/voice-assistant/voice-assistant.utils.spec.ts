import { describe, expect, it } from 'vitest';
import { buildProductNotFoundAction } from './voice-assistant.utils';

describe('buildProductNotFoundAction', () => {
  it('returns a safe fallback that opens the catalog and clears the pending action', () => {
    const result = buildProductNotFoundAction('monitor gamer');

    expect(result.clearPending).toBe(true);
    expect(result.navigateTo).toBe('/app/rfq/catalog');
    expect(result.message).toContain('catálogo');
  });
});
