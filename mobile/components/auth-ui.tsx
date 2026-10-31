import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SkeletonBlock } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

/** Entrance motion and loading placeholders shared by the public account screens. */
export function AuthEntrance({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function AuthHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  const styles = useStyles();
  return <View style={styles.header}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>;
}

export function AuthScreenSkeleton({ fields = 3 }: { fields?: number }) {
  const styles = useStyles();
  return <View style={styles.skeletonPage} accessibilityLabel="Cargando formulario">
    <View style={styles.skeletonHeader}>
      <SkeletonBlock style={styles.skeletonEyebrow} />
      <SkeletonBlock style={styles.skeletonTitle} />
      <SkeletonBlock style={styles.skeletonDescription} />
    </View>
    <View style={styles.skeletonCard}>
      {Array.from({ length: fields }, (_, index) => <View key={index} style={styles.skeletonField}><SkeletonBlock style={styles.skeletonLabel} /><SkeletonBlock style={styles.skeletonInput} /></View>)}
      <SkeletonBlock style={styles.skeletonButton} />
    </View>
  </View>;
}

const useStyles = () => useThemedStyles(c => StyleSheet.create({
  header: { gap: 7, marginBottom: spacing.lg },
  eyebrow: { alignSelf: 'flex-start', color: c.accentText, backgroundColor: c.surfaceSoft, borderColor: c.borderSoft, borderWidth: 1, borderRadius: 99, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  title: { color: c.textBright, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  description: { color: c.muted, fontSize: 15, lineHeight: 22, maxWidth: 520 },
  skeletonPage: { flex: 1, backgroundColor: c.bg, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: spacing.xl },
  skeletonHeader: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 10, marginBottom: spacing.xl },
  skeletonCard: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.border, borderRadius: 22, padding: spacing.lg, gap: spacing.md },
  skeletonEyebrow: { width: 98, height: 26, borderRadius: 99 },
  skeletonTitle: { width: '62%', height: 31, borderRadius: 8 },
  skeletonDescription: { width: '90%', height: 18, borderRadius: 6 },
  skeletonField: { gap: 7 },
  skeletonLabel: { width: '34%', height: 14, borderRadius: 5 },
  skeletonInput: { width: '100%', height: 52, borderRadius: 12 },
  skeletonButton: { width: '100%', height: 50, borderRadius: 12, marginTop: 4 },
}));
