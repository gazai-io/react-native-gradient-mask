import { useScreenHeight } from './useScreenHeight';
import * as React from 'react';
import { View } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import type { GradientMaskViewProps } from './GradientMask.types';
import { normalizeGradient } from './maskGeometry';
import { buildMaskStyle } from './maskStyle.web';

export default function GradientMaskView(props: GradientMaskViewProps) {
  const { colors, locations, direction, percentageReference, maskOpacity, topMaskHeight, bottomMaskHeight,
    topMaskEnabled, bottomMaskEnabled, topMaskOpacity, bottomMaskOpacity, style, onLayout, ...viewProps } = props;
  const [height, setHeight] = React.useState(0);
  const screenHeight = useScreenHeight(percentageReference !== undefined && percentageReference !== 'container');
  const gradient = React.useMemo(() => normalizeGradient(colors, locations), [colors, locations]);
  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
    onLayout?.(event);
  }, [onLayout]);
  const maskStyle = buildMaskStyle({ direction, percentageReference, maskOpacity, topMaskHeight, bottomMaskHeight,
    topMaskEnabled, bottomMaskEnabled, topMaskOpacity, bottomMaskOpacity }, gradient.colors, gradient.locations, height, screenHeight);
  return <View {...viewProps} onLayout={handleLayout}
    style={[{ overflow: 'hidden' }, style, maskStyle as unknown as ViewStyle]} />;
}
