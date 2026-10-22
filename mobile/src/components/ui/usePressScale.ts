import { useState } from 'react';
import { Animated } from 'react-native';

/** Press feedback shared by tappable cards: scales down to 0.98 in 120 ms and back. */
export function usePressScale(pressedScale = 0.98) {
  const [scale] = useState(() => new Animated.Value(1));
  const animateTo = (toValue: number) =>
    Animated.timing(scale, { toValue, duration: 120, useNativeDriver: true }).start();

  return {
    style: { transform: [{ scale }] },
    onPressIn: () => animateTo(pressedScale),
    onPressOut: () => animateTo(1),
  };
}
