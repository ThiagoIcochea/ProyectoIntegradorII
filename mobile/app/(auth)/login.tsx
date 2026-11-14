import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AuthEntrance, AuthScreenSkeleton } from '@/components/auth-ui';
import { Button, Input } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { authService } from '@/services/auth.service';
import { storage } from '@/services/storage';
import { apiError } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function Login() {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const styles = useStyles();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let active = true;
    storage.getRememberedEmail().then(value => {
      if (!active || !value) return;
      setCorreo(value);
      setRemember(true);
    }).finally(() => {
      if (active) setHydrating(false);
    });
    return () => { active = false; };
  }, []);

  const submit = async () => {
    if (!correo.trim() || !password.trim()) return Alert.alert('Datos requeridos', 'Ingresa tu correo y contraseña.');
    setLoading(true);
    try {
      const res = await authService.login(correo.trim(), password);
      if (remember) await storage.setRememberedEmail(correo.trim()); else await storage.clearRememberedEmail();
      if (res.requiresMfa && res.tempToken) {
        await storage.setMfa({ email: res.email || res.correo || correo.trim(), tempToken: res.tempToken, purpose: res.purpose || 'LOGIN', expiresInSeconds: res.expiresInSeconds });
        router.push('/mfa');
        return;
      }
      const session = authService.sessionFrom(res);
      if (!session) throw new Error('La respuesta de inicio de sesión está incompleta.');
      await signIn(session);
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', apiError(error, 'Credenciales incorrectas o usuario inactivo.'));
    } finally {
      setLoading(false);
    }
  };

  if (hydrating) return <AuthScreenSkeleton fields={2} />;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AuthEntrance style={styles.shell}>
        <View style={styles.brand}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cambiar tema" onPress={() => void toggleTheme()} style={styles.logo}>
            <Text style={styles.logoText}>N</Text>
          </Pressable>
          <Text style={styles.themeHint}>Tema {theme === 'dark' ? 'oscuro' : 'claro'} · toca el logo para cambiarlo</Text>
          <Text style={styles.title}>Bienvenido a Nethink</Text>
          <Text style={styles.subtitle}>Gestiona compras, cotizaciones y oportunidades B2B desde un solo lugar.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.formTitle}>Inicia sesión</Text>
          <Text style={styles.formIntro}>Usa las credenciales de tu cuenta corporativa.</Text>
          <Input label="Correo corporativo" autoCapitalize="none" keyboardType="email-address" value={correo} onChangeText={setCorreo} placeholder="nombre@empresa.com" />
          <Input label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }} onPress={() => setRemember(value => !value)} style={styles.remember} hitSlop={4}>
            <View style={[styles.check, remember && styles.checked]}>{remember && <Text style={styles.checkText}>✓</Text>}</View>
            <Text style={styles.muted}>Recordar mi correo</Text>
          </Pressable>
          <Button title="Iniciar sesión" onPress={() => void submit()} loading={loading} />
          <Link href="/(auth)/forgot-password" style={styles.link}>¿Olvidaste tu contraseña?</Link>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.muted}>¿Aún no tienes cuenta?</Text><View style={styles.line} /></View>
          <Button title="Crear una cuenta" variant="secondary" onPress={() => router.push('/(auth)/role-selection')} />
        </View>
      </AuthEntrance>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  shell: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: c.primaryLight },
  logoText: { fontSize: 33, fontWeight: '800', color: '#fff' },
  themeHint: { color: c.muted, fontSize: 12, marginBottom: 12, textAlign: 'center' },
  title: { fontSize: 29, fontWeight: '800', color: c.textBright, letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { color: c.muted, marginTop: 7, lineHeight: 21, textAlign: 'center', maxWidth: 350 },
  form: { backgroundColor: c.surfaceRaised, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: c.border },
  formTitle: { color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  formIntro: { color: c.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  remember: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: -2, marginBottom: spacing.md },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary, borderColor: c.primary },
  checkText: { color: '#fff', fontWeight: '800' },
  muted: { color: c.muted, fontSize: 13 },
  link: { color: c.accentText, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: c.border },
}));
