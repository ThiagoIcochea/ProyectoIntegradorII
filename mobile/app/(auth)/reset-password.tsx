import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AuthEntrance, AuthHeader } from '@/components/auth-ui';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { apiError } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function ResetPassword() {
  const { signIn } = useAuth();
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useStyles();
  const submit = async () => {
    if (password !== confirmation) return Alert.alert('Las contraseñas no coinciden.');
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(password)) return Alert.alert('Contraseña débil', 'Debe tener 8 caracteres, mayúscula, minúscula y número.');
    setLoading(true);
    try {
      const response = await authService.completePasswordReset({ email, mfaActionToken: token, newPassword: password });
      const session = authService.sessionFrom(response.login || response);
      if (!session) throw new Error('No se pudo iniciar la nueva sesión.');
      await signIn(session);
    } catch (error) {
      Alert.alert('No se pudo actualizar', apiError(error));
    } finally {
      setLoading(false);
    }
  };
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><AuthEntrance style={styles.shell}><AuthHeader eyebrow="NUEVA CONTRASEÑA" title="Protege tu cuenta" description="Elige una contraseña nueva y segura para recuperar el acceso." /><View style={styles.form}><Text style={styles.formTitle}>Contraseña de acceso</Text><Text style={styles.formCopy}>Incluye mayúsculas, minúsculas y números.</Text><Input label="Nueva contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="Ej. Empresa2026" /><Input label="Confirmar contraseña" secureTextEntry value={confirmation} onChangeText={setConfirmation} placeholder="Repite tu contraseña" /><Button title="Actualizar contraseña" onPress={() => void submit()} loading={loading} /></View></AuthEntrance></ScrollView></SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  shell: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  form: { backgroundColor: c.surfaceRaised, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: c.border },
  formTitle: { fontSize: 19, fontWeight: '800', color: c.text, marginBottom: 5 },
  formCopy: { color: c.muted, lineHeight: 20, marginBottom: spacing.lg },
}));
