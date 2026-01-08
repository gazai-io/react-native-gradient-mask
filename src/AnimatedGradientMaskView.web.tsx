import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { GradientMaskViewProps } from './GradientMask.types';

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
 * Convert processColor output back to rgba string
 */
function colorToRgba(color: number | null): string {
  if (color === null || color === undefined) {
    return 'rgba(0, 0, 0, 0)';
  }

  const intValue = color >>> 0;
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
      return 'to bottom';
    case 'bottom':
      return 'to top';
    case 'left':
      return 'to right';
    case 'right':
      return 'to left';
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
 */
function adjustColorsForOpacity(
  colors: (number | null)[],
  maskOpacity: number
): (number | null)[] {
  if (maskOpacity >= 1) return colors;
  if (maskOpacity <= 0) {
    return colors.map(() => 0xff000000);
  }

  return colors.map((color) => {
    if (color === null || color === undefined) return color;
    const intValue = color >>> 0;
    const a = ((intValue >> 24) & 0xff) / 255;
    const r = (intValue >> 16) & 0xff;
    const g = (intValue >> 8) & 0xff;
    const b = intValue & 0xff;
    const adjustedAlpha = a + (1 - a) * (1 - maskOpacity);
    return ((Math.round(adjustedAlpha * 255) << 24) | (r << 16) | (g << 8) | b) >>> 0;
  });
}

/**
 * AnimatedGradientMaskView - Web implementation
 * Uses CSS mask-image with useAnimatedReaction to listen for SharedValue changes
 */
export default function AnimatedGradientMaskView(props: AnimatedGradientMaskViewProps) {
  const {
    colors,
    locations,
    direction = 'top',
    maskOpacity,
    style,
    children,
  } = props;

  const [currentOpacity, setCurrentOpacity] = React.useState(maskOpacity.value);

  // Listen for SharedValue changes and update state
  useAnimatedReaction(
    () => maskOpacity.value,
    (value) => {
      runOnJS(setCurrentOpacity)(value);
    },
    [maskOpacity]
  );

  const maskStyle = React.useMemo(() => {
    if (currentOpacity <= 0) {
      return {};
    }

    const adjustedColors = adjustColorsForOpacity(colors, currentOpacity);
    const gradientString = buildGradientString(adjustedColors, locations, direction);

    return {
      WebkitMaskImage: gradientString,
      maskImage: gradientString,
      transition: 'mask-image 0.1s ease-out, -webkit-mask-image 0.1s ease-out',
    };
  }, [colors, locations, direction, currentOpacity]);

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
