import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
} as const;

const F = fontFamily;

export const typography = {
  displayBalance: { fontFamily: F.medium, fontSize: 36, lineHeight: 42, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  displayAmount: { fontFamily: F.medium, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  titleGreeting: { fontFamily: F.medium, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  titleScreen: { fontFamily: F.medium, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  titleSection: { fontFamily: F.medium, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  titleCard: { fontFamily: F.medium, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  kpiLarge: { fontFamily: F.medium, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  bodyStrong: { fontFamily: F.medium, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22 },
  bodySecondary: { fontFamily: F.regular, fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'] },
  label: { fontFamily: F.regular, fontSize: 13, lineHeight: 16 },
  labelDelta: { fontFamily: F.medium, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
  microButton: { fontFamily: F.medium, fontSize: 12, lineHeight: 16 },
  microBadge: { fontFamily: F.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
  microAxis: { fontFamily: F.regular, fontSize: 10, lineHeight: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;
