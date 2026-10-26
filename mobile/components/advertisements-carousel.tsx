import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';

const STEP = 282;
const link = (ad: any) => ad.enlace || ad.urlEnlace || ad.link || ad.urlDestino;

export function AdvertisementsCarousel() {
  const styles = useStyles();
  const [ads, setAds] = useState<any[]>([]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const index = useRef(1);
  const loop = useMemo(() => ads.length > 1 ? [ads.at(-1), ...ads, ads[0]] : ads, [ads]);

  useEffect(() => {
    b2bService.advertisements().then(value => setAds(Array.isArray(value) ? value : value?.data || [])).catch(() => setAds([]));
  }, []);

  useEffect(() => {
    if (ads.length > 1) setTimeout(() => scroll.current?.scrollTo({ x: STEP, animated: false }), 0);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length < 2 || !autoPlay) return;
    const timer = setInterval(() => {
      index.current += 1;
      scroll.current?.scrollTo({ x: index.current * STEP, animated: true });
    }, 4500);
    return () => clearInterval(timer);
  }, [ads.length, autoPlay]);

  const finish = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (ads.length < 2) return;
    const raw = Math.round(event.nativeEvent.contentOffset.x / STEP);
    if (raw === 0) {
      index.current = ads.length;
      scroll.current?.scrollTo({ x: ads.length * STEP, animated: false });
    } else if (raw === ads.length + 1) {
      index.current = 1;
      scroll.current?.scrollTo({ x: STEP, animated: false });
    } else {
      index.current = raw;
    }
    setCurrentIndex((index.current - 1 + ads.length) % ads.length);
  };

  if (!ads.length) return null;

  return (
    <View style={styles.wrap} accessibilityLabel="Anuncios destacados">
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Anuncios destacados</Text>
        {ads.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={autoPlay ? 'Pausar rotación de anuncios' : 'Reanudar rotación de anuncios'}
            accessibilityState={{ selected: autoPlay }}
            hitSlop={8}
            onPress={() => setAutoPlay(value => !value)}
            style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}>
            <Text style={styles.controlText}>{autoPlay ? 'Pausar' : 'Reanudar'}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text accessibilityLiveRegion="polite" style={styles.status}>Anuncio {currentIndex + 1} de {ads.length}</Text>

      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={finish}
        onScrollBeginDrag={() => setAutoPlay(false)}
        contentContainerStyle={styles.list}>
        {loop.map((ad: any, itemIndex: number) => {
          const destination = link(ad);
          const title = ad.titulo || ad.nombre || 'Información comercial';
          const card = <Card style={styles.card}>{ad.imagenUrl || ad.urlImagen || ad.imagen ? <Image source={{ uri: ad.imagenUrl || ad.urlImagen || ad.imagen }} accessibilityLabel={`Imagen de ${title}`} style={styles.image} /> : null}<Text style={styles.name}>{title}</Text>{ad.descripcion || ad.contenido ? <Text style={styles.text}>{ad.descripcion || ad.contenido}</Text> : null}{destination ? <Text style={styles.go}>Abrir anuncio</Text> : null}</Card>;
          return destination ? <Pressable key={`${ad.idPublicidad || ad.id || itemIndex}-${itemIndex}`} accessibilityRole="link" accessibilityLabel={`Abrir anuncio: ${title}`} accessibilityHint="Abre el enlace comercial en el navegador" onPress={() => void Linking.openURL(destination)} style={({ pressed }) => pressed && styles.cardPressed}>{card}</Pressable> : <View key={`${ad.idPublicidad || ad.id || itemIndex}-${itemIndex}`}>{card}</View>;
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 19, fontWeight: '800', color: c.text },
  control: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSoft },
  controlPressed: { opacity: 0.72 },
  controlText: { color: c.accentText, fontSize: 13, fontWeight: '800' },
  status: { color: c.muted, fontSize: 12 },
  list: { gap: 12 },
  card: { width: 270 },
  cardPressed: { opacity: 0.8 },
  image: { width: '100%', height: 125, borderRadius: 8, resizeMode: 'cover' },
  name: { fontWeight: '800', color: c.text },
  text: { color: c.muted, fontSize: 13, lineHeight: 18 },
  go: { fontWeight: '700', color: c.accentText }
}));
