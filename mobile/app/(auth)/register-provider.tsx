import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthEntrance, AuthHeader, AuthScreenSkeleton } from '@/components/auth-ui';
import { Button, Card, Input } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { storage } from '@/services/storage';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type Payment = { tipo: string; entidad: string; numeroCuenta: string };
type Cert = { idCertificacion: number; fechaObtencion: string; fechaExpiracion: string };

const initial = { nombres: '', apellidos: '', correo: '', telefono: '', whatsapp: '', password: '', direccion: '', ruc: '', razonSocial: '', descripcion: '', apiUrl: '', apiTipo: 'REST', apiToken: '' };

const contactMeta = {
  nombres: { label: 'Nombres', placeholder: 'Ej. Andrea María' },
  apellidos: { label: 'Apellidos', placeholder: 'Ej. Torres Paredes' },
  correo: { label: 'Correo corporativo', placeholder: 'nombre@empresa.com' },
  telefono: { label: 'Teléfono', placeholder: 'Ej. 987 654 321' },
  whatsapp: { label: 'WhatsApp', placeholder: 'Ej. 987 654 321' },
  direccion: { label: 'Dirección', placeholder: 'Ej. Av. Arequipa 123, Lima' },
} as const;

export default function RegisterProvider() {
  const [form, setForm] = useState(initial);
  const [certs, setCerts] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<Cert[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payment, setPayment] = useState<Payment>({ tipo: '', entidad: '', numeroCuenta: '' });
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [rucOk, setRucOk] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useStyles();

  const set = (key: keyof typeof initial) => (value: string) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    b2bService.certifications().then(data => setCerts(Array.isArray(data) ? data : data?.data || [])).catch(() => setCerts([]));
  }, []);

  const lookup = async () => {
    if (!/^(10|20)\d{9}$/.test(form.ruc)) return Alert.alert('RUC inválido', 'Ingresa 11 dígitos que inicien con 10 o 20.');
    setChecking(true);
    try {
      const company: any = await b2bService.providerRuc(form.ruc);
      if (!company?.razonSocial) return Alert.alert('Consulta incompleta', 'SUNAT no devolvió una razón social válida.');
      setForm(current => ({ ...current, razonSocial: company.razonSocial, descripcion: company.actividadEconomica || company.descripcion || '' }));
      setRucOk(form.ruc);
    } catch (error) {
      setRucOk('');
      Alert.alert('No se pudo consultar el RUC', apiError(error));
    } finally {
      setChecking(false);
    }
  };

  const selectCert = (id: number, enabled: boolean) => setSelected(current => enabled ? [...current, { idCertificacion: id, fechaObtencion: '', fechaExpiracion: '' }] : current.filter(cert => cert.idCertificacion !== id));
  const updateCert = (id: number, key: 'fechaObtencion' | 'fechaExpiracion', value: string) => setSelected(current => current.map(cert => cert.idCertificacion === id ? { ...cert, [key]: value } : cert));

  const addPayment = () => {
    const account = payment.numeroCuenta.replace(/\D/g, '');
    if (!payment.tipo || !payment.entidad || !account) return Alert.alert('Método de pago', 'Completa tipo, entidad y número de cuenta.');
    if (['YAPE', 'PLIN'].includes(payment.tipo.toUpperCase()) ? !/^9\d{8}$/.test(account) : !/^\d{6,30}$/.test(account)) return Alert.alert('Cuenta inválida', 'Yape/Plin requiere celular peruano; una cuenta bancaria entre 6 y 30 dígitos.');
    setPayments(current => [...current, { ...payment, numeroCuenta: account }]);
    setPayment({ tipo: '', entidad: '', numeroCuenta: '' });
  };

  const submit = async () => {
    const required = ['nombres', 'apellidos', 'correo', 'telefono', 'whatsapp', 'password', 'direccion', 'ruc', 'razonSocial', 'descripcion', 'apiUrl', 'apiTipo'];
    if (required.some(key => !form[key as keyof typeof form].trim())) return Alert.alert('Revisa el formulario', 'Completa todos los campos obligatorios.');
    if (rucOk !== form.ruc) return Alert.alert('Consulta RUC requerida', 'Consulta el RUC antes de continuar.');
    if (!/^\S+@\S+\.\S+$/.test(form.correo) || !/^9\d{8}$/.test(form.telefono.replace(/\D/g, '')) || !/^9\d{8}$/.test(form.whatsapp.replace(/\D/g, '')) || !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}/.test(form.password)) return Alert.alert('Datos inválidos', 'Revisa correo, teléfonos y contraseña.');
    if (!payments.length || !selected.length || selected.some(cert => !cert.fechaObtencion || !cert.fechaExpiracion) || !accepted) return Alert.alert('Datos pendientes', 'Agrega un método de pago, certificaciones con fechas y acepta los términos.');
    setLoading(true);
    try {
      const response = await authService.startProviderRegistration({ ...form, telefono: form.telefono.replace(/\D/g, ''), whatsapp: form.whatsapp.replace(/\D/g, ''), certificaciones: selected, metodosPago: payments });
      await storage.setMfa({ email: response.email || form.correo, tempToken: response.tempToken, purpose: response.purpose || 'REGISTER_PROVIDER', expiresInSeconds: response.expiresInSeconds, emailOnly: true });
      router.replace('/mfa');
    } catch (error) {
      Alert.alert('No se pudo registrar', apiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!certs) return <AuthScreenSkeleton fields={7} />;

  return <SafeAreaView style={styles.root}>
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthEntrance style={styles.shell}>
          <AuthHeader eyebrow="CUENTA DE PROVEEDOR" title="Registra tu empresa" description="Completa tus datos fiscales y comerciales. Validaremos tu RUC antes de enviar el registro." />
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Datos de contacto</Text>
            <Text style={styles.sectionCopy}>Esta información identificará a la persona responsable de la cuenta.</Text>
            {(Object.keys(contactMeta) as Array<keyof typeof contactMeta>).map(key => <Input key={key} label={contactMeta[key].label} placeholder={contactMeta[key].placeholder} value={form[key]} onChangeText={set(key)} autoCapitalize={key === 'correo' ? 'none' : 'words'} keyboardType={key === 'correo' ? 'email-address' : key === 'telefono' || key === 'whatsapp' ? 'phone-pad' : 'default'} />)}
            <Input label="Contraseña" secureTextEntry value={form.password} onChangeText={set('password')} placeholder="Ej. Empresa2026" />
            <Text style={styles.help}>Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.</Text>

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Datos de empresa</Text>
            <Text style={styles.sectionCopy}>Consulta el RUC para completar los datos oficiales de SUNAT.</Text>
            <Input label="RUC" value={form.ruc} onChangeText={value => { set('ruc')(value.replace(/\D/g, '').slice(0, 11)); setRucOk(''); }} keyboardType="number-pad" placeholder="Ej. 20123456789" />
            <Button title={checking ? 'Consultando RUC...' : 'Consultar RUC'} onPress={() => void lookup()} loading={checking} />
            {rucOk === form.ruc ? <Card style={styles.companyCard}><Text style={styles.company}>Empresa verificada</Text><Text style={styles.companyName}>{form.razonSocial}</Text><Text style={styles.copy}>{form.descripcion}</Text></Card> : null}

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Integración de catálogo</Text>
            <Text style={styles.sectionCopy}>Conecta la fuente de productos que deseas publicar.</Text>
            <Input label="URL de API" value={form.apiUrl} onChangeText={set('apiUrl')} autoCapitalize="none" placeholder="https://api.empresa.com/catalogo" />
            <Input label="Tipo de API" value={form.apiTipo} onChangeText={set('apiTipo')} autoCapitalize="characters" placeholder="Ej. REST" />
            <Input label="Token de API (opcional)" value={form.apiToken} onChangeText={set('apiToken')} autoCapitalize="none" placeholder="Ej. token_de_acceso_123" />

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Métodos de pago</Text>
            <Text style={styles.sectionCopy}>Añade al menos una cuenta para recibir pagos.</Text>
            <Input label="Tipo" value={payment.tipo} onChangeText={value => setPayment(current => ({ ...current, tipo: value }))} placeholder="Ej. Banco, Yape o Plin" />
            <Input label="Entidad" value={payment.entidad} onChangeText={value => setPayment(current => ({ ...current, entidad: value }))} placeholder="Ej. BCP" />
            <Input label="Número de cuenta" keyboardType="number-pad" value={payment.numeroCuenta} onChangeText={value => setPayment(current => ({ ...current, numeroCuenta: value }))} placeholder="Ej. 1911234567890" />
            <Button title="Agregar método de pago" variant="secondary" onPress={addPayment} />
            {payments.map((item, index) => <Card key={`${item.numeroCuenta}-${index}`} style={styles.listCard}><Text style={styles.company}>{item.tipo} · {item.entidad}</Text><Text style={styles.copy}>Cuenta terminada en {item.numeroCuenta.slice(-4)}</Text><Button title="Quitar" variant="danger" onPress={() => setPayments(current => current.filter((_, paymentIndex) => paymentIndex !== index))} /></Card>)}

            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            <Text style={styles.sectionCopy}>Selecciona las certificaciones vigentes de tu empresa.</Text>
            {certs.map((item: any) => {
              const id = Number(item.idCertificacion || item.id);
              const chosen = selected.find(cert => cert.idCertificacion === id);
              return <Card key={id} style={styles.certCard}>
                <View style={styles.row}><Text style={styles.company}>{item.nombre || item.certificacion}</Text><Switch value={Boolean(chosen)} onValueChange={value => selectCert(id, value)} trackColor={{ false: styles.switchOff.color, true: styles.switchOn.color }} /></View>
                {chosen ? <View style={styles.dates}><Input label="Fecha de obtención" value={chosen.fechaObtencion} onChangeText={value => updateCert(id, 'fechaObtencion', value)} placeholder="Ej. 2026-01-01" /><Input label="Fecha de expiración" value={chosen.fechaExpiracion} onChangeText={value => updateCert(id, 'fechaExpiracion', value)} placeholder="Ej. 2027-01-01" /></View> : null}
              </Card>;
            })}
            <View style={styles.accept}>
              <Switch value={accepted} onValueChange={setAccepted} trackColor={{ false: styles.switchOff.color, true: styles.switchOn.color }} />
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
  sectionDivider: { height: 1, backgroundColor: c.border, marginVertical: spacing.lg },
  help: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: spacing.md },
  companyCard: { marginTop: spacing.md, marginBottom: 2, borderColor: c.primary },
  listCard: { marginTop: spacing.md },
  certCard: { marginBottom: spacing.md },
  company: { fontSize: 15, fontWeight: '800', color: c.text },
  companyName: { fontSize: 17, fontWeight: '800', color: c.accentText },
  copy: { color: c.muted, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dates: { marginTop: spacing.sm },
  accept: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 2, marginBottom: spacing.lg },
  acceptText: { color: c.textSoft, lineHeight: 20, flex: 1 },
  switchOff: { color: c.border },
  switchOn: { color: c.primary },
}));
