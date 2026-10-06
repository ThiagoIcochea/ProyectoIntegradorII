import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { BackButton, Button, Card, EmptyState, Loading } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';
import { enrichDetallesConCatalogo, estadoLabel, normalizeEstado } from '@/utils/solicitud';

export default function History() { const [items,setItems]=useState<any[]|null>(null),[selected,setSelected]=useState<any>(null); const styles=useStyles(); const load=useCallback(async()=>{try{setItems(await b2bService.history());}catch(error){Alert.alert('No se pudo cargar el historial',apiError(error));setItems([]);}},[]); useEffect(()=>{void load();},[load]);
  const open=async(item:any)=>{try{const catalogo=await b2bService.catalog({categorias:null,marcas:null,precioMin:null,precioMax:null,especificaciones:[]}).catch(()=>[]);setSelected({...item,detalles:enrichDetallesConCatalogo(item.detalles||[],catalogo)});}catch{setSelected(item);}};
  if(!items)return <Loading/>; return <SafeAreaView style={styles.root}><BackButton/><FlatList data={items} keyExtractor={(item,index)=>String(item.idSolicitud||item.id||index)} contentContainerStyle={styles.list} ListHeaderComponent={<><Text style={styles.title}>Historial de solicitudes</Text><Text style={styles.copy}>Completadas, entregadas y canceladas. Toca una tarjeta para ver su detalle.</Text></>} ListEmptyComponent={<EmptyState title="Sin historial" detail="Las solicitudes finalizadas aparecerán aquí."/>} renderItem={({item})=>{const requestId=item.idSolicitud||item.id;return <Pressable onPress={()=>void open(item)}><Card><Text style={styles.name}>{item.nombreProveedor||item.razonSocial||item.proveedor||`Solicitud #${requestId}`}</Text><Text style={styles.meta}>Estado: {estadoLabel(item.estado)}</Text><Text style={styles.meta}>Actualizada: {item.fechaActualizacionEstado||item.fechaFinalizacion||item.fechaCreacion||'—'}</Text>{normalizeEstado(item.estado)==='ENTREGADA'?<Button title="Evaluar" variant="secondary" onPress={()=>router.push(`/evaluate/${requestId}` as never)}/>:null}</Card></Pressable>;}}/><RequestDetailModal item={selected} visible={!!selected} onClose={()=>setSelected(null)}/></SafeAreaView>}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({root:{flex:1,backgroundColor:c.bg},list:{padding:spacing.md,gap:12},title:{fontSize:25,fontWeight:'800',color:c.text},copy:{color:c.muted},name:{fontSize:16,fontWeight:'800',color:c.text},meta:{color:c.muted}}));
