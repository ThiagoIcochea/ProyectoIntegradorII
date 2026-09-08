export function extractValidationMessage(error: any, fallback = 'No se pudo procesar la solicitud.'): string {
  const candidates = [
    error?.error?.message,
    error?.error?.error,
    error?.message,
    error?.statusText,
    error?.error?.errors,
    error?.error?.detail
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = candidate[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
      if (first && typeof first === 'object') {
        const nested = first.message || first.error || first.detail;
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
      }
    }
  }

  return fallback;
}

export function validateRequired(value: unknown, label: string): string | null {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${label} es obligatorio.`;
  }
  return null;
}

export function validateRegex(value: string, regex: RegExp, label: string, example?: string): string | null {
  if (!String(value || '').trim()) {
    return `${label} es obligatorio.`;
  }
  if (!regex.test(String(value).trim())) {
    return example ? `${label} inválido. Ejemplo: ${example}.` : `${label} inválido.`;
  }
  return null;
}
