import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, EmptyState, Loading } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { storage } from '@/services/storage';

export default function RfqResults() {
  const [providers, setProviders] = useState<any[] | null>(null);
  useEffect(() => { storage.getSelectedProvider<any>().then((data) => setProviders(Array.isArray(data?.providers) ? data.providers : [])); }, []);
  if (!providers) return <Loading />;
  return <SafeAreaView style={styles.root}><FlatList data={providers} keyExtractor={(item, index) => String(item.idProveedor || item.id || index)} contentContainerStyle={styles.list} ListHeaderComponent={<View><Text style={styles.title}>Proveedores compatibles</Text><Text style={styles.subtitle}>Selecciona una cotización para revisar sus condiciones.</Text></View>} ListEmptyComponent={<EmptyState title="Sin coincidencias" detail="Prueba modificando los filtros o productos de tu RFQ." />} renderItem={({ item }) => <Card><Text style={styles.name}>{item.razonSocial || item.nombreProveedor || item.nombre || 'Proveedor'}</Text><Text style={styles.meta}>{item.categoriaPrincipal || item.descripcion || 'Proveedor B2B verificado'}</Text><View style={styles.metrics}><Text style={styles.metric}>S/ {Number(item.totalCotizacion || item.total || 0).toFixed(2)}</Text><Text style={styles.meta}>{item.tiempoEntregaDias ?? item.tiempoEntrega ?? '—'} días</Text></View><Button title="Ver cotización" onPress={async () => { const data = await storage.getSelectedProvider<any>(); await storage.setSelectedProvider({ ...data, selected: item }); router.push('/quotation'); }} /></Card>} /><Button title="Volver al catálogo" variant="secondary" onPress={() => router.back()} /></SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:colors.bg},list:{padding:spacing.md,gap:12},title:{fontSize:25,fontWeight:'800',color:colors.navy},subtitle:{color:colors.muted,marginTop:4,marginBottom:8},name:{fontSize:17,fontWeight:'800',color:colors.text},meta:{color:colors.muted},metrics:{flexDirection:'row',justifyContent:'space-between'},metric:{fontWeight:'800',color:colors.primaryDark}});
