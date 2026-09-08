import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Input, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';

const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : value && typeof value === 'object' ? String((value as Record<string, unknown>).nombre || (value as Record<string, unknown>).descripcion || '') : '';

export default function Reviews() {
  const params = useLocalSearchParams<{ productId: string; product: string }>();
  const productId = Number(params.productId);
  const styles = useStyles();
  const [products, setProducts] = useState<Record<string, any>[]>([]);
  const [providers, setProviders] = useState<Record<string, any>[]>([]);
  const [selected, setSelected] = useState<Record<string, any> | null>(null);
  const [indicators, setIndicators] = useState<Record<string, any> | null>(null);
  const [comments, setComments] = useState<Record<string, any>[]>([]);
  const [draft, setDraft] = useState(''); const [loading, setLoading] = useState(true);
  const providerId = Number(selected?.idProveedor || selected?.id);
  const loadProviders = useCallback(async () => {
    try { const result = await b2bService.rfqMatches({ items:[{ idProducto:productId, cantidad:1 }], filtro:{ precioMin:null, precioMax:null, marcas:[], categorias:[] }, prioridad:'BALANCEADO' }); const list=Array.isArray(result) ? result : (result?.proveedores || result?.data || []); const enriched=await Promise.all(list.map(async(provider:any)=>{try{return {...provider,...await b2bService.providerIndicators(Number(provider.idProveedor||provider.id))};}catch{return provider;}})); setProviders(enriched); }
    catch (error) { Alert.alert('No se pudieron cargar proveedores', apiError(error)); }
    finally { setLoading(false); }
  }, [productId]);
  const loadComments = useCallback(async () => { if (!providerId || !productId) return; try { setComments(await b2bService.comments(providerId, productId)); } catch (error) { Alert.alert('No se pudieron cargar reseñas', apiError(error)); setComments([]); } }, [providerId, productId]);
  useEffect(() => { if (productId) { void loadProviders(); return; } b2bService.products().then(setProducts).catch(error => Alert.alert('No se pudo cargar el catálogo', apiError(error))).finally(() => setLoading(false)); }, [loadProviders, productId]);
  useEffect(() => { if (selected) { void loadComments(); b2bService.providerIndicators(Number(selected.idProveedor || selected.id)).then(setIndicators).catch(() => setIndicators(null)); } }, [loadComments, selected]);
  const submit = async () => { if (!draft.trim()) return Alert.alert('Escribe una reseña', 'Describe tu experiencia antes de publicarla.'); try { await b2bService.createComment({ idProv:providerId, idProd:productId, comentario:draft.trim() }); setDraft(''); await loadComments(); } catch (error) { Alert.alert('No se pudo publicar la reseña', apiError(error)); } };
  if (loading) return <Loading />;
  if (!productId) return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>Reseñas por producto</Text><Text style={styles.subtitle}>Selecciona un producto para consultar proveedores, indicadores y comentarios.</Text>{products.slice(0, 30).map((product, index) => <Card key={String(product.idProducto || product.id || index)}><Text style={styles.provider}>{text(product.producto || product.nombre) || 'Producto'}</Text><Text style={styles.meta}>{[text(product.marca), text(product.categoria), text(product.descripcion)].filter(Boolean).join(' · ') || 'Sin descripción disponible'}</Text><Button title="Ver proveedores y reseñas" variant="secondary" onPress={() => router.replace({ pathname:'/reviews', params:{ productId:String(product.idProducto || product.id), product:text(product.producto || product.nombre || 'Producto') } })} /></Card>)}</ScrollView></SafeAreaView>;
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>{selected ? 'Reseñas del proveedor' : 'Proveedores y reseñas'}</Text><Text style={styles.subtitle}>{params.product || 'Producto seleccionado'}</Text>
    {!selected ? <View style={styles.stack}>{providers.length ? providers.map((provider, index) => <Card key={String(provider.idProveedor || provider.id || index)}><Text style={styles.provider}>{provider.razonSocial || provider.nombreProveedor || 'Proveedor'}</Text><Text style={styles.meta}>{provider.categoriaPrincipal || provider.categoria || 'Proveedor B2B'} · Score {Number(provider.scoreGeneral || provider.score || 0).toFixed(0)}/100</Text><Button title="Ver proveedor y reseñas" variant="secondary" onPress={() => setSelected(provider)} /></Card>) : <EmptyState title="Sin proveedores asociados" detail="No hay proveedores disponibles para este producto." />}</View> : <View style={styles.stack}>
      <Card><Text style={styles.provider}>{indicators?.razonSocial || selected.razonSocial || selected.nombreProveedor || 'Proveedor'}</Text><Text style={styles.meta}>Satisfacción: {Number(indicators?.satisfaccion ?? selected.satisfaccion ?? 0).toFixed(0)}% · Cumplimiento: {Number(indicators?.cumplimiento ?? selected.cumplimiento ?? 0).toFixed(0)}%</Text><Text style={styles.meta}>Reseñas: {Number(indicators?.totalResenas ?? 0)} · Score: {Number(indicators?.scoreGeneral ?? selected.scoreGeneral ?? selected.score ?? 0).toFixed(0)}/100</Text></Card>
      <Card><Text style={styles.section}>Nueva reseña</Text><Input label="Tu experiencia" multiline value={draft} onChangeText={setDraft} placeholder="Cumplimiento, atención, entrega o soporte" maxLength={420} /><Button title="Publicar reseña" onPress={submit} /></Card>
      <Text style={styles.section}>Comentarios</Text>{comments.length ? comments.map((comment, index) => <Card key={String(comment.idComentario || index)}><View style={styles.commentHead}><Text style={styles.author}>{comment.nombreUsuario || 'Usuario'}</Text><Text style={styles.sentiment}>{String(comment.tipo || 'RESEÑA')}</Text></View><Text style={styles.comment}>{comment.comentario || 'Sin comentario escrito.'}</Text><Text style={styles.meta}>👍 {comment.likes || 0}   👎 {comment.dislikes || 0}</Text><View style={styles.actions}><Button title="Like" variant="secondary" onPress={async () => { await b2bService.reactComment({ idComentario:comment.idComentario, tipo:'LIKE' }); await loadComments(); }} /><Button title="Dislike" variant="secondary" onPress={async () => { await b2bService.reactComment({ idComentario:comment.idComentario, tipo:'DISLIKE' }); await loadComments(); }} /></View></Card>) : <EmptyState title="Aún no hay reseñas" detail="Sé la primera persona en compartir su experiencia." />}<Button title="Volver a proveedores" variant="secondary" onPress={() => setSelected(null)} />
    </View>}
  </ScrollView></SafeAreaView>;
}
const useStyles = () => useThemedStyles(c => StyleSheet.create({ root:{ flex:1, backgroundColor:c.bg, padding:spacing.md }, content:{ gap:12, paddingBottom:40 }, stack:{ gap:12 }, title:{ fontSize:25, fontWeight:'800', color:c.text }, subtitle:{ color:c.muted }, provider:{ fontSize:17, fontWeight:'800', color:c.text }, section:{ fontSize:17, fontWeight:'800', color:c.text }, meta:{ color:c.muted }, commentHead:{ flexDirection:'row', justifyContent:'space-between' }, author:{ fontWeight:'800', color:c.text }, sentiment:{ fontSize:11, color:c.accentText }, comment:{ color:c.textSoft, lineHeight:20 }, actions:{ flexDirection:'row', gap:8 } }));
