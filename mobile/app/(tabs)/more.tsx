import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { spacing } from '@/constants/theme';

const entries=[['Reclamos','provider-claims'],['Entregas','provider-deliveries'],['Pagos','provider-payments'],['Productos','provider-products'],['Configuración API','provider-api'],['Planes y beneficios','provider-plans']];
export default function More(){const styles=useStyles();return <ScrollView style={styles.root} contentContainerStyle={styles.content}><Text style={styles.title}>Más opciones</Text><Text style={styles.copy}>Gestiona las herramientas del proveedor sin saturar la navegación inferior.</Text>{entries.map(([label,path])=><Card key={path}><Button title={label} variant="secondary" onPress={()=>router.push(`/${path}` as never)}/></Card>)}</ScrollView>}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({root:{flex:1,backgroundColor:c.bg},content:{padding:spacing.md,gap:12},title:{fontSize:25,fontWeight:'800',color:c.text},copy:{color:c.muted}}));
