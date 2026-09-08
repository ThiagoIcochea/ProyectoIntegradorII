import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Button } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type Props = { onAddressChange: (address: string) => void };
const DEFAULT: Region = { latitude: -12.0464, longitude: -77.0428, latitudeDelta: .035, longitudeDelta: .035 };
export function DeliveryLocationPicker({ onAddressChange }: Props) {
  const styles = useStyles(); const [region, setRegion] = useState<Region>(DEFAULT); const [address, setAddress] = useState(''); const [loading, setLoading] = useState(false);
  const describe = async (latitude: number, longitude: number) => { try { const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }); const value = place ? [place.street, place.streetNumber, place.district, place.city].filter(Boolean).join(', ') : ''; if (value) { setAddress(value); onAddressChange(value); } } catch { /* Coordinate remains selected if reverse geocoding is unavailable. */ } };
  const useCurrent = async () => { setLoading(true); try { const permission = await Location.requestForegroundPermissionsAsync(); if (!permission.granted) { Alert.alert('Ubicación no autorizada', 'Selecciona el punto de entrega manualmente en el mapa.'); return; } const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); const next = { ...region, latitude: current.coords.latitude, longitude: current.coords.longitude }; setRegion(next); await describe(next.latitude, next.longitude); } catch { Alert.alert('Ubicación no disponible', 'Selecciona el punto de entrega manualmente en el mapa.'); } finally { setLoading(false); } };
  useEffect(() => { void useCurrent(); }, []);
  return <View style={styles.wrap}><Text style={styles.label}>Ubicación de entrega *</Text><Text style={styles.help}>Arrastra el marcador o toca el mapa para ajustar la ubicación.</Text><MapView style={styles.map} region={region} onRegionChangeComplete={setRegion} onPress={event => { const { latitude, longitude } = event.nativeEvent.coordinate; setRegion({ ...region, latitude, longitude }); void describe(latitude, longitude); }}><Marker draggable coordinate={{ latitude: region.latitude, longitude: region.longitude }} onDragEnd={event => { const { latitude, longitude } = event.nativeEvent.coordinate; setRegion({ ...region, latitude, longitude }); void describe(latitude, longitude); }} /></MapView><Button title={loading ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'} variant="secondary" onPress={() => void useCurrent()} disabled={loading}/>{loading ? <ActivityIndicator color={styles.spinner.color} /> : null}{address ? <Text style={styles.address}>Punto seleccionado: {address}</Text> : null}</View>;
}
const useStyles = () => useThemedStyles(c => StyleSheet.create({ wrap:{ gap:8 }, label:{ color:c.text, fontWeight:'700' }, help:{ color:c.muted, fontSize:12 }, map:{ height:230, borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:c.border }, address:{ color:c.textSoft, fontSize:12 }, spinner:{ color:c.primary } }));
