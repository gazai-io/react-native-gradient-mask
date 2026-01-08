import { requireNativeView } from 'expo';
import * as React from 'react';
import { useAnimatedProps } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { GradientMaskViewProps } from './GradientMask.types';

const NativeView: React.ComponentType<GradientMaskViewProps> =
  requireNativeView('GradientMask');

const AnimatedNativeView = Animated.createAnimatedComponent(NativeView);

export type AnimatedGradientMaskViewProps = Omit<
  GradientMaskViewProps,
  'maskOpacity'
> & {
  /**
   * Mask effect intensity (0-1) as a Reanimated SharedValue
   * 0 = no gradient effect (content fully visible)
   * 1 = full gradient effect
   */
  maskOpacity: SharedValue<number>;
};

/**
 * AnimatedGradientMaskView - Gradient mask component with Reanimated SharedValue animation support
 *
 * Usage:
 * ```tsx
 * const maskOpacity = useSharedValue(0);
 *
 * // Animate to show
 * maskOpacity.value = withTiming(1, {
 *   duration: 600,
 *   easing: Easing.in(Easing.quad),
 * });
 *
 * <AnimatedGradientMaskView
 *   colors={colors}
 *   locations={locations}
 *   direction="top"
 *   maskOpacity={maskOpacity}
 * >
 *   <FlashList ... />
 * </AnimatedGradientMaskView>
 * ```
 */
export default function AnimatedGradientMaskView(
  props: AnimatedGradientMaskViewProps
) {
  const { maskOpacity, ...restProps } = props;

  const animatedProps = useAnimatedProps<Pick<GradientMaskViewProps, 'maskOpacity'>>(() => ({
    maskOpacity: maskOpacity.value,
  }));

  return <AnimatedNativeView {...restProps} animatedProps={animatedProps} />;
}

