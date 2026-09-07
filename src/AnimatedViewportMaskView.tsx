import { useScreenHeight } from './useScreenHeight';
import { requireNativeView } from 'expo';
import React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import type { ViewportMaskViewProps } from './GradientMask.types';
import type { MaskSharedValue } from './animatedMaskProps';
import { readValue } from './animatedMaskProps';
import { viewportGradientProps, viewportMaskProps } from './viewportMaskProps';
type Keys = 'top' | 'bottom' | 'topFeather' | 'bottomFeather' | 'enabled' | 'restrictTouchesToVisibleArea' | 'percentageReference' | 'boundaryPercentageReference';
export type AnimatedViewportMaskViewProps = Omit<ViewportMaskViewProps, Keys> & {
  top: ViewportMaskViewProps['top'] | MaskSharedValue<ViewportMaskViewProps['top']>;
  bottom: ViewportMaskViewProps['bottom'] | MaskSharedValue<ViewportMaskViewProps['bottom']>;
} & { [K in Exclude<Keys, 'top' | 'bottom'>]?: ViewportMaskViewProps[K] | MaskSharedValue<NonNullable<ViewportMaskViewProps[K]>> };
const NativeView: React.ComponentType<Omit<ViewportMaskViewProps, Keys> & Partial<ReturnType<typeof viewportMaskProps>> & typeof viewportGradientProps> = requireNativeView('GradientMask');
const AnimatedNativeView = Animated.createAnimatedComponent(NativeView);
export default function AnimatedViewportMaskView({top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, percentageReference, boundaryPercentageReference, ...viewProps}: AnimatedViewportMaskViewProps) {
  const screenHeight = useScreenHeight((percentageReference !== undefined && percentageReference !== 'container') || (boundaryPercentageReference !== undefined && boundaryPercentageReference !== 'container'));
  const animatedProps = useAnimatedProps(() => viewportMaskProps({
    top: readValue(top) ?? 0, bottom: readValue(bottom) ?? 0,
    percentageReference: readValue(percentageReference),
    boundaryPercentageReference: readValue(boundaryPercentageReference),
    restrictTouchesToVisibleArea: readValue(restrictTouchesToVisibleArea),
    topFeather: readValue(topFeather), bottomFeather: readValue(bottomFeather), enabled: readValue(enabled),
  }, screenHeight));
  return <AnimatedNativeView {...viewProps} {...viewportGradientProps} animatedProps={animatedProps} />;
}
