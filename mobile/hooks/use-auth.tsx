import { createContext, useContext, useEffect, useState } from 'react'; import { Alert } from 'react-native'; import { router } from 'expo-router'; import type { Session } from '@/models'; import { storage } from '@/services/storage';
type AuthContext = { session: Session | null; ready: boolean; signIn: (s: Session) => Promise<void>; signOut: () => Promise<void> };
export const homeForRole = (_role: Session['role']) => '/(tabs)' as any;
const Context = createContext<AuthContext | null>(null);
/** A screen's in-flight request (including one still waiting on api.ts's own retry backoff) can
 * resolve or reject well after the user has moved on — most noticeably right after signing out,
 * where its catch block's Alert.alert(...) then pops a confusing 403/503 over the login screen.
 * Give sign-out a short grace window where alerts are swallowed instead of threading a
 * cancellation flag through every screen's load(). Login's own error alerts are unaffected since
 * they fire well outside this window (there was never a session to sign out of). */
let suppressAlertsUntil = 0;
const nativeAlert = Alert.alert.bind(Alert);
Alert.alert = ((...args: Parameters<typeof Alert.alert>) => { if (Date.now() < suppressAlertsUntil) return; return nativeAlert(...args); }) as typeof Alert.alert;
export function AuthProvider({ children }: { children: React.ReactNode }) { const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false); useEffect(() => { storage.getSession().then(setSession).finally(() => setReady(true)); }, []); const signIn = async (s: Session) => { suppressAlertsUntil = 0; await storage.setSession(s); setSession(s); router.replace(homeForRole(s.role)); }; const signOut = async () => { suppressAlertsUntil = Date.now() + 15000; await storage.clearSession(); setSession(null); router.replace('/(auth)/login'); }; return <Context.Provider value={{ session, ready, signIn, signOut }}>{children}</Context.Provider>; }
export const useAuth = () => { const context = useContext(Context); if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider'); return context; };
