import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Input, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { storage } from '@/services/storage';
import { apiError } from '@/services/api';
import { DeliveryLocationPicker } from '@/components/delivery-location-picker';

export default function Quotation() {
  const [data, setData] = useState<any>(null); const [ruc, setRuc] = useState(''); const [direccion, setDireccion] = useState(''); const [saving, setSaving] = useState(false); const styles = useStyles();
  useEffect(() => { storage.getSelectedProvider<any>().then(setData); }, []);
  if (!data) return <Loading />;
  const provider = data.selected; const items = data.cart || []; const total = Number(provider?.totalCotizacion || provider?.total || 0); const subtotal = Number((total / 1.18).toFixed(2));
  const submit = async () => { if (!/^(10|20)\d{9}$/.test(ruc)) return Alert.alert('RUC inválido', 'Ingresa un RUC de 11 dígitos que empiece por 10 o 20.'); if (!direccion.trim()) return Alert.alert('Dirección requerida', 'Selecciona o confirma la dirección de entrega.'); setSaving(true); try { const empresa = await b2bService.createCompany({ ruc }); const result = await b2bService.createRequest({ idEmpresa: empresa?.idEmpresa, idProveedor: provider?.idProveedor || provider?.id, subtotal, igv: total - subtotal, total, direccionEnvio: direccion.trim(), items: items.map((item: any) => ({ idProducto: item.idProducto, cantidad: Number(item.qty), precioUnitario: Number(item.precioReferencia || 0) })) }); await storage.clearCart(); router.replace(result?.idSolicitud ? { pathname: '/request/[id]', params: { id: String(result.idSolicitud) } } : '/(tabs)/requests'); } catch (e) { Alert.alert('No se pudo crear la solicitud', apiError(e)); } finally { setSaving(false); } };
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>Confirmar cotización</Text><Card><Text style={styles.name}>{provider?.razonSocial || provider?.nombreProveedor || 'Proveedor seleccionado'}</Text>{items.map((item: any) => <View style={styles.row} key={item.idProducto}><Text style={styles.text}>{item.qty}× {item.name}</Text><Text style={styles.text}>S/ {(Number(item.precioReferencia || 0) * item.qty).toFixed(2)}</Text></View>)}<View style={styles.row}><Text style={styles.total}>Total</Text><Text style={styles.total}>S/ {total.toFixed(2)}</Text></View></Card><Input label="RUC de empresa *" value={ruc} onChangeText={v => setRuc(v.replace(/\D/g, '').slice(0, 11))} keyboardType="number-pad" maxLength={11}/><DeliveryLocationPicker onAddressChange={setDireccion}/><Input label="Dirección y referencia *" value={direccion} onChangeText={setDireccion} multiline placeholder="Confirma o completa la dirección sugerida por el mapa"/><Button title="Crear solicitud" onPress={submit} loading={saving}/><Button title="Cancelar" variant="secondary" onPress={() => router.back()}/></ScrollView></SafeAreaView>;
}
const useStyles = () => useThemedStyles(c => StyleSheet.create({ root:{flex:1,backgroundColor:c.bg},content:{padding:spacing.lg,gap:spacing.md},title:{fontSize:25,fontWeight:'800',color:c.text},name:{fontSize:17,fontWeight:'800',color:c.text},text:{color:c.textSoft},row:{flexDirection:'row',justifyContent:'space-between',gap:8},total:{fontWeight:'800',color:c.accentText} }));
