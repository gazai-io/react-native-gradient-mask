import type { SharedValue } from 'react-native-reanimated';
import type { GradientMaskViewProps } from './GradientMask.types';

export type MaskSharedValue<T> = Readonly<Pick<SharedValue<T>, 'value'>>;

type AnimatedKey = 'maskOpacity' | 'topMaskHeight' | 'bottomMaskHeight' |
  'topMaskEnabled' | 'bottomMaskEnabled' | 'topMaskOpacity' | 'bottomMaskOpacity';
export type AnimatedGradientMaskViewProps = Omit<GradientMaskViewProps, AnimatedKey> & {
  [Key in AnimatedKey]?: GradientMaskViewProps[Key] | MaskSharedValue<NonNullable<GradientMaskViewProps[Key]>>;
};

export function readValue<T>(input: T | MaskSharedValue<T> | undefined): T | undefined {
  'worklet';
  // Length objects have a unit. SharedValues have a value but no unit.
  // Property access also works for Reanimated HostObjects (unlike `in`).
  return input !== null && typeof input === 'object' &&
    (input as { unit?: string }).unit === undefined
    ? (input as MaskSharedValue<T>).value : input as T | undefined;
}

export function readAnimatedMaskProps(props: Pick<AnimatedGradientMaskViewProps, AnimatedKey>) {
  'worklet';
  return {
    maskOpacity: readValue(props.maskOpacity),
    topMaskHeight: readValue(props.topMaskHeight),
    bottomMaskHeight: readValue(props.bottomMaskHeight),
    topMaskEnabled: readValue(props.topMaskEnabled),
    bottomMaskEnabled: readValue(props.bottomMaskEnabled),
    topMaskOpacity: readValue(props.topMaskOpacity),
    bottomMaskOpacity: readValue(props.bottomMaskOpacity),
  };
}
