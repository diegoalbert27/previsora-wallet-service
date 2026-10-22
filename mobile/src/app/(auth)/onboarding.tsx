import { router } from 'expo-router';
import { PiggyBank, ChartPie, Wallet } from 'lucide-react-native';
import { useRef, useState, type ComponentType } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { theme } from '@/theme';

const ILLUSTRATION_SIZE = 280;

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  /** Placeholder shown inside the illustration area until real artwork (SVG, PNG or Lottie) replaces it. */
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const SLIDES: Slide[] = [
  {
    id: 'treasury',
    title: 'Previsora Wallet: Smart Treasury Management',
    subtitle: 'Manage and organize your crypto capital by bringing Binance and your Web3 wallets together in one place.',
    Icon: Wallet,
  },
  {
    id: 'envelopes',
    title: 'Automated Envelopes & Rules',
    subtitle: 'Split your funds into envelopes by automatic percentages, based on their source and currency.',
    Icon: PiggyBank,
  },
  {
    id: 'insights',
    title: 'Total Control & Insights',
    subtitle: 'See your allocated liquidity versus your free capital with real-time metrics.',
    Icon: ChartPie,
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const lastIndex = useRef(0);

  // Keeps the dots in sync while swiping; the state only changes when the visible page does.
  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== lastIndex.current && page >= 0 && page < SLIDES.length) {
      lastIndex.current = page;
      setIndex(page);
    }
  }

  const illustration = Math.min(ILLUSTRATION_SIZE, width - theme.space[5] * 2);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={SLIDES}
        keyExtractor={(slide) => slide.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.illustration, { width: illustration, height: illustration }]}>
              <item.Icon size={96} color={theme.colors.brand.lime} strokeWidth={1.5} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space[4] }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title="Get started" onPress={() => router.push('/sign-in')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg.app },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[5],
    gap: theme.space[8],
  },
  illustration: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface1,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: theme.space[3], alignItems: 'center' },
  title: {
    ...theme.typography.displayAmount,
    fontSize: 28,
    lineHeight: 34,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center' },
  footer: { paddingHorizontal: theme.space[5], gap: theme.space[6] },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: theme.space[2] },
  dot: { width: 8, height: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.bg.surface3 },
  dotActive: { width: 20, backgroundColor: theme.colors.brand.lime },
});
