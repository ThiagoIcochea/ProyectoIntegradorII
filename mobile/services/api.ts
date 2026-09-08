import axios from 'axios';
import { storage } from './storage';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://proyectoinnovacion.onrender.com/api').replace(/\/$/, '');
export const api = axios.create({ baseURL: API_URL, timeout: 70000, headers: { Accept: 'application/json' } });
api.interceptors.request.use(async config => { const session = await storage.getSession(); if (session?.token) config.headers.Authorization = `Bearer ${session.token}`; return config; });

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
  const e = error as { response?: { data?: unknown }; message?: string };
  const payload = e.response?.data;
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const message = body.message || body.mensaje || body.error || body.detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return e.message || fallback;
}
