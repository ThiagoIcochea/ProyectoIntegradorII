import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ThemeProvider } from '@/hooks/use-theme';
import { VoiceAssistant } from '@/components/voice-assistant';
import { b2bService } from '@/services/b2b.service';

function AccessGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth(); const segments = useSegments();
  useEffect(() => { if (!ready) return; const root = segments[0]; const route = segments.join('/'); const publicRoute = root === '(auth)' || route === 'mfa'; if (!session && !publicRoute) router.replace('/(auth)/login'); if (session && root === '(auth)') router.replace('/(tabs)' as any); if (!session || publicRoute) return; const client = route.includes('catalog') || route.includes('rfq-') || route.includes('quotation') || route.includes('history') || route.includes('request/') || route === 'payment' || route === 'reviews' || route === 'top-providers'; const provider = route.includes('provider-'); const admin = route.includes('admin-operations'); const requestsTab = route.endsWith('/requests'); if ((session.role !== 'CLIENTE' && client) || (session.role !== 'PROVEEDOR' && provider) || (session.role !== 'ADMIN' && admin) || (session.role === 'ADMIN' && requestsTab)) router.replace('/(tabs)' as any); }, [ready, session, segments]);
  useEffect(() => { if (!ready || session?.role !== 'PROVEEDOR' || !session.idUsuario) return; const route=segments.join('/'); if(route.includes('provider-plans')) return; void b2bService.subscriptionStatus(Number(session.idUsuario)).then(status => { const blocked=status?.bloqueado===true || String(status?.estado||'').toUpperCase()!=='ACTIVA'; if(blocked) router.replace('/provider-plans'); }).catch(()=>undefined); }, [ready, session?.idUsuario, session?.role, segments]);
  return <>{children}</>;
}
function AppShell() { const { session } = useAuth(); return <AccessGate><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(auth)" /><Stack.Screen name="(tabs)" /><Stack.Screen name="mfa" /><Stack.Screen name="provider-operations" /><Stack.Screen name="provider-plans" /><Stack.Screen name="admin-operations" /><Stack.Screen name="payment" /></Stack>{session ? <VoiceAssistant /> : null}</AccessGate>; }
export default function RootLayout() { return <SafeAreaProvider><ThemeProvider><AuthProvider><AppShell /></AuthProvider></ThemeProvider></SafeAreaProvider>; }
