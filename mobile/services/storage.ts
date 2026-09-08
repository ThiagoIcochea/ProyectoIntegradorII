import * as SecureStore from 'expo-secure-store';
import type { Session, MfaFlow } from '@/models';
const SESSION = 'nethink.session'; const MFA = 'nethink.mfa'; const MFA_ACTION = 'nethink.mfa-action'; const EMAIL = 'nethink.remembered-email';
const RFQ_CART = 'nethink.rfq-cart'; const SELECTED_PROVIDER = 'nethink.selected-provider';
export const storage = {
  getSession: async (): Promise<Session | null> => { const value = await SecureStore.getItemAsync(SESSION); return value ? JSON.parse(value) : null; },
  setSession: (value: Session) => SecureStore.setItemAsync(SESSION, JSON.stringify(value)),
  clearSession: () => SecureStore.deleteItemAsync(SESSION),
  getMfa: async (): Promise<MfaFlow | null> => { const value = await SecureStore.getItemAsync(MFA); return value ? JSON.parse(value) : null; },
  setMfa: (value: MfaFlow) => SecureStore.setItemAsync(MFA, JSON.stringify(value)), clearMfa: () => SecureStore.deleteItemAsync(MFA), getMfaAction: () => SecureStore.getItemAsync(MFA_ACTION), setMfaAction: (value: string) => SecureStore.setItemAsync(MFA_ACTION, value), clearMfaAction: () => SecureStore.deleteItemAsync(MFA_ACTION),
  getRememberedEmail: () => SecureStore.getItemAsync(EMAIL), setRememberedEmail: (email: string) => SecureStore.setItemAsync(EMAIL, email), clearRememberedEmail: () => SecureStore.deleteItemAsync(EMAIL)
  ,getCart: async <T>(): Promise<T[]> => { const value = await SecureStore.getItemAsync(RFQ_CART); return value ? JSON.parse(value) : []; }, setCart: <T>(items: T[]) => SecureStore.setItemAsync(RFQ_CART, JSON.stringify(items)), clearCart: () => SecureStore.deleteItemAsync(RFQ_CART)
  ,getSelectedProvider: async <T>(): Promise<T | null> => { const value = await SecureStore.getItemAsync(SELECTED_PROVIDER); return value ? JSON.parse(value) : null; }, setSelectedProvider: <T>(provider: T) => SecureStore.setItemAsync(SELECTED_PROVIDER, JSON.stringify(provider)), clearSelectedProvider: () => SecureStore.deleteItemAsync(SELECTED_PROVIDER)
};
