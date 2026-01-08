import * as React from 'react';
import { View, StyleSheet } from 'react-native';

import { GradientMaskViewProps } from './GradientMask.types';

/**
 * Convert processColor output back to rgba string
 */
function colorToRgba(color: number | null): string {
  if (color === null || color === undefined) {
    return 'rgba(0, 0, 0, 0)';
  }

  // processColor returns AARRGGBB format on web (32-bit integer)
  const intValue = color >>> 0; // Ensure unsigned
  const a = ((intValue >> 24) & 0xff) / 255;
  const r = (intValue >> 16) & 0xff;
  const g = (intValue >> 8) & 0xff;
  const b = intValue & 0xff;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Get CSS linear-gradient direction based on direction prop
 */
function getGradientDirection(direction: GradientMaskViewProps['direction']): string {
  switch (direction) {
    case 'top':
      return 'to bottom'; // Top transparent → bottom opaque
    case 'bottom':
      return 'to top'; // Bottom transparent → top opaque
    case 'left':
      return 'to right'; // Left transparent → right opaque
    case 'right':
      return 'to left'; // Right transparent → left opaque
    default:
      return 'to bottom';
  }
}

/**
 * Build CSS linear-gradient string
 */
function buildGradientString(
  colors: (number | null)[],
  locations: number[],
  direction: GradientMaskViewProps['direction']
): string {
  const gradientDirection = getGradientDirection(direction);

  const colorStops = colors.map((color, index) => {
    const rgba = colorToRgba(color);
    const location = locations[index] !== undefined ? locations[index] * 100 : (index / (colors.length - 1)) * 100;
    return `${rgba} ${location}%`;
  });

  return `linear-gradient(${gradientDirection}, ${colorStops.join(', ')})`;
}

/**
 * Adjust color alpha values based on maskOpacity
 * maskOpacity = 0: all colors become fully opaque (no mask effect)
 * maskOpacity = 1: keep original alpha values
 */
function adjustColorsForOpacity(
  colors: (number | null)[],
  maskOpacity: number
): (number | null)[] {
  if (maskOpacity >= 1) return colors;
  if (maskOpacity <= 0) {
    // All become opaque black, meaning content is fully visible
    return colors.map(() => 0xff000000);
  }

  return colors.map((color) => {
    if (color === null || color === undefined) return color;
    const intValue = color >>> 0;
    const a = ((intValue >> 24) & 0xff) / 255;
    const r = (intValue >> 16) & 0xff;
    const g = (intValue >> 8) & 0xff;
    const b = intValue & 0xff;
    // Adjust alpha based on maskOpacity: when maskOpacity = 0, alpha approaches 1 (fully visible)
    const adjustedAlpha = a + (1 - a) * (1 - maskOpacity);
    return ((Math.round(adjustedAlpha * 255) << 24) | (r << 16) | (g << 8) | b) >>> 0;
  });
}

/**
 * GradientMaskView - Web implementation
 * Uses CSS mask-image with linear-gradient to achieve gradient mask effect
 */
export default function GradientMaskView(props: GradientMaskViewProps) {
  const {
    colors,
    locations,
    direction = 'top',
    maskOpacity = 1,
    style,
    children,
  } = props;

  const maskStyle = React.useMemo(() => {
    if (maskOpacity <= 0) {
      // No mask effect
      return {};
    }

    const adjustedColors = adjustColorsForOpacity(colors, maskOpacity);
    const gradientString = buildGradientString(adjustedColors, locations, direction);

    return {
      WebkitMaskImage: gradientString,
      maskImage: gradientString,
    };
  }, [colors, locations, direction, maskOpacity]);

  return (
    <View style={[styles.container, style, maskStyle as any]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
