import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthEntrance, AuthHeader, AuthScreenSkeleton } from '@/components/auth-ui';
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
    storage.getMfa().then(value => {
      if (!value) router.replace('/(auth)/login');
      else {
        const next = { ...value, method: value.method || 'email' } as MfaFlow;
        setFlow(next);
        expiry.current = Date.now() + (next.expiresInSeconds || 300) * 1000;
        setExpiresSeconds(next.expiresInSeconds || 300);
      }
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
    } catch (error) {
      Alert.alert('No se pudo cambiar el canal', apiError(error));
    } finally {
      setLoading(false);
    }
  };
  const verify = async () => {
    if (!flow || !/^\d{6}$/.test(code)) return Alert.alert('Código inválido', 'Ingresa los 6 dígitos de verificación.');
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
    } catch (error) {
      Alert.alert('Verificación no completada', apiError(error));
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      Alert.alert('No fue posible reenviar el código', apiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!flow) return <AuthScreenSkeleton fields={1} />;
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><AuthEntrance style={styles.shell}>
    <AuthHeader eyebrow="VERIFICACIÓN" title="Confirma tu identidad" description={`Enviamos un código de seguridad a ${flow.email}.`} />
    <View style={styles.form}>
      <Text style={styles.formTitle}>Código de verificación</Text>
      {!flow.emailOnly ? <View style={styles.methods}>{(Object.keys(labels) as MfaMethod[]).map(method => <Pressable key={method} accessibilityRole="button" disabled={loading} onPress={() => void changeMethod(method)} style={({ pressed }) => [styles.method, flow.method === method && styles.methodActive, pressed && styles.methodPressed]}><Text style={[styles.methodText, flow.method === method && styles.methodTextActive]}>{labels[method]}</Text></Pressable>)}</View> : <Text style={styles.emailOnly}>Registro protegido por correo electrónico.</Text>}
      <Input label="Código de 6 dígitos" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="Ej. 123456" />
      <Text style={styles.timer}>El código expira en {expiresSeconds}s.</Text>
      <Button title="Verificar" onPress={() => void verify()} loading={loading} />
      <Button title={resendSeconds ? `Reenviar en ${resendSeconds}s` : 'Reenviar código'} variant="secondary" onPress={() => void resend()} disabled={Boolean(resendSeconds) || loading} />
      <Button title="Volver al inicio de sesión" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
    </View>
  </AuthEntrance></ScrollView></SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  shell: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  form: { backgroundColor: c.surfaceRaised, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: c.border, gap: spacing.md },
  formTitle: { fontSize: 19, fontWeight: '800', color: c.text, marginBottom: -4 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 11, borderWidth: 1, borderColor: c.border, borderRadius: 12, justifyContent: 'center' },
  methodActive: { borderColor: c.primary, backgroundColor: c.surfaceSoft },
  methodPressed: { opacity: .78 },
  methodText: { fontWeight: '700', color: c.muted },
  methodTextActive: { color: c.accentText },
  emailOnly: { color: c.accentText, fontWeight: '700', lineHeight: 20 },
  timer: { color: c.muted, fontSize: 12, marginTop: -6 },
}));
