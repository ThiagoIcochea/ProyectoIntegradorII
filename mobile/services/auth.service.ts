import { api } from './api'; import type { LoginResponse, MfaFlow, MfaMethod, Role, Session } from '@/models';
const role = (value?: string): Role | null => { const v = value?.replace(/^ROLE_/, '').toUpperCase(); return v === 'CLIENTE' || v === 'PROVEEDOR' || v === 'ADMIN' ? v : null; };
export const authService = {
  login: (correo: string, password: string) => api.post<LoginResponse>('/auth/login', { correo, password }).then(r => r.data),
  verifyMfa: (flow: MfaFlow, code: string) => api.post('/auth/mfa/verify', { email: flow.email, tempToken: flow.tempToken, code, purpose: flow.purpose, method: flow.method || 'email' }).then(r => r.data),
  resendMfa: (flow: MfaFlow) => api.post('/auth/mfa/resend', { email: flow.email, tempToken: flow.tempToken, method: flow.method || 'email' }).then(r => r.data),
  startMfaChallenge: (email: string, purpose: string, method: MfaMethod) => api.post('/auth/mfa/challenge', { email, purpose, method }).then(r => r.data),
  startClientRegistration: (body: Record<string, unknown>) => api.post('/auth/register-client/start', body).then(r => r.data),
  startProviderRegistration: (body: Record<string, unknown>) => api.post('/auth/register-provider/start', body).then(r => r.data),
  startPasswordReset: (email: string) => api.post('/auth/forgot-password/start', { email, purpose: 'PASSWORD_RESET', method: 'email' }).then(r => r.data),
  completePasswordReset: (body: Record<string, string>) => api.post('/auth/forgot-password/complete', body).then(r => r.data),
  sessionFrom: (response: LoginResponse): Session | null => { const r = role(response.rol || response.role); return response.token && r ? { token: response.token, role: r, email: response.correo || response.email || '', idUsuario: String(response.idUsuario || '') } : null; }
};
