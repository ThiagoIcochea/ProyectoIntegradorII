import { Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { spacing } from '@/constants/theme';

const money=(value:any)=>value==null?'-':`S/ ${Number(value).toFixed(2)}`;
const date=(value:any)=>value?new Date(value).toLocaleString('es-PE'):'No disponible';
const subtotal=(detail:any)=>detail?.subtotal??Number(detail?.cantidad||0)*Number(detail?.precioUnitario??detail?.precio??0)*(1-Number(detail?.porcentajeDescuento??detail?.descuento??0)/100);
const estimatedDelivery=(item:any,details:any[])=>{
  const explicit=item?.fechaEntrega||item?.fechaLimiteEntrega||item?.fechaEntregaEstimada||item?.fechaPrometida;
  if(explicit)return explicit;
  const created=item?.fechaCreacion||item?.fechaSolicitud;
  if(!created)return null;
  const maxDays=Math.max(0,...details.map(detail=>Number(detail?.tiempoEntregaDias??detail?.tiempoEntrega??0)||0));
  const result=new Date(created); result.setDate(result.getDate()+Math.max(1,maxDays)+2);
  return result.toISOString();
};

export function RequestDetailModal({item,visible,onClose,isClient=false}:{item:any;visible:boolean;onClose:()=>void;isClient?:boolean}){
  const styles=useStyles(); const details=Array.isArray(item?.detalles)?item.detalles:Array.isArray(item?.productos)?item.productos:[];
  const reception=item?.codigoEntrega||item?.codigoRecepcion||item?.codigoEntregaCliente; const delivery=estimatedDelivery(item,details);
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.head}><Text style={styles.title}>Detalle de solicitud</Text><Button title="Cerrar" variant="secondary" onPress={onClose}/></View>
    <Card><Text style={styles.name}>{item?.nombreProveedor||item?.proveedor||item?.nombreCliente||item?.nombreEmpresa||`Solicitud #${item?.idSolicitud||item?.id||''}`}</Text><Text style={styles.text}>Estado: {String(item?.estado||item?.estadoPago||'-').replaceAll('_',' ')}</Text><Text style={styles.text}>Creada: {date(item?.fechaCreacion||item?.fechaSolicitud)}</Text><Text style={styles.text}>Entrega aproximada: {date(delivery)}</Text><Text style={styles.text}>Dirección: {item?.direccionEnvio||item?.direccion||item?.direccionEntrega||'No disponible'}</Text><Text style={styles.text}>Contacto: {item?.nombreCliente||item?.nombreContacto||'-'} {item?.telefonoCliente||item?.telefono||item?.telefonoContacto||''}</Text>{isClient&&reception?<Text style={styles.code}>Código de recepción: {reception}</Text>:null}{item?.comprobanteUrl?<Button title="Ver comprobante" variant="secondary" onPress={()=>void Linking.openURL(item.comprobanteUrl)}/>:null}</Card>
    <Text style={styles.section}>Productos y condiciones</Text>
    {details.length?details.map((detail:any,index:number)=><Card key={`${detail.idDetalle||detail.idProducto||detail.nombreProducto||'producto'}-${index}`}><Text style={styles.name}>{detail.nombreProducto||detail.producto||'Producto'}</Text><Text style={styles.text}>Cantidad: {detail.cantidad??'-'} · Precio unitario: {money(detail.precioUnitario??detail.precio)}</Text><Text style={styles.text}>Categoría: {detail.categoria||'-'} · Marca: {detail.marca||'-'}</Text><Text style={styles.text}>Descuento: {detail.porcentajeDescuento??detail.descuento??0}% · Garantía: {detail.garantiaMeses??0} meses</Text><Text style={styles.text}>Entrega del ítem: {detail.tiempoEntregaDias??'-'} días · Subtotal: {money(subtotal(detail))}</Text></Card>):<Card><Text style={styles.text}>El servicio no incluyó el detalle de productos para este registro.</Text></Card>}
    <Card><Text style={styles.total}>Total: {money(item?.total??item?.totalSolicitud??item?.monto)}</Text></Card>
  </ScrollView></Modal>;
}
const useStyles=()=>useThemedStyles(c=>StyleSheet.create({root:{flex:1,backgroundColor:c.bg},content:{padding:spacing.md,gap:12},head:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},title:{fontSize:23,fontWeight:'800',color:c.text},section:{fontSize:17,fontWeight:'800',color:c.text},name:{fontWeight:'800',fontSize:16,color:c.text},text:{color:c.muted,lineHeight:21},code:{fontWeight:'800',color:c.accentText},total:{fontSize:18,fontWeight:'800',color:c.accentText}}));
