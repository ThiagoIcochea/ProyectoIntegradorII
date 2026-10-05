import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Input } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { b2bService } from '@/services/b2b.service';
import { apiError } from '@/services/api';

type Category = 'servicio' | 'calidad' | 'tiempo' | 'comunicacion';
const categories: { key: Category; label: string }[] = [
  { key: 'servicio', label: 'Atención y servicio' },
  { key: 'calidad', label: 'Calidad del producto' },
  { key: 'tiempo', label: 'Tiempo de entrega' },
  { key: 'comunicacion', label: 'Comunicación' },
];

function StarRow({ value, onChange, color }: { value: number; onChange: (value: number) => void; color: string }) {
  return <View style={{ flexDirection: 'row', gap: 4 }}>{[1, 2, 3, 4, 5].map(star => <Pressable key={star} accessibilityRole="button" accessibilityLabel={`${star} estrellas`} onPress={() => onChange(star)} hitSlop={6}><Ionicons name={star <= value ? 'star' : 'star-outline'} size={28} color={color} /></Pressable>)}</View>;
}

export default function EvaluateRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const [ratings, setRatings] = useState<Record<Category, number>>({ servicio: 0, calidad: 0, tiempo: 0, comunicacion: 0 });
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setRating = (key: Category, value: number) => setRatings(prev => ({ ...prev, [key]: value }));
  const submit = async () => {
    if (categories.some(category => ratings[category.key] === 0)) return Alert.alert('Calificación incompleta', 'Debe completar todas las calificaciones.');
    setSubmitting(true);
    try {
      await b2bService.registerEvaluation({ idSolicitud: Number(id), estrellasServicio: ratings.servicio, estrellasCalidad: ratings.calidad, estrellasTiempo: ratings.tiempo, estrellasComunicacion: ratings.comunicacion, comentario: comentario.trim() });
      Alert.alert('Evaluación registrada', 'Gracias por calificar tu experiencia.');
      router.replace('/(tabs)/history');
    } catch (error) {
      Alert.alert('No se pudo registrar la evaluación', apiError(error));
    } finally {
      setSubmitting(false);
    }
  };
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Evaluar solicitud</Text>
    <Text style={styles.subtitle}>Califica tu experiencia con la solicitud RFQ-{String(id).padStart(4, '0')}.</Text>
    <Card style={styles.card}>
      {categories.map(category => <View key={category.key} style={styles.row}><Text style={styles.label}>{category.label}</Text><StarRow value={ratings[category.key]} onChange={value => setRating(category.key, value)} color={styles.starColor.color} /></View>)}
    </Card>
    <Input label="Comentario (opcional)" multiline value={comentario} onChangeText={setComentario} placeholder="Describe tu experiencia" />
    <Button title="Enviar evaluación" onPress={submit} loading={submitting} />
    <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
  </ScrollView></SafeAreaView>;
}
const useStyles = () => useThemedStyles(c => StyleSheet.create({ root: { flex: 1, backgroundColor: c.bg }, content: { padding: spacing.lg, gap: spacing.md }, title: { fontSize: 25, fontWeight: '800', color: c.text }, subtitle: { color: c.muted }, card: { gap: spacing.md }, row: { gap: 8 }, label: { fontWeight: '700', color: c.text }, starColor: { color: c.primary } }));
