import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthEntrance, AuthHeader } from '@/components/auth-ui';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { storage } from '@/services/storage';
import { apiError } from '@/services/api';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const initial = { nombres: '', apellidos: '', correo: '', telefono: '', whatsapp: '', password: '', direccion: '', fotoPerfil: '' };

const fieldMeta = {
  nombres: { label: 'Nombres', placeholder: 'Ej. Andrea María' },
  apellidos: { label: 'Apellidos (opcional)', placeholder: 'Ej. Torres Paredes' },
  correo: { label: 'Correo corporativo', placeholder: 'nombre@empresa.com' },
  telefono: { label: 'Teléfono', placeholder: 'Ej. 987 654 321' },
  whatsapp: { label: 'WhatsApp', placeholder: 'Ej. 987 654 321' },
  direccion: { label: 'Dirección', placeholder: 'Ej. Av. Arequipa 123, Lima' },
} as const;

export default function RegisterClient() {
  const [form, setForm] = useState(initial);
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const styles = useStyles();
  const set = (key: keyof typeof initial) => (value: string) => setForm(current => ({ ...current, [key]: value }));

  const submit = async () => {
    if (Object.entries(form).some(([key, value]) => key !== 'apellidos' && key !== 'fotoPerfil' && !value.trim()) || !accept) return Alert.alert('Revisa el formulario', 'Completa los campos obligatorios y acepta los términos.');
    if (!/^\S+@\S+\.\S+$/.test(form.correo) || !/^9\d{8}$/.test(form.telefono.replace(/\D/g, '')) || !/^9\d{8}$/.test(form.whatsapp.replace(/\D/g, '')) || !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(form.password)) return Alert.alert('Datos inválidos', 'Usa correo válido, teléfonos peruanos y una contraseña de 8 caracteres con mayúscula, minúscula y número.');
    setLoading(true);
    try {
      const response = await authService.startClientRegistration({ ...form, telefono: form.telefono.replace(/\D/g, ''), whatsapp: form.whatsapp.replace(/\D/g, '') });
      await storage.setMfa({ email: response.email || form.correo, tempToken: response.tempToken, purpose: response.purpose || 'REGISTER_CLIENT' });
      router.replace('/mfa');
    } catch (error) {
      Alert.alert('No se pudo registrar', apiError(error));
    } finally {
      setLoading(false);
    }
  };

  return <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthEntrance style={styles.shell}>
          <AuthHeader eyebrow="CUENTA DE CLIENTE" title="Crea tu perfil" description="Te enviaremos un código de verificación al correo que registres." />
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Datos de contacto</Text>
            <Text style={styles.sectionCopy}>Ingresa información real para que tus compras y cotizaciones estén correctamente asociadas.</Text>
            {(Object.keys(fieldMeta) as Array<keyof typeof fieldMeta>).map(key => <Input key={key} label={fieldMeta[key].label} placeholder={fieldMeta[key].placeholder} value={form[key]} onChangeText={set(key)} autoCapitalize={key === 'correo' ? 'none' : 'words'} keyboardType={key === 'correo' ? 'email-address' : key === 'telefono' || key === 'whatsapp' ? 'phone-pad' : 'default'} />)}
            <Input label="Contraseña" secureTextEntry value={form.password} onChangeText={set('password')} placeholder="Ej. Compra2026" />
            <Text style={styles.help}>Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.</Text>
            <Input label="Foto de perfil URL (opcional)" autoCapitalize="none" value={form.fotoPerfil} onChangeText={set('fotoPerfil')} placeholder="https://ejemplo.com/perfil.jpg" />
            <View style={styles.accept}>
              <Switch value={accept} onValueChange={setAccept} trackColor={{ false: styles.switchOff.color, true: styles.switchOn.color }} />
              <Text style={styles.acceptText}>Acepto los términos, condiciones y política de privacidad.</Text>
            </View>
            <Button title="Continuar con verificación" onPress={() => void submit()} loading={loading} />
          </View>
        </AuthEntrance>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { paddingHorizontal: 20, paddingVertical: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  form: { backgroundColor: c.surfaceRaised, borderRadius: 22, borderWidth: 1, borderColor: c.border, padding: 20 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: c.text, marginBottom: 5 },
  sectionCopy: { color: c.muted, lineHeight: 20, marginBottom: spacing.lg },
  help: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: spacing.md },
  accept: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 2, marginBottom: spacing.lg },
  acceptText: { color: c.textSoft, lineHeight: 20, flex: 1 },
  switchOff: { color: c.border },
  switchOn: { color: c.primary },
}));
