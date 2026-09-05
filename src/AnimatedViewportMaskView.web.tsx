import type { AnimatedViewportMaskViewProps } from './AnimatedViewportMaskView';
export type { AnimatedViewportMaskViewProps } from './AnimatedViewportMaskView';
/** Avoid loading the native view when existing Web users import the package. */
export default function AnimatedViewportMaskView(_props: AnimatedViewportMaskViewProps): never {
  throw new Error('AnimatedViewportMaskView currently supports iOS and Android. Use AnimatedGradientMaskView for Web.');
}
