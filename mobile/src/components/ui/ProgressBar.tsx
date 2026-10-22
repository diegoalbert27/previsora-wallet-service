import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  /** Filled share, 0–100. */
  percentage: number;
  fillColor?: string;
  trackColor?: string;
}

export function ProgressBar({ percentage, fillColor = '#FFFFFF', trackColor = 'rgba(255,255,255,0.15)' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 999 },
});
