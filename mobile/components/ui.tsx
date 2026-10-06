import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export function Button({ title, onPress, loading, variant = 'primary', disabled, style }: { title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; style?: ViewStyle }) { const theme = useStyles(); return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={[theme.button, variant === 'secondary' && theme.secondary, variant === 'danger' && theme.danger, (disabled || loading) && theme.disabled, style]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={[theme.buttonText, variant === 'secondary' && theme.secondaryText]}>{title}</Text>}</Pressable>; }
export function Input({ label, error, secureTextEntry, ...props }: TextInputProps & { label: string; error?: string }) {
  const theme = useStyles();
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;
  return <View style={theme.field}><Text style={theme.label}>{label}</Text><View style={theme.inputWrap}><TextInput placeholderTextColor={theme.placeholder.color} style={[theme.input, isPassword && theme.inputWithIcon, !!error && theme.inputError]} secureTextEntry={isPassword && !visible} {...props} />{isPassword ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setVisible(v => !v)} style={theme.eyeButton} hitSlop={8}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.placeholder.color} /></Pressable> : null}</View>{error ? <Text style={theme.error}>{error}</Text> : null}</View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) { const theme = useStyles(); return <View style={[theme.card, style]}>{children}</View>; }
export function Loading() { const theme = useStyles(); return <View style={theme.center}><ActivityIndicator size="large" color={theme.spinner.color} /></View>; }
export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const theme = useStyles();
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[theme.skeletonBlock, style, { opacity }]} />;
}
export function SkeletonCard() { const theme = useStyles(); return <View style={theme.card}><SkeletonBlock style={{ width: '60%', height: 16 }} /><SkeletonBlock style={{ width: '90%', height: 12 }} /><SkeletonBlock style={{ width: '40%', height: 12 }} /></View>; }
export function EmptyState({ title, detail }: { title: string; detail: string }) { const theme = useStyles(); return <View style={theme.empty}><Text style={theme.emptyTitle}>{title}</Text><Text style={theme.emptyText}>{detail}</Text></View>; }
export function BackButton() { const theme = useStyles(); return <Pressable accessibilityRole="button" accessibilityLabel="Regresar" hitSlop={12} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={theme.back}><Ionicons name="chevron-back" size={28} color={theme.backIcon.color} /></Pressable>; }
export function confirm(title: string, message: string, action: () => void) { Alert.alert(title, message, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Continuar', style: 'destructive', onPress: action }]); }
const useStyles = () => useThemedStyles(c => StyleSheet.create({ button:{ backgroundColor:c.primary, minHeight:48, borderRadius:12, alignItems:'center', justifyContent:'center', paddingHorizontal:spacing.md }, buttonText:{ color:'#fff', fontWeight:'700', fontSize:16 }, secondary:{ backgroundColor:c.surfaceSoft, borderWidth:1, borderColor:c.border }, secondaryText:{ color:c.accentText }, danger:{ backgroundColor:c.danger }, disabled:{ opacity:.55 }, field:{ marginBottom:spacing.md }, label:{ color:c.text, fontWeight:'600', marginBottom:7 }, inputWrap:{ position:'relative' }, input:{ minHeight:50, borderWidth:1, borderColor:c.border, backgroundColor:c.surface, borderRadius:12, paddingHorizontal:14, color:c.text, fontSize:16 }, inputWithIcon:{ paddingRight:44 }, eyeButton:{ position:'absolute', right:4, top:0, bottom:0, width:40, alignItems:'center', justifyContent:'center' }, inputError:{ borderColor:c.danger }, error:{ color:c.dangerText, marginTop:5, fontSize:12 }, card:{ backgroundColor:c.surfaceRaised, borderRadius:16, padding:spacing.md, borderWidth:1, borderColor:c.border, gap:spacing.sm }, skeletonBlock:{ backgroundColor:c.surfaceSoft, borderRadius:6 }, center:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:c.bg }, spinner:{ color:c.primary }, placeholder:{ color:c.muted }, empty:{ alignItems:'center', padding:spacing.xl, gap:spacing.sm }, emptyTitle:{ fontSize:17, fontWeight:'700', color:c.text }, emptyText:{ textAlign:'center', color:c.muted }, back:{ alignSelf:'flex-start', width:44, height:44, alignItems:'center', justifyContent:'center', marginLeft:-8 }, backIcon:{ color:c.text } }));
