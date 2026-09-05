import { useScreenHeight } from './useScreenHeight';
import { requireNativeView } from 'expo';
import React from 'react';
import type { ViewportMaskViewProps } from './GradientMask.types';
import { viewportMaskProps } from './viewportMaskProps';
const NativeView: React.ComponentType<Omit<ViewportMaskViewProps, 'top' | 'bottom'> & ReturnType<typeof viewportMaskProps>> = requireNativeView('GradientMask');
export default function ViewportMaskView({ top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, percentageReference, ...viewProps }: ViewportMaskViewProps) {
  const screenHeight = useScreenHeight(percentageReference === 'screen');
  return <NativeView {...viewProps} {...viewportMaskProps({top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, percentageReference}, screenHeight)} />;
}
