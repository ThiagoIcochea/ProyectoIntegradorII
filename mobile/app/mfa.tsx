import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { MfaFlow, MfaMethod } from '@/models';
import { apiError } from '@/services/api';
import { authService } from '@/services/auth.service';
import { storage } from '@/services/storage';

const labels: Record<MfaMethod, string> = { email: 'Correo', sms: 'SMS', whatsapp: 'WhatsApp', call: 'Llamada' };

export default function Mfa() {
  const { signIn } = useAuth();
  const [flow, setFlow] = useState<MfaFlow | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [expiresSeconds, setExpiresSeconds] = useState(300);
  const expiry = useRef(Date.now() + 300000);
  const styles = useStyles();

  useEffect(() => {
    void storage.getMfa().then(value => {
      if (!value) { router.replace('/(auth)/login'); return; }
      const next = { ...value, method: value.method || 'email' } as MfaFlow;
      setFlow(next);
      expiry.current = Date.now() + (next.expiresInSeconds || 300) * 1000;
      setExpiresSeconds(next.expiresInSeconds || 300);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendSeconds(value => Math.max(0, value - 1));
      setExpiresSeconds(Math.max(0, Math.ceil((expiry.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const changeMethod = async (method: MfaMethod) => {
    if (!flow || flow.emailOnly || method === flow.method) return;
    setLoading(true);
    try {
      const start = await authService.startMfaChallenge(flow.email, flow.purpose, method);
      const next = { ...flow, method, tempToken: start.tempToken || flow.tempToken, expiresInSeconds: start.expiresInSeconds || flow.expiresInSeconds };
      await storage.setMfa(next);
      setFlow(next);
      setCode('');
      setResendSeconds(30);
      expiry.current = Date.now() + (start.expiresInSeconds || 300) * 1000;
      Alert.alert('Canal actualizado', `Enviamos un nuevo código por ${labels[method]}.`);
    } catch (error) { Alert.alert('No se pudo cambiar el canal', apiError(error)); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (!flow || !/^\d{6}$/.test(code)) { Alert.alert('Código inválido', 'Ingresa los 6 dígitos de verificación.'); return; }
    setLoading(true);
    try {
      const response = await authService.verifyMfa(flow, code);
      if (flow.purpose === 'PASSWORD_RESET' && response.mfaActionToken) {
        await storage.clearMfa();
        router.replace({ pathname: '/(auth)/reset-password', params: { email: flow.email, token: response.mfaActionToken } });
        return;
      }
      if (response.mfaActionToken) {
        await storage.setMfaAction(response.mfaActionToken);
        await storage.clearMfa();
        router.back();
        return;
      }
      const session = authService.sessionFrom(response.login || response);
      if (!session) throw new Error('No se pudo completar la sesión.');
      await storage.clearMfa();
      await signIn(session);
    } catch (error) { Alert.alert('Verificación no completada', apiError(error)); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!flow || resendSeconds) return;
    setLoading(true);
    try {
      const response = await authService.resendMfa(flow);
      const next = { ...flow, tempToken: response.tempToken || flow.tempToken, expiresInSeconds: response.expiresInSeconds || flow.expiresInSeconds };
      await storage.setMfa(next);
      setFlow(next);
      setResendSeconds(30);
      expiry.current = Date.now() + (response.expiresInSeconds || 300) * 1000;
      Alert.alert('Código reenviado', `Revisa ${labels[next.method || 'email']}.`);
    } catch (error) { Alert.alert('No fue posible reenviar el código', apiError(error)); }
    finally { setLoading(false); }
  };

  return <SafeAreaView style={styles.root}><View style={styles.content}><Text accessible={false} style={styles.icon}>MFA</Text><Text accessibilityRole="header" style={styles.title}>Verificación multifactor</Text><Text style={styles.text}>Confirma el código enviado a{`\n`}{flow?.email || 'tu correo'}.</Text>{!flow?.emailOnly ? <View accessibilityRole="radiogroup" style={styles.methods}>{(Object.keys(labels) as MfaMethod[]).map(method => { const selected = flow?.method === method; return <Pressable key={method} accessibilityRole="radio" accessibilityLabel={`Recibir código por ${labels[method]}`} accessibilityState={{ selected, disabled: loading }} disabled={loading} onPress={() => void changeMethod(method)} style={({ pressed }) => [styles.method, selected && styles.methodActive, pressed && !loading && styles.methodPressed]}><Text style={[styles.methodText, selected && styles.methodTextActive]}>{labels[method]}</Text></Pressable>; })}</View> : <Text style={styles.emailOnly}>Registro protegido por correo electrónico.</Text>}<Input label="Código de 6 dígitos" accessibilityHint="Ingresa el código de verificación enviado a tu canal seleccionado" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" /><Text accessibilityLiveRegion="polite" style={styles.timer}>El código expira en {expiresSeconds}s.</Text><Button title="Verificar" onPress={verify} loading={loading} /><Button title={resendSeconds ? `Reenviar en ${resendSeconds}s` : 'Reenviar código'} variant="secondary" onPress={resend} disabled={Boolean(resendSeconds) || loading} /><Button title="Volver al inicio de sesión" variant="secondary" onPress={() => router.replace('/(auth)/login')} /></View></SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', padding: spacing.lg },
  content: { backgroundColor: c.surfaceRaised, padding: spacing.lg, borderRadius: 20, gap: spacing.md, borderWidth: 1, borderColor: c.border },
  icon: { fontSize: 17, fontWeight: '900', color: '#fff', backgroundColor: c.navy, alignSelf: 'center', padding: 13, borderRadius: 24 },
  title: { fontSize: 24, fontWeight: '800', color: c.text, textAlign: 'center' },
  text: { color: c.muted, textAlign: 'center', lineHeight: 21 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  method: { minHeight: 44, paddingHorizontal: 11, borderWidth: 1, borderColor: c.border, borderRadius: 10, justifyContent: 'center' },
  methodActive: { borderColor: c.primary, backgroundColor: c.surfaceSoft },
  methodPressed: { opacity: 0.72 },
  methodText: { fontWeight: '700', color: c.muted },
  methodTextActive: { color: c.primary },
  emailOnly: { textAlign: 'center', color: c.primaryDark, fontWeight: '700' },
  timer: { textAlign: 'center', color: c.muted, fontSize: 12 }
}));
