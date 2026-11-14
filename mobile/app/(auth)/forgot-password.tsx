import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthEntrance, AuthHeader } from '@/components/auth-ui';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { storage } from '@/services/storage';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { apiError } from '@/services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useStyles();
  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return Alert.alert('Correo inválido', 'Ingresa un correo válido.');
    setLoading(true);
    try {
      const response = await authService.startPasswordReset(email);
      await storage.setMfa({ email: response.email || email, tempToken: response.tempToken, purpose: response.purpose || 'PASSWORD_RESET' });
      router.push('/mfa');
    } catch (error) {
      Alert.alert('No se pudo enviar el código', apiError(error));
    } finally {
      setLoading(false);
    }
  };
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><AuthEntrance style={styles.shell}><AuthHeader eyebrow="RECUPERACIÓN" title="Recupera tu contraseña" description="Te enviaremos un código de verificación para restablecer el acceso a tu cuenta." /><View style={styles.form}><Text style={styles.formTitle}>Correo de la cuenta</Text><Text style={styles.formCopy}>Escribe el correo con el que te registraste.</Text><Input label="Correo corporativo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nombre@empresa.com" /><Button title="Enviar código" onPress={() => void submit()} loading={loading} /></View></AuthEntrance></ScrollView></SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  shell: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  form: { backgroundColor: c.surfaceRaised, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: c.border },
  formTitle: { fontSize: 19, fontWeight: '800', color: c.text, marginBottom: 5 },
  formCopy: { color: c.muted, lineHeight: 20, marginBottom: spacing.lg },
}));
