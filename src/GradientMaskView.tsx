import { requireNativeView } from 'expo';
import * as React from 'react';
import type { GradientMaskViewProps } from './GradientMask.types';
import { nativeMaskProps, normalizeGradient } from './maskGeometry';

const NativeView: React.ComponentType<GradientMaskViewProps & ReturnType<typeof nativeMaskProps>> =
  requireNativeView('GradientMask');

export default function GradientMaskView(props: GradientMaskViewProps) {
  const { colors, locations, maskOpacity, topMaskHeight, bottomMaskHeight,
    topMaskEnabled, bottomMaskEnabled, topMaskOpacity, bottomMaskOpacity, ...viewProps } = props;
  const gradient = React.useMemo(() => normalizeGradient(colors, locations), [colors, locations]);
  return <NativeView {...viewProps} {...gradient} {...nativeMaskProps({
    maskOpacity, topMaskHeight, bottomMaskHeight, topMaskEnabled, bottomMaskEnabled,
    topMaskOpacity, bottomMaskOpacity,
  })} />;
}
