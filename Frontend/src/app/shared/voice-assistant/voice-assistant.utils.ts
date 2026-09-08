export interface VoiceAssistantFallbackAction {
  message: string;
  navigateTo: string;
  clearPending: boolean;
}

export function buildProductNotFoundAction(query: string): VoiceAssistantFallbackAction {
  const cleaned = (query || '').trim();

  return {
    message: cleaned
      ? `No encontré un producto claro para "${cleaned}". Te llevo al catálogo para que lo busques manualmente.`
      : 'No encontré un producto claro. Te llevo al catálogo para que lo busques manualmente.',
    navigateTo: '/app/rfq/catalog',
    clearPending: true
  };
}
