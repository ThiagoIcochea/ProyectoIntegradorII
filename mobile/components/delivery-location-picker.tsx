import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Button } from '@/components/ui';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type Props = { onAddressChange: (address: string) => void };
const DEFAULT = { latitude: -12.0464, longitude: -77.0428 };

// Same approach as the original web app: Leaflet + OpenStreetMap tiles, no API key required.
const buildHtml = (lat: number, lng: number) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
  function notify(latlng) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: latlng.lat, lng: latlng.lng }));
  }
  marker.on('dragend', function(e){ notify(e.target.getLatLng()); });
  map.on('click', function(e){ marker.setLatLng(e.latlng); notify(e.latlng); });
  window.setCenter = function(lat, lng){ map.setView([lat, lng], 16); marker.setLatLng([lat, lng]); };
  true;
</script>
</body></html>`;

export function DeliveryLocationPicker({ onAddressChange }: Props) {
  const styles = useStyles();
  const webviewRef = useRef<WebView>(null);
  const [coords, setCoords] = useState(DEFAULT);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const describe = async (latitude: number, longitude: number) => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const value = place ? [place.street, place.streetNumber, place.district, place.city].filter(Boolean).join(', ') : '';
      if (value) { setAddress(value); onAddressChange(value); }
    } catch { /* Coordinate remains selected if reverse geocoding is unavailable. */ }
  };
  const useCurrent = async () => {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { Alert.alert('Ubicación no autorizada', 'Selecciona el punto de entrega manualmente en el mapa.'); return; }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setCoords(next);
      webviewRef.current?.injectJavaScript(`window.setCenter && window.setCenter(${next.latitude}, ${next.longitude}); true;`);
      await describe(next.latitude, next.longitude);
    } catch { Alert.alert('Ubicación no disponible', 'Selecciona el punto de entrega manualmente en el mapa.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void useCurrent(); }, []);
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data?.lat === 'number' && typeof data?.lng === 'number') void describe(data.lat, data.lng);
    } catch { /* Ignore malformed messages from the map page. */ }
  };
  return <View style={styles.wrap}>
    <Text style={styles.label}>Ubicación de entrega *</Text>
    <Text style={styles.help}>Arrastra el marcador o toca el mapa para ajustar la ubicación.</Text>
    <View style={styles.map}>
      <WebView ref={webviewRef} originWhitelist={['*']} source={{ html: buildHtml(coords.latitude, coords.longitude) }} onMessage={onMessage} javaScriptEnabled domStorageEnabled />
    </View>
    <Button title={loading ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'} variant="secondary" onPress={() => void useCurrent()} disabled={loading} />
    {loading ? <ActivityIndicator color={styles.spinner.color} /> : null}
    {address ? <Text style={styles.address}>Punto seleccionado: {address}</Text> : null}
  </View>;
}
const useStyles = () => useThemedStyles(c => StyleSheet.create({ wrap:{ gap:8 }, label:{ color:c.text, fontWeight:'700' }, help:{ color:c.muted, fontSize:12 }, map:{ height:230, borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:c.border }, address:{ color:c.textSoft, fontSize:12 }, spinner:{ color:c.primary } }));
