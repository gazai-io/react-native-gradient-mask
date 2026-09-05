import type { ViewProps } from 'react-native';

/** Numbers / px are React Native logical pixels (iOS points, Android dp). */
export type MaskLength = number | `${number}px` | `${number}%` |
  { value: number; unit: 'px' | 'percent' | 'ratio' };

export type GradientMaskViewProps = ViewProps & {
  /**
   * Gradient colors array (processed colors from processColor)
   * Use alpha values to control opacity
   * e.g., ['rgba(0,0,0,0)', 'rgba(0,0,0,1)'] = transparent to opaque
   */
  colors?: readonly (number | null)[];

  /**
   * Position of each color (0-1)
   * e.g., [0, 0.3, 1] means first color at 0%, second at 30%, third at 100%
   */
  locations?: readonly number[];

  /**
   * Gradient direction
   * 'top' = top transparent, bottom opaque
   * 'bottom' = bottom transparent, top opaque
   * 'left' = left transparent, right opaque
   * 'right' = right transparent, left opaque
   */
  direction?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Mask effect intensity (0-1)
   * 0 = no gradient effect (content fully visible)
   * 1 = full gradient effect
   * @default 1
   */
  maskOpacity?: number;

  /**
   * Independent top fade: "50%", 40, "40px", or a calculated number.
   * Either height enables edge mode; an omitted edge has height 0.
   * Percentages use this view's current height, not the screen.
   * If the heights exceed the view, both shrink proportionally to fit.
   * Colors/locations describe the fade from each edge inward in edge mode;
   * direction only applies when neither edge height is supplied.
   */
  topMaskHeight?: MaskLength;
  /** Independent bottom fade height; may use a different unit from the top. */
  bottomMaskHeight?: MaskLength;

  /**
   * Disable an edge without discarding its height. @default true
   */
  topMaskEnabled?: boolean;
  bottomMaskEnabled?: boolean;
  /** Per-edge intensity, multiplied by maskOpacity. @default 1 */
  topMaskOpacity?: number;
  bottomMaskOpacity?: number;
};
