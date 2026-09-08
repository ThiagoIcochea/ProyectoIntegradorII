import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';
import { BackButton, Card, EmptyState, Loading } from '@/components/ui';
import { RequestDetailModal } from '@/components/request-detail-modal';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';

export default function History() { const [items,setItems]=useState<any[]|null>(null),[selected,setSelected]=useState<any>(null); const styles=useStyles(); const load=useCallback(async()=>{try{setItems(await b2bService.history());}catch(error){Alert.alert('No se pudo cargar el historial',apiError(error));setItems([]);}},[]); useEffect(()=>{void load();},[load]); if(!items)return <Loading/>; return <SafeAreaView style={styles.root}><BackButton/><FlatList data={items} keyExtractor={(item,index)=>String(item.idSolicitud||item.id||index)} contentContainerStyle={styles.list} ListHeaderComponent={<><Text style={styles.title}>Historial de solicitudes</Text><Text style={styles.copy}>Completadas, entregadas y canceladas. Toca una tarjeta para ver su detalle.</Text></>} ListEmptyComponent={<EmptyState title="Sin historial" detail="Las solicitudes finalizadas aparecerán aquí."/>} renderItem={({item})=><Pressable onPress={()=>setSelected(item)}><Card><Text style={styles.name}>{item.nombreProveedor||item.razonSocial||item.proveedor||`Solicitud #${item.idSolicitud||item.id}`}</Text><Text style={styles.meta}>Estado: {item.estado||'—'}</Text><Text style={styles.meta}>Actualizada: {item.fechaActualizacionEstado||item.fechaFinalizacion||item.fechaCreacion||'—'}</Text></Card></Pressable>}/><RequestDetailModal item={selected} visible={!!selected} onClose={()=>setSelected(null)}/></SafeAreaView>}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({root:{flex:1,backgroundColor:c.bg},list:{padding:spacing.md,gap:12},title:{fontSize:25,fontWeight:'800',color:c.text},copy:{color:c.muted},name:{fontSize:16,fontWeight:'800',color:c.text},meta:{color:c.muted}}));
