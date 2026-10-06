import axios from 'axios';
import { storage } from './storage';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://proyectoinnovacion.onrender.com/api').replace(/\/$/, '');
export const api = axios.create({ baseURL: API_URL, timeout: 70000, headers: { Accept: 'application/json' } });
api.interceptors.request.use(async config => { const session = await storage.getSession(); if (session?.token) config.headers.Authorization = `Bearer ${session.token}`; return config; });
/** The free hosting tier sleeps after inactivity and the first request after that can drop the connection
 * before the instance finishes waking up. Retry idempotent GETs a couple of times with backoff instead of
 * surfacing a raw connection failure to the user. */
api.interceptors.response.use(undefined, async (error: any) => {
  const config = error?.config;
  const isNetworkError = !error?.response;
  const isGet = !config?.method || config.method.toLowerCase() === 'get';
  if (config && isNetworkError && isGet) {
    config.__retryCount = (config.__retryCount || 0) + 1;
    if (config.__retryCount <= 2) {
      await new Promise(resolve => setTimeout(resolve, config.__retryCount * 1000));
      return api(config);
    }
  }
  return Promise.reject(error);
});

/** Supports direct Spring DTOs and response envelopes returned by integrations. */
export function responseData<T>(data: unknown, fallback: T): T {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const body = data as Record<string, unknown>;
    for (const key of ['data', 'content', 'resultado', 'result']) if (body[key] != null) return body[key] as T;
  }
  return (data ?? fallback) as T;
}
export function responseList<T>(data: unknown): T[] { const value = responseData<unknown>(data, []); return Array.isArray(value) ? value as T[] : []; }
export function apiError(error: unknown, fallback = 'No se pudo completar la operación.') {
  const e = error as { response?: { data?: unknown }; message?: string; code?: string };
  const payload = e.response?.data;
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const message = body.message || body.mensaje || body.error || body.detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (!e.response) {
    const raw = String(e.message || '');
    if (/timeout/i.test(raw)) return 'El servidor está tardando en responder. Puede estar iniciando tras un periodo de inactividad: espera unos segundos y vuelve a intentar.';
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.';
  }
  return e.message || fallback;
}
