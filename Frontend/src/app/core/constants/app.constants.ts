// Centralized app constants to keep API and storage changes in one place.
export const APP_API_BASE_URL = 'https://proyectoinnovacion.onrender.com/api';
export const APP_API_ORIGIN = 'https://proyectoinnovacion.onrender.com';
export const APP_FRONTEND_ORIGIN = 'https://proyectoinnovacion-1.onrender.com';

export const APP_STORAGE_KEYS = {
  token: 'token',
  role: 'rol',
  rfqCart: 'rfq_cart',
  selectedProvider: 'selected_provider',
  currentSolicitudId: 'current_solicitud_id'
} as const;

export const APP_ROUTE_PATHS = {
  login: '/login',
  appRoot: '/app',
  clientDashboard: '/app/dashboard',
  clientRequests: '/app/requests',
  clientHistory: '/app/history',
  clientProfile: '/app/profile',
  rfqCatalog: '/app/rfq/catalog',
  rfqResults: '/app/rfq/results',
  rfqQuotation: '/app/rfq/quotation',
  rfqPayment: '/app/rfq/payment',
  adminDashboard: '/app/admin/dashboard',
  providerDashboard: '/app/provider/dashboard',
  providerRequests: '/app/provider/requests'
} as const;
