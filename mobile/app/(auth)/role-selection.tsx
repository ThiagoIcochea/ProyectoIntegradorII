import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AuthEntrance, AuthHeader } from '@/components/auth-ui';
import { Button, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function RoleSelection() {
  const styles = useStyles();
  return <SafeAreaView style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AuthEntrance style={styles.shell}>
        <AuthHeader eyebrow="REGISTRO" title="Crea tu cuenta" description="Elige cómo participarás en Nethink. Podrás completar y verificar tus datos en el siguiente paso." />
        <View style={styles.cards}>
          <Card style={styles.roleCard}>
            <View style={[styles.iconWrap, styles.clientIcon]}><Text style={styles.icon}>🛒</Text></View>
            <View style={styles.cardCopy}><Text style={styles.cardTitle}>Quiero comprar</Text><Text style={styles.text}>Solicita cotizaciones y gestiona compras B2B para tu empresa.</Text></View>
            <Button title="Registrarme como cliente" onPress={() => router.push('/(auth)/register-client')} />
          </Card>
          <Card style={styles.roleCard}>
            <View style={[styles.iconWrap, styles.providerIcon]}><Text style={styles.icon}>🏢</Text></View>
            <View style={styles.cardCopy}><Text style={styles.cardTitle}>Quiero vender</Text><Text style={styles.text}>Recibe oportunidades y administra tu catálogo comercial.</Text></View>
            <Button title="Registrarme como proveedor" variant="secondary" onPress={() => router.push('/(auth)/register-provider')} />
          </Card>
        </View>
        <Button title="Ya tengo cuenta" variant="secondary" onPress={() => router.back()} />
      </AuthEntrance>
    </ScrollView>
  </SafeAreaView>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  shell: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  cards: { gap: spacing.md, marginBottom: spacing.md },
  roleCard: { borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  clientIcon: { backgroundColor: c.surfaceSoft },
  providerIcon: { backgroundColor: c.control },
  icon: { fontSize: 25 },
  cardCopy: { gap: 4 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: c.text },
  text: { color: c.muted, lineHeight: 20 },
}));
