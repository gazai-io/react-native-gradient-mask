import { requireNativeView } from 'expo';
import React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import type { ViewportMaskViewProps } from './GradientMask.types';
import type { MaskSharedValue } from './animatedMaskProps';
import { readValue } from './animatedMaskProps';
import { viewportMaskProps } from './viewportMaskProps';
type Keys = 'top' | 'bottom' | 'topFeather' | 'bottomFeather' | 'enabled' | 'restrictTouchesToVisibleArea';
export type AnimatedViewportMaskViewProps = Omit<ViewportMaskViewProps, Keys> & {
  top: number | MaskSharedValue<number>;
  bottom: number | MaskSharedValue<number>;
} & { [K in Exclude<Keys, 'top' | 'bottom'>]?: ViewportMaskViewProps[K] | MaskSharedValue<NonNullable<ViewportMaskViewProps[K]>> };
const NativeView: React.ComponentType<Omit<ViewportMaskViewProps, Keys> & Partial<ReturnType<typeof viewportMaskProps>>> = requireNativeView('GradientMask');
const AnimatedNativeView = Animated.createAnimatedComponent(NativeView);
export default function AnimatedViewportMaskView({top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, ...viewProps}: AnimatedViewportMaskViewProps) {
  const animatedProps = useAnimatedProps(() => viewportMaskProps({
    top: readValue(top) ?? 0, bottom: readValue(bottom) ?? 0,
    restrictTouchesToVisibleArea: readValue(restrictTouchesToVisibleArea),
    topFeather: readValue(topFeather), bottomFeather: readValue(bottomFeather), enabled: readValue(enabled),
  }));
  return <AnimatedNativeView {...viewProps} animatedProps={animatedProps} />;
}
