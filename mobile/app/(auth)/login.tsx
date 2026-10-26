import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
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

  useEffect(() => {
    void storage.getRememberedEmail().then(value => {
      if (value) {
        setCorreo(value);
        setRemember(true);
      }
    });
  }, []);

  const submit = async () => {
    if (!correo.trim() || !password.trim()) {
      Alert.alert('Datos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(correo.trim(), password);
      if (remember) await storage.setRememberedEmail(correo.trim());
      else await storage.clearRememberedEmail();

      if (response.requiresMfa && response.tempToken) {
        await storage.setMfa({ email: response.email || response.correo || correo.trim(), tempToken: response.tempToken, purpose: response.purpose || 'LOGIN', expiresInSeconds: response.expiresInSeconds });
        router.push('/mfa');
        return;
      }

      const session = authService.sessionFrom(response);
      if (!session) throw new Error('La respuesta de inicio de sesión está incompleta.');
      await signIn(session);
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', apiError(error, 'Credenciales incorrectas o usuario inactivo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`} accessibilityHint="Cambia el contraste visual de la aplicación" onPress={() => void toggleTheme()} style={({ pressed }) => [styles.logo, pressed && styles.logoPressed]}>
            <Text style={styles.logoText}>N</Text>
          </Pressable>
          <Text style={styles.themeHint}>Tema {theme === 'dark' ? 'oscuro' : 'claro'}</Text>
          <Text accessibilityRole="header" style={styles.title}>Nethink B2B</Text>
          <Text style={styles.subtitle}>Gestiona tus compras y oportunidades.</Text>
        </View>

        <View style={styles.form}>
          <Input label="Correo corporativo" accessibilityHint="Escribe el correo registrado para tu empresa" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={correo} onChangeText={setCorreo} placeholder="nombre@empresa.com" />
          <Input label="Contraseña" accessibilityHint="Escribe la contraseña de tu cuenta" autoComplete="current-password" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
          <Pressable accessibilityRole="checkbox" accessibilityLabel="Recordar mi correo" accessibilityState={{ checked: remember }} hitSlop={6} onPress={() => setRemember(value => !value)} style={({ pressed }) => [styles.remember, pressed && styles.rememberPressed]}>
            <View accessible={false} style={[styles.check, remember && styles.checked]}>{remember && <Text style={styles.checkText}>✓</Text>}</View>
            <Text style={styles.muted}>Recordar mi correo</Text>
          </Pressable>
          <Button title="Iniciar sesión" loading={loading} accessibilityHint="Valida tus datos e ingresa a tu panel" onPress={submit} />
          <Link href="/(auth)/forgot-password" accessibilityRole="link" style={styles.link}>¿Olvidaste tu contraseña?</Link>
          <View style={styles.divider}><View style={styles.line} /><Text style={styles.muted}>¿Aún no tienes cuenta?</Text><View style={styles.line} /></View>
          <Button title="Crear una cuenta" variant="secondary" onPress={() => router.push('/(auth)/role-selection')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  themeHint: { color: c.muted, fontSize: 12, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: c.text },
  subtitle: { color: c.muted, marginTop: 6, textAlign: 'center' },
  form: { backgroundColor: c.surfaceRaised, borderRadius: 20, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: c.border },
  remember: { minHeight: 44, flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 4, borderRadius: 10 },
  rememberPressed: { opacity: 0.72 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary, borderColor: c.primary },
  checkText: { color: '#fff', fontWeight: '800' },
  muted: { color: c.muted, fontSize: 13 },
  link: { color: c.accentText, fontWeight: '700', textAlign: 'center', padding: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: c.border }
}));
