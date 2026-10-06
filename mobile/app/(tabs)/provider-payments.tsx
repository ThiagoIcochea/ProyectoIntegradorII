import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { Button, Card, EmptyState, Loading, confirm } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { enrichDetallesConCatalogo } from '@/utils/solicitud';

const state=(v:any)=>String(v||'').trim().toUpperCase().replace(/\s+/g,'_');
const money=(v:any)=>v==null?'-':`S/ ${Number(v).toFixed(2)}`;
const voucher=(x:any)=>x.comprobanteUrl||x.comprobante_url||x.voucherUrl||x.archivoUrl||x.adjuntoUrl;
export default function ProviderPayments(){
  const styles=useStyles(); const [items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true),[selected,setSelected]=useState<any>(null);
  const load=useCallback(async()=>{setLoading(true);try{const result:any=await b2bService.providerPayments();setItems(Array.isArray(result)?result:result?.data||[]);}catch(error){Alert.alert('No se pudieron cargar los pagos',apiError(error));}finally{setLoading(false);}},[]);
  useEffect(()=>{void load();},[load]);
  const change=async(id:number,action:'approve'|'reject')=>{try{if(action==='approve')await b2bService.approvePayment(id);else await b2bService.rejectPayment(id);await load();Alert.alert(action==='approve'?'Pago aprobado':'Pago rechazado');}catch(error){Alert.alert('No se pudo actualizar el pago',apiError(error));}};
  const open=async(item:any)=>{const idSolicitud=Number(item.idSolicitud||0);if(!idSolicitud){setSelected(item);return;}try{const [requests,catalogo]:[any[],any]=await Promise.all([b2bService.providerRequests(),b2bService.providerProducts().catch(()=>[])]);const request=requests.find(x=>Number(x.idSolicitud)===idSolicitud);const detalles=enrichDetallesConCatalogo(request?.detalles||item.detalles||[],Array.isArray(catalogo)?catalogo:catalogo?.data||[]);setSelected(request?{...item,...request,detalles}:item);}catch{setSelected(item);}};
  if(loading)return <Loading/>;
  return <><FlatList style={styles.root} data={items} keyExtractor={(item,index)=>String(item.idPago||item.id||index)} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.list} ListHeaderComponent={<><Text style={styles.title}>Pagos recibidos</Text><Text style={styles.copy}>Toca un pago para ver el detalle completo de su solicitud y el comprobante.</Text></>} ListEmptyComponent={<EmptyState title="Sin pagos" detail="No hay pagos recibidos para validar."/>} renderItem={({item})=>{const current=state(item.estado||item.estadoPago),canValidate=['VALIDANDO','PENDIENTE','PAGO_VALIDANDO'].includes(current);return <Pressable onPress={()=>void open(item)}><Card><Text style={styles.name}>{item.nombreEmpresa||item.nombreClienteEmpresa||`Pago #${item.idPago||''}`}</Text><Text style={styles.detail}>Estado: {current.replaceAll('_',' ')}</Text><Text style={styles.amount}>{money(item.monto||item.total||item.totalSolicitud)}</Text><Text style={styles.detail}>Operación: {item.codigoOperacion||'-'} · Solicitud: #{item.idSolicitud||'-'}</Text>{voucher(item)?<Button title="Ver comprobante" variant="secondary" onPress={()=>void Linking.openURL(voucher(item))}/>:null}{canValidate?<><Button title="Aceptar pago" onPress={()=>void change(Number(item.idPago||item.id),'approve')}/><Button title="Rechazar pago" variant="danger" onPress={()=>confirm('Rechazar pago','El pago quedará rechazado.',()=>void change(Number(item.idPago||item.id),'reject'))}/></>:null}</Card></Pressable>}}/><RequestDetailModal item={selected} visible={!!selected} onClose={()=>setSelected(null)}/></>;
}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({root:{flex:1,backgroundColor:c.bg},list:{padding:spacing.md,gap:12},title:{fontSize:25,fontWeight:'800',color:c.text},copy:{color:c.muted,marginBottom:4},name:{fontSize:18,fontWeight:'800',color:c.text},detail:{color:c.muted},amount:{fontSize:18,fontWeight:'800',color:c.accentText}}));
