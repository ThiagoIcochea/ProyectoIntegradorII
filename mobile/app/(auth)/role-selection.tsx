import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function RoleSelection() {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.text}>Elige cómo participarás en Nethink. Podrás completar los datos específicos de tu empresa en el siguiente paso.</Text>
      </View>

      <View style={styles.cards}>
        <Card>
          <View accessible={false} style={styles.icon}><Ionicons name="cart-outline" size={26} color={styles.iconColor.color} /></View>
          <Text accessibilityRole="header" style={styles.cardTitle}>Quiero comprar</Text>
          <Text style={styles.text}>Solicita cotizaciones, compara proveedores y gestiona compras B2B.</Text>
          <Button title="Registrarme como cliente" accessibilityHint="Abre el registro para empresas compradoras" onPress={() => router.push('/(auth)/register-client')} />
        </Card>

        <Card>
          <View accessible={false} style={styles.icon}><Ionicons name="business-outline" size={26} color={styles.iconColor.color} /></View>
          <Text accessibilityRole="header" style={styles.cardTitle}>Quiero vender</Text>
          <Text style={styles.text}>Recibe oportunidades y administra tu catálogo, inventario y solicitudes.</Text>
          <Button title="Registrarme como proveedor" variant="secondary" accessibilityHint="Abre el registro para empresas proveedoras" onPress={() => router.push('/(auth)/register-provider')} />
        </Card>
      </View>

      <Button title="Ya tengo cuenta" variant="secondary" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, padding: spacing.lg, gap: spacing.lg },
  intro: { gap: 8 },
  title: { fontSize: 28, fontWeight: '800', color: c.text },
  text: { color: c.muted, lineHeight: 21, fontSize: 15 },
  cards: { gap: spacing.md, flex: 1, justifyContent: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceSoft },
  iconColor: { color: c.accent },
  cardTitle: { fontSize: 19, fontWeight: '800', color: c.text }
}));
