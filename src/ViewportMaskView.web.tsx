import type { ViewportMaskViewProps } from './GradientMask.types';
/** Viewport masking is currently a native-only opt-in API. */
export default function ViewportMaskView(_props: ViewportMaskViewProps): never {
  throw new Error('ViewportMaskView currently supports iOS and Android. Use GradientMaskView for Web.');
}
