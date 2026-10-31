import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Session, MfaFlow } from '@/models';

const SESSION = 'nethink.session';
const MFA = 'nethink.mfa';
const MFA_ACTION = 'nethink.mfa-action';
const EMAIL = 'nethink.remembered-email';
const RFQ_CART = 'nethink.rfq-cart';
const SELECTED_PROVIDER = 'nethink.selected-provider';

// SecureStore is native-only. The browser preview uses localStorage so the same
// UI can be rendered on Expo web while iOS and Android retain secure storage.
const webStorage = () => Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
const getItem = async (key: string) => {
  const storage = webStorage();
  return storage ? storage.getItem(key) : SecureStore.getItemAsync(key);
};
const setItem = async (key: string, value: string) => {
  const storage = webStorage();
  if (storage) { storage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
};
const removeItem = async (key: string) => {
  const storage = webStorage();
  if (storage) { storage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
};

export const storage = {
  getSession: async (): Promise<Session | null> => { const value = await getItem(SESSION); return value ? JSON.parse(value) : null; },
  setSession: (value: Session) => setItem(SESSION, JSON.stringify(value)),
  clearSession: () => removeItem(SESSION),
  getMfa: async (): Promise<MfaFlow | null> => { const value = await getItem(MFA); return value ? JSON.parse(value) : null; },
  setMfa: (value: MfaFlow) => setItem(MFA, JSON.stringify(value)),
  clearMfa: () => removeItem(MFA),
  getMfaAction: () => getItem(MFA_ACTION),
  setMfaAction: (value: string) => setItem(MFA_ACTION, value),
  clearMfaAction: () => removeItem(MFA_ACTION),
  getRememberedEmail: () => getItem(EMAIL),
  setRememberedEmail: (email: string) => setItem(EMAIL, email),
  clearRememberedEmail: () => removeItem(EMAIL),
  getCart: async <T>(): Promise<T[]> => { const value = await getItem(RFQ_CART); return value ? JSON.parse(value) : []; },
  setCart: <T>(items: T[]) => setItem(RFQ_CART, JSON.stringify(items)),
  clearCart: () => removeItem(RFQ_CART),
  getSelectedProvider: async <T>(): Promise<T | null> => { const value = await getItem(SELECTED_PROVIDER); return value ? JSON.parse(value) : null; },
  setSelectedProvider: <T>(provider: T) => setItem(SELECTED_PROVIDER, JSON.stringify(provider)),
  clearSelectedProvider: () => removeItem(SELECTED_PROVIDER),
};
