import { requireNativeView } from 'expo';
import * as React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import type { GradientMaskViewProps } from './GradientMask.types';
import type { AnimatedGradientMaskViewProps } from './animatedMaskProps';
import { readAnimatedMaskProps } from './animatedMaskProps';
import { nativeMaskProps, normalizeGradient } from './maskGeometry';

export type { AnimatedGradientMaskViewProps } from './animatedMaskProps';

const NativeView: React.ComponentType<GradientMaskViewProps & Partial<ReturnType<typeof nativeMaskProps>>> =
  requireNativeView('GradientMask');
const AnimatedNativeView = Animated.createAnimatedComponent(NativeView);

/** UI-thread updates without rerendering children or measuring layout in JS. */
export default function AnimatedGradientMaskView(props: AnimatedGradientMaskViewProps) {
  const { colors, locations, maskOpacity, topMaskHeight, bottomMaskHeight,
    topMaskEnabled, bottomMaskEnabled, topMaskOpacity, bottomMaskOpacity, ...viewProps } = props;
  const gradient = React.useMemo(() => normalizeGradient(colors, locations), [colors, locations]);
  const animatedProps = useAnimatedProps(() => nativeMaskProps(readAnimatedMaskProps({
    maskOpacity, topMaskHeight, bottomMaskHeight, topMaskEnabled, bottomMaskEnabled,
    topMaskOpacity, bottomMaskOpacity,
  })));
  return <AnimatedNativeView {...viewProps} {...gradient} animatedProps={animatedProps} />;
}
