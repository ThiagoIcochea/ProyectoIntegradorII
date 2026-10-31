import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SkeletonBlock } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';

const STEP = 298;
const link = (ad: any) => ad.enlace || ad.urlEnlace || ad.link || ad.urlDestino;

export function AdvertisementsCarousel() {
  const styles = useStyles();
  const [ads, setAds] = useState<any[] | null>(null);
  const scroll = useRef<ScrollView>(null);
  const index = useRef(1);
  const loop = useMemo(() => ads && ads.length > 1 ? [ads.at(-1), ...ads, ads[0]] : ads || [], [ads]);

  useEffect(() => {
    b2bService.advertisements().then(value => setAds(Array.isArray(value) ? value : value?.data || [])).catch(() => setAds([]));
  }, []);
  useEffect(() => { if (ads && ads.length > 1) setTimeout(() => scroll.current?.scrollTo({ x: STEP, animated: false }), 0); }, [ads]);
  useEffect(() => {
    if (!ads || ads.length < 2) return;
    const timer = setInterval(() => { index.current += 1; scroll.current?.scrollTo({ x: index.current * STEP, animated: true }); }, 4500);
    return () => clearInterval(timer);
  }, [ads]);

  const finish = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!ads || ads.length < 2) return;
    const raw = Math.round(event.nativeEvent.contentOffset.x / STEP);
    if (raw === 0) { index.current = ads.length; scroll.current?.scrollTo({ x: ads.length * STEP, animated: false }); }
    else if (raw === ads.length + 1) { index.current = 1; scroll.current?.scrollTo({ x: STEP, animated: false }); }
    else index.current = raw;
  };

  if (ads === null) return <View style={styles.wrap}><Text style={styles.title}>Anuncios destacados</Text><Card style={styles.card}><SkeletonBlock style={styles.skeletonImage} /><SkeletonBlock style={styles.skeletonTitle} /><SkeletonBlock style={styles.skeletonCopy} /></Card></View>;
  if (!ads.length) return null;

  return <View style={styles.wrap}>
    <Text style={styles.title}>Anuncios destacados</Text>
    <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={finish} contentContainerStyle={styles.list}>
      {loop.map((ad: any, itemIndex: number) => <Pressable key={`${ad.idPublicidad || ad.id || itemIndex}-${itemIndex}`} onPress={() => link(ad) ? void Linking.openURL(link(ad)) : undefined} style={({ pressed }) => [styles.touch, pressed && styles.pressed]}>
        <Card style={styles.card}>
          {ad.imagenUrl || ad.urlImagen || ad.imagen ? <Image source={{ uri: ad.imagenUrl || ad.urlImagen || ad.imagen }} style={styles.image} /> : null}
          <Text style={styles.name}>{ad.titulo || ad.nombre || 'Información comercial'}</Text>
          {ad.descripcion || ad.contenido ? <Text style={styles.text} numberOfLines={3}>{ad.descripcion || ad.contenido}</Text> : null}
          {link(ad) ? <Text style={styles.go}>Ver anuncio →</Text> : null}
        </Card>
      </Pressable>)}
    </ScrollView>
  </View>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.2 },
  list: { gap: 12, paddingRight: 4 },
  touch: { borderRadius: 18 },
  pressed: { opacity: .88, transform: [{ scale: .99 }] },
  card: { width: 286, minHeight: 160, borderRadius: 18, gap: 9 },
  image: { width: '100%', height: 132, borderRadius: 12, resizeMode: 'cover' },
  name: { fontSize: 16, fontWeight: '800', color: c.text },
  text: { color: c.muted, fontSize: 13, lineHeight: 19 },
  go: { fontWeight: '800', color: c.accentText, fontSize: 13, marginTop: 2 },
  skeletonImage: { width: '100%', height: 132, borderRadius: 12 },
  skeletonTitle: { width: '62%', height: 18, borderRadius: 6 },
  skeletonCopy: { width: '88%', height: 14, borderRadius: 5 },
}));
