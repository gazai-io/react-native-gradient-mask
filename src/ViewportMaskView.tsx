import { useScreenHeight } from './useScreenHeight';
import { requireNativeView } from 'expo';
import React from 'react';
import type { ViewportMaskViewProps } from './GradientMask.types';
import { viewportGradientProps, viewportMaskProps } from './viewportMaskProps';
const NativeView: React.ComponentType<Omit<ViewportMaskViewProps, 'top' | 'bottom'> & ReturnType<typeof viewportMaskProps> & typeof viewportGradientProps> = requireNativeView('GradientMask');
export default function ViewportMaskView({ top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, percentageReference, boundaryPercentageReference, ...viewProps }: ViewportMaskViewProps) {
  const screenHeight = useScreenHeight(percentageReference === 'screen' || boundaryPercentageReference === 'screen');
  return <NativeView {...viewProps} {...viewportGradientProps} {...viewportMaskProps({top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, percentageReference, boundaryPercentageReference}, screenHeight)} />;
}
