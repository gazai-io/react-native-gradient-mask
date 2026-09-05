import { useScreenHeight } from './useScreenHeight';
import * as React from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { AnimatedGradientMaskViewProps } from './animatedMaskProps';
import { readAnimatedMaskProps } from './animatedMaskProps';
import { normalizeGradient } from './maskGeometry';
import { buildMaskStyle } from './maskStyle.web';

export type { AnimatedGradientMaskViewProps } from './animatedMaskProps';

/** Update DOM mask styles directly; do not rerender the React child tree every frame. */
export default function AnimatedGradientMaskView(props: AnimatedGradientMaskViewProps) {
  const { colors, locations, direction, percentageReference, maskOpacity, topMaskHeight, bottomMaskHeight,
    topMaskEnabled, bottomMaskEnabled, topMaskOpacity, bottomMaskOpacity, style, onLayout, ...viewProps } = props;
  const height = useSharedValue(0);
  const screenHeight = useScreenHeight(percentageReference !== undefined && percentageReference !== 'container');
  const gradient = React.useMemo(() => normalizeGradient(colors, locations), [colors, locations]);
  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    height.value = event.nativeEvent.layout.height;
    onLayout?.(event);
  }, [height, onLayout]);
  const maskStyle = useAnimatedStyle(() => buildMaskStyle({ direction, ...readAnimatedMaskProps({
    percentageReference, maskOpacity, topMaskHeight, bottomMaskHeight, topMaskEnabled, bottomMaskEnabled,
    topMaskOpacity, bottomMaskOpacity,
  }) }, gradient.colors, gradient.locations, height.value, screenHeight) as unknown as ViewStyle);
  return <Animated.View {...viewProps} onLayout={handleLayout} style={[{ overflow: 'hidden' }, style, maskStyle]} />;
}
