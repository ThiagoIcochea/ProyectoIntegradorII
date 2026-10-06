import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, EmptyState, Input, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';

const money = (v: any) => (v == null ? 'Sin precio' : `S/ ${Number(v).toFixed(2)}`);

type Tier = { cantidadMin: string; precioUnitario: string };
type Draft = { idProvProd: number; nombre: string; precio: string; stock: string; porcentajeDescuento: string; descuentosVolumen: Tier[] };

export default function ProviderProducts() {
  const styles = useStyles();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result: any = await b2bService.providerProducts();
      setItems(Array.isArray(result) ? result : result?.data || []);
    } catch (error) {
      Alert.alert('No se pudieron cargar los productos', apiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openEditor = (item: any) => setEditing({
    idProvProd: Number(item.idProvProd),
    nombre: item.nombre || item.producto || 'Producto',
    precio: String(item.precio ?? ''),
    stock: String(item.stock ?? ''),
    porcentajeDescuento: String(item.porcentajeDescuento ?? 0),
    descuentosVolumen: (Array.isArray(item.descuentosVolumen) ? item.descuentosVolumen : []).map((d: any) => ({ cantidadMin: String(d.cantidadMin ?? ''), precioUnitario: String(d.precioUnitario ?? '') })),
  });

  const addTier = () => setEditing(x => x && ({ ...x, descuentosVolumen: [...x.descuentosVolumen, { cantidadMin: '', precioUnitario: '' }] }));
  const removeTier = (i: number) => setEditing(x => x && ({ ...x, descuentosVolumen: x.descuentosVolumen.filter((_, idx) => idx !== i) }));
  const setTier = (i: number, key: keyof Tier, value: string) => setEditing(x => x && ({ ...x, descuentosVolumen: x.descuentosVolumen.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)) }));

  const save = async () => {
    if (!editing) return;
    const precio = Number(editing.precio);
    const stock = Number(editing.stock);
    const porcentajeDescuento = Number(editing.porcentajeDescuento || 0);
    if (!(precio > 0)) return Alert.alert('Precio inválido', 'Ingresa un precio unitario mayor a 0.');
    if (!Number.isFinite(stock) || stock < 0) return Alert.alert('Stock inválido', 'Ingresa una cantidad de stock válida (0 o más).');
    if (porcentajeDescuento < 0 || porcentajeDescuento > 100) return Alert.alert('Descuento inválido', 'El descuento general debe estar entre 0 y 100.');

    const descuentosVolumen = editing.descuentosVolumen
      .map(d => ({ cantidadMin: Number(d.cantidadMin), precioUnitario: Number(d.precioUnitario) }))
      .filter(d => Number.isFinite(d.cantidadMin) && d.cantidadMin > 0 && Number.isFinite(d.precioUnitario) && d.precioUnitario >= 0);

    setSaving(true);
    try {
      // Only ProveedorProducto-level fields: price/stock/discounts belong to this provider's
      // listing, never to the shared Producto (name/marca/categoria/sku/descripcion/estado) -
      // those are intentionally left out so the backend's esVacio() checks skip them untouched.
      await b2bService.updateProviderCatalog({ precioUnitario: precio, stock, porcentajeDescuento, descuentosVolumen }, '', editing.idProvProd);
      setEditing(null);
      await load();
      Alert.alert('Producto actualizado');
    } catch (e) {
      Alert.alert('No se pudo actualizar', apiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (editing) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.list}>
        <Text style={styles.title}>Editar producto</Text>
        <Text style={styles.copy}>{editing.nombre}</Text>
        <Card>
          <Input label="Precio unitario (S/)" keyboardType="decimal-pad" value={editing.precio} onChangeText={v => setEditing(x => x && ({ ...x, precio: v.replace(/[^0-9.]/g, '') }))} />
          <Input label="Stock disponible" keyboardType="number-pad" value={editing.stock} onChangeText={v => setEditing(x => x && ({ ...x, stock: v.replace(/[^0-9]/g, '') }))} />
          <Input label="Descuento general (%)" keyboardType="decimal-pad" value={editing.porcentajeDescuento} onChangeText={v => setEditing(x => x && ({ ...x, porcentajeDescuento: v.replace(/[^0-9.]/g, '') }))} />
        </Card>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>Descuentos por volumen</Text>
          <Text onPress={addTier} style={styles.addLink}>+ Agregar nivel</Text>
        </View>
        {editing.descuentosVolumen.length ? editing.descuentosVolumen.map((tier, i) => (
          <Card key={i}>
            <View style={styles.rowBetween}>
              <Text style={styles.tierTitle}>Nivel {i + 1}</Text>
              <Text onPress={() => removeTier(i)} style={styles.removeLink}>Eliminar</Text>
            </View>
            <Input label="Cantidad mínima" keyboardType="number-pad" value={tier.cantidadMin} onChangeText={v => setTier(i, 'cantidadMin', v.replace(/[^0-9]/g, ''))} />
            <Input label="Precio unitario desde esa cantidad (S/)" keyboardType="decimal-pad" value={tier.precioUnitario} onChangeText={v => setTier(i, 'precioUnitario', v.replace(/[^0-9.]/g, ''))} />
          </Card>
        )) : <Text style={styles.copy}>Sin niveles de descuento por volumen. Agrega uno si ofreces mejor precio por cantidad.</Text>}

        <Button title="Guardar cambios" onPress={() => void save()} loading={saving} />
        <Button title="Cancelar" variant="secondary" onPress={() => setEditing(null)} disabled={saving} />
      </ScrollView>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={items}
      keyExtractor={(item, index) => String(item.idProvProd || item.idProducto || item.id || index)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<>
        <Text style={styles.title}>Mis productos</Text>
        <Text style={styles.copy}>Toca un producto para actualizar precio, stock y descuentos.</Text>
      </>}
      ListEmptyComponent={<EmptyState title="Sin productos" detail="Aún no tienes productos registrados en tu catálogo." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => openEditor(item)}>
          <Card>
            <Text style={styles.name}>{item.nombre || item.producto || 'Producto'}</Text>
            <Text style={styles.detail}>SKU: {item.skuGlobal || item.sku || '-'} · Estado: {item.estado || item.estadoProducto || 'ACTIVO'}</Text>
            <Text style={styles.amount}>{money(item.precio ?? item.precioUnitario)}</Text>
            <Text style={styles.stock}>Stock disponible: {item.stockDisponible ?? item.stock ?? 0}</Text>
            <Text style={styles.detail}>Marca: {item.marca || '-'} · Categoría: {item.categoria || '-'}</Text>
            <Text style={styles.detail}>Entrega: {item.tiempoEntregaDias ?? 0} días · Garantía: {item.garantiaMeses ?? 0} meses</Text>
            <Text style={styles.detail}>Descuento: {item.porcentajeDescuento ?? 0}% · {item.enOferta ? 'En oferta' : 'Precio regular'}</Text>
            {Array.isArray(item.descuentosVolumen) && item.descuentosVolumen.length ? (
              <Text style={styles.detail}>Descuento por volumen: {item.descuentosVolumen.map((d: any) => `${d.cantidadMin}+ a S/ ${Number(d.precioUnitario).toFixed(2)}`).join(' · ')}</Text>
            ) : null}
            {item.descripcion ? <Text style={styles.detail}>{item.descripcion}</Text> : null}
            <Text style={styles.editHint}>Toca para editar →</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  list: { padding: spacing.md, gap: 12 },
  title: { fontSize: 25, fontWeight: '800', color: c.text },
  copy: { color: c.muted, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '800', color: c.text },
  detail: { color: c.muted },
  amount: { fontSize: 18, fontWeight: '800', color: c.accentText },
  stock: { fontWeight: '800', color: c.successText },
  editHint: { color: c.primary, fontWeight: '700', marginTop: 4 },
  section: { fontSize: 16, fontWeight: '800', color: c.text },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  addLink: { color: c.primary, fontWeight: '700' },
  removeLink: { color: c.dangerText, fontWeight: '700' },
  tierTitle: { fontSize: 15, fontWeight: '800', color: c.text },
}));
