import { requireNativeView } from 'expo';
import React from 'react';
import type { ViewportMaskViewProps } from './GradientMask.types';
import { viewportMaskProps } from './viewportMaskProps';
const NativeView: React.ComponentType<Omit<ViewportMaskViewProps, 'top' | 'bottom'> & ReturnType<typeof viewportMaskProps>> = requireNativeView('GradientMask');
export default function ViewportMaskView({ top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea, ...viewProps }: ViewportMaskViewProps) {
  return <NativeView {...viewProps} {...viewportMaskProps({top, bottom, topFeather, bottomFeather, enabled, restrictTouchesToVisibleArea})} />;
}
