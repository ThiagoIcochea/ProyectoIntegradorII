import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const theme = useStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        theme.button,
        variant === 'secondary' && theme.secondary,
        variant === 'danger' && theme.danger,
        isDisabled && theme.disabled,
        pressed && !isDisabled && theme.buttonPressed,
        style
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? theme.secondaryText.color : '#fff'} accessibilityLabel={`${title}. Cargando`} />
      ) : (
        <Text style={[theme.buttonText, variant === 'secondary' && theme.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({ label, error, secureTextEntry, accessibilityLabel, accessibilityHint, ...props }: TextInputProps & { label: string; error?: string }) {
  const theme = useStyles();
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={theme.field}>
      <Text style={theme.label}>{label}</Text>
      <View style={theme.inputWrap}>
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ?? accessibilityHint}
          placeholderTextColor={theme.placeholder.color}
          style={[theme.input, isPassword && theme.inputWithIcon, Boolean(error) && theme.inputError, props.multiline && theme.multilineInput]}
          secureTextEntry={isPassword && !visible}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityState={{ checked: visible }}
            hitSlop={8}
            onPress={() => setVisible(value => !value)}
            style={({ pressed }) => [theme.eyeButton, pressed && theme.iconPressed]}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.placeholder.color} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={theme.error}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const theme = useStyles();
  return <View style={[theme.card, style]}>{children}</View>;
}

export function Loading() {
  const theme = useStyles();
  return <View accessibilityRole="progressbar" accessibilityLabel="Cargando contenido" style={theme.center}><ActivityIndicator size="large" color={theme.spinner.color} /></View>;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReducedMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const theme = useStyles();
  const opacity = useRef(new Animated.Value(0.4)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.65);
      return;
    }

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return <Animated.View accessible={false} style={[theme.skeletonBlock, style, { opacity }]} />;
}

export function SkeletonCard() {
  const theme = useStyles();
  return <View accessibilityRole="progressbar" accessibilityLabel="Cargando información" style={theme.card}><SkeletonBlock style={{ width: '60%', height: 16 }} /><SkeletonBlock style={{ width: '90%', height: 12 }} /><SkeletonBlock style={{ width: '40%', height: 12 }} /></View>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  const theme = useStyles();
  return <View accessibilityRole="summary" style={theme.empty}><Text style={theme.emptyTitle}>{title}</Text><Text style={theme.emptyText}>{detail}</Text></View>;
}

export function BackButton() {
  const theme = useStyles();
  return <Pressable accessibilityRole="button" accessibilityLabel="Regresar" accessibilityHint="Vuelve a la pantalla anterior" hitSlop={12} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={({ pressed }) => [theme.back, pressed && theme.iconPressed]}><Ionicons name="chevron-back" size={28} color={theme.backIcon.color} /></Pressable>;
}

export function confirm(title: string, message: string, action: () => void) {
  Alert.alert(title, message, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Continuar', style: 'destructive', onPress: action }]);
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  button: { backgroundColor: c.primary, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: c.primary },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: c.surfaceSoft, borderColor: c.border },
  secondaryText: { color: c.accentText },
  danger: { backgroundColor: c.danger, borderColor: c.danger },
  disabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  field: { marginBottom: spacing.md },
  label: { color: c.text, fontWeight: '600', marginBottom: 7, fontSize: 15 },
  inputWrap: { position: 'relative' },
  input: { minHeight: 50, borderWidth: 1, borderColor: c.border, backgroundColor: c.control, borderRadius: 12, paddingHorizontal: 14, color: c.text, fontSize: 16 },
  multilineInput: { minHeight: 112, paddingTop: 14, textAlignVertical: 'top' },
  inputWithIcon: { paddingRight: 52 },
  eyeButton: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconPressed: { opacity: 0.7, backgroundColor: c.surfaceSoft },
  inputError: { borderColor: c.danger },
  error: { color: c.dangerText, marginTop: 5, fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: c.surfaceRaised, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: c.border, gap: spacing.sm },
  skeletonBlock: { backgroundColor: c.surfaceSoft, borderRadius: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bg },
  spinner: { color: c.primary },
  placeholder: { color: c.muted },
  empty: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  emptyText: { textAlign: 'center', color: c.muted, lineHeight: 21 },
  back: { alignSelf: 'flex-start', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8, borderRadius: 12 },
  backIcon: { color: c.text }
}));
