import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Input, Loading } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { Product } from '@/models';
import { apiError } from '@/services/api';
import { b2bService } from '@/services/b2b.service';
import { storage } from '@/services/storage';

type CartItem = { idProducto: number; name: string; detail: string; qty: number; precioReferencia?: number | null; categoria?: string; marca?: string };
type Priority = 'BALANCEADO' | 'PRECIO' | 'TIEMPO';

const priorityLabel: Record<Priority, string> = { BALANCEADO: 'Mejor equilibrio', PRECIO: 'Mejor precio', TIEMPO: 'Entrega rápida' };

export default function Catalog() {
  const { search: searchParam } = useLocalSearchParams<{ search?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filters, setFilters] = useState<any>({ categorias: [], marcas: [] });
  const [categories, setCategories] = useState<number[]>([]);
  const [brands, setBrands] = useState<number[]>([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<Priority>('BALANCEADO');
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const styles = useStyles();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, available, saved] = await Promise.all([
        b2bService.catalog({ categorias: categories.length ? categories : null, marcas: brands.length ? brands : null, precioMin: priceMin ? Number(priceMin) : null, precioMax: priceMax ? Number(priceMax) : null, especificaciones: [] }),
        b2bService.productFilters(),
        storage.getCart<CartItem>()
      ]);
      setProducts(catalog || []);
      setFilters(available || { categorias: [], marcas: [] });
      setCart(saved || []);
    } catch (error) {
      Alert.alert('No se pudo cargar el catálogo', apiError(error));
    } finally {
      setLoading(false);
    }
  }, [brands, categories, priceMax, priceMin]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (typeof searchParam === 'string' && searchParam) setSearch(searchParam); }, [searchParam]);

  const visibleProducts = products.filter(product => [product.producto, product.nombre, product.marca, product.categoria, product.descripcion].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const toggle = (id: number, source: number[], update: (value: number[]) => void) => update(source.includes(id) ? source.filter(value => value !== id) : [...source, id]);
  const saveCart = async (next: CartItem[]) => { setCart(next); await storage.setCart(next); };

  const add = async (product: Product) => {
    const id = Number(product.idProducto || product.id);
    if (!id) return;
    const existing = cart.find(item => item.idProducto === id);
    await saveCart(existing ? cart.map(item => item.idProducto === id ? { ...item, qty: item.qty + 1 } : item) : [...cart, { idProducto: id, name: product.producto || product.nombre || 'Producto', detail: [product.marca, product.categoria].filter(Boolean).join(' · '), qty: 1, precioReferencia: product.precioUnitario || product.precio || null, categoria: product.categoria, marca: product.marca }]);
  };

  const apply = () => {
    const min = Number(priceMin || 0);
    const max = Number(priceMax || 0);
    if (min && max && min > max) {
      Alert.alert('Rango inválido', 'El precio mínimo no puede superar el máximo.');
      return;
    }
    setShowFilters(false);
  };

  const find = async () => {
    if (!cart.length) {
      Alert.alert('Solicitud vacía', 'Agrega al menos un producto al RFQ.');
      return;
    }
    setMatching(true);
    try {
      const providers = await b2bService.rfqMatches({ items: cart.map(item => ({ idProducto: item.idProducto, cantidad: item.qty })), filtro: { marcas: brands, categorias: categories, precioMin: priceMin ? Number(priceMin) : null, precioMax: priceMax ? Number(priceMax) : null }, prioridad: priority });
      await storage.setSelectedProvider({ providers, cart, priority });
      router.push('/rfq-results');
    } catch (error) {
      Alert.alert('No se encontraron proveedores', apiError(error));
    } finally {
      setMatching(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.root}>
      <FlatList
        data={visibleProducts}
        keyExtractor={(product, index) => String(product.idProducto || product.id || index)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={<>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>MARKETPLACE B2B</Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>Encuentra tecnología para tu empresa</Text>
            <Text style={styles.heroCopy}>Compara productos, solicita cotizaciones y encuentra proveedores confiables.</Text>
          </View>
          <Input label="Buscar en catálogo" accessibilityHint="Filtra productos por nombre, marca o categoría" value={search} onChangeText={setSearch} placeholder="Producto, marca o categoría" returnKeyType="search" />
          <Button title="Abrir filtros" variant="secondary" accessibilityHint="Filtra por precio, categoría o marca" onPress={() => setShowFilters(true)} />
          <Text accessibilityRole="header" style={styles.resultsLabel}>{visibleProducts.length} {visibleProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}</Text>
        </>}
        ListEmptyComponent={<EmptyState title="No encontramos productos" detail="Cambia la búsqueda o limpia los filtros." />}
        renderItem={({ item }) => {
          const image = item.imagenes?.find(value => value.principal)?.url || item.imagenes?.[0]?.url;
          const name = item.producto || item.nombre || 'Producto';
          const detail = [item.marca, item.categoria].filter(Boolean).join(' · ') || 'Catálogo B2B';
          const price = item.precioUnitario || item.precio ? `S/ ${Number(item.precioUnitario || item.precio).toFixed(2)}` : 'Cotizar precio';
          return <Card style={styles.product}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${name}. ${detail}. ${price}`} accessibilityHint="Abre las reseñas y proveedores disponibles" onPress={() => router.push({ pathname: '/reviews', params: { productId: String(item.idProducto || item.id), product: String(name) } })} style={({ pressed }) => [styles.productTap, pressed && styles.productPressed]}>
              {image ? <Image source={{ uri: image }} accessibilityLabel={`Imagen de ${name}`} style={styles.image} /> : <View accessible={false} style={styles.placeholder}><Ionicons name="cube-outline" size={28} color={styles.placeholderText.color} /></View>}
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{detail}</Text>
                <Text style={styles.price}>{price}</Text>
              </View>
              <Ionicons accessible={false} name="chevron-forward" size={20} color={styles.chevron.color} />
            </Pressable>
            <Button title="Agregar al RFQ" variant="secondary" accessibilityLabel={`Agregar ${name} al RFQ`} onPress={() => void add(item)} />
          </Card>;
        }} />

      <Pressable accessibilityRole="button" accessibilityLabel={`Abrir solicitud RFQ. ${itemCount} productos`} accessibilityHint="Revisa productos, cantidades y prioridad antes de buscar proveedores" onPress={() => setShowCart(true)} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Ionicons accessible={false} name="cart-outline" size={20} color="#fff" />
        <Text style={styles.fabText}>RFQ ({itemCount})</Text>
      </Pressable>

      <Modal visible={showFilters} animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View accessibilityViewIsModal style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}><Text accessibilityRole="header" style={styles.modalTitle}>Filtros del catálogo</Text><Button title="Cerrar" variant="secondary" style={styles.closeButton} onPress={() => setShowFilters(false)} /></View>
            <Text style={styles.group}>Rango de precio</Text>
            <Input label="Precio mínimo" keyboardType="decimal-pad" value={priceMin} onChangeText={setPriceMin} placeholder="0.00" />
            <Input label="Precio máximo" keyboardType="decimal-pad" value={priceMax} onChangeText={setPriceMax} placeholder="Sin límite" />
            <Text style={styles.group}>Categorías</Text>
            {(filters.categorias || []).map((value: any) => { const id = Number(value.idCategoria ?? value.id); const selected = categories.includes(id); return <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={value.nombre || value.categoria} accessibilityState={{ checked: selected }} onPress={() => toggle(id, categories, setCategories)} style={({ pressed }) => [styles.option, selected && styles.optionActive, pressed && styles.optionPressed]}><Text style={styles.optionText}>{value.nombre || value.categoria}</Text>{selected ? <Ionicons accessible={false} name="checkmark-circle" size={20} color={styles.selectionIcon.color} /> : null}</Pressable>; })}
            <Text style={styles.group}>Marcas</Text>
            {(filters.marcas || []).map((value: any) => { const id = Number(value.idMarca ?? value.id); const selected = brands.includes(id); return <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={value.nombre || value.marca} accessibilityState={{ checked: selected }} onPress={() => toggle(id, brands, setBrands)} style={({ pressed }) => [styles.option, selected && styles.optionActive, pressed && styles.optionPressed]}><Text style={styles.optionText}>{value.nombre || value.marca}</Text>{selected ? <Ionicons accessible={false} name="checkmark-circle" size={20} color={styles.selectionIcon.color} /> : null}</Pressable>; })}
            <Button title="Aplicar filtros" onPress={apply} />
            <Button title="Limpiar filtros" variant="secondary" onPress={() => { setCategories([]); setBrands([]); setPriceMin(''); setPriceMax(''); }} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCart} animationType="slide" onRequestClose={() => setShowCart(false)}>
        <View accessibilityViewIsModal style={styles.modal}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}><Text accessibilityRole="header" style={styles.modalTitle}>Tu solicitud RFQ</Text><Button title="Cerrar" variant="secondary" style={styles.closeButton} onPress={() => setShowCart(false)} /></View>
            {cart.length ? cart.map(item => <Card key={item.idProducto}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.detail} · Cantidad: {item.qty}</Text><View style={styles.controls}><Button title="−" variant="secondary" accessibilityLabel={`Reducir cantidad de ${item.name}`} onPress={() => void saveCart(item.qty === 1 ? cart.filter(value => value.idProducto !== item.idProducto) : cart.map(value => value.idProducto === item.idProducto ? { ...value, qty: value.qty - 1 } : value))} /><Button title="+" variant="secondary" accessibilityLabel={`Aumentar cantidad de ${item.name}`} onPress={() => void saveCart(cart.map(value => value.idProducto === item.idProducto ? { ...value, qty: value.qty + 1 } : value))} /></View></Card>) : <EmptyState title="Aún no agregas productos" detail="Explora el catálogo para preparar una cotización." />}
            <Text style={styles.group}>Prioridad</Text>
            <View accessibilityRole="radiogroup" style={styles.optionGroup}>{(Object.keys(priorityLabel) as Priority[]).map(value => { const selected = priority === value; return <Pressable key={value} accessibilityRole="radio" accessibilityLabel={priorityLabel[value]} accessibilityState={{ selected }} onPress={() => setPriority(value)} style={({ pressed }) => [styles.option, selected && styles.optionActive, pressed && styles.optionPressed]}><Text style={styles.optionText}>{priorityLabel[value]}</Text>{selected ? <Ionicons accessible={false} name="radio-button-on" size={20} color={styles.selectionIcon.color} /> : <Ionicons accessible={false} name="radio-button-off" size={20} color={styles.chevron.color} />}</Pressable>; })}</View>
            <Button title="Buscar proveedores" loading={matching} disabled={!cart.length} accessibilityHint="Busca proveedores que puedan atender todos los productos de la solicitud" onPress={() => void find()} />
            <Button title="Seguir explorando" variant="secondary" onPress={() => setShowCart(false)} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  list: { padding: spacing.md, paddingBottom: 120, gap: 12 },
  hero: { backgroundColor: c.navy, padding: spacing.lg, borderRadius: 16, gap: 7, borderWidth: 1, borderColor: c.border },
  eyebrow: { fontSize: 12, fontWeight: '800', color: c.primaryLight, letterSpacing: 0.8 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 32 },
  heroCopy: { color: c.accentText, lineHeight: 21 },
  resultsLabel: { color: c.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  product: { gap: 12 },
  productTap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12 },
  productPressed: { opacity: 0.72 },
  image: { width: 88, height: 88, borderRadius: 12, backgroundColor: c.surfaceSoft },
  placeholder: { width: 88, height: 88, borderRadius: 12, backgroundColor: c.surfaceSoft, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: c.muted },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 16, fontWeight: '800', color: c.text },
  meta: { color: c.muted, fontSize: 13, lineHeight: 18 },
  price: { fontWeight: '800', color: c.accentText, fontSize: 15 },
  chevron: { color: c.muted },
  fab: { position: 'absolute', right: 20, bottom: 20, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.primary, paddingHorizontal: 18, borderRadius: 26, elevation: 4 },
  fabPressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  fabText: { color: '#fff', fontWeight: '800' },
  modal: { flex: 1, backgroundColor: c.bg },
  modalContent: { padding: spacing.lg, gap: 12, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  closeButton: { minWidth: 84 },
  modalTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: c.text },
  group: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 8 },
  optionGroup: { gap: 8 },
  option: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  optionActive: { borderColor: c.primary, backgroundColor: c.surfaceSoft },
  optionPressed: { opacity: 0.76 },
  optionText: { flex: 1, color: c.text, fontWeight: '600' },
  selectionIcon: { color: c.accent },
  controls: { flexDirection: 'row', gap: 8 }
}));
