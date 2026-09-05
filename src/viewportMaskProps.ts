import type { ViewportMaskViewProps } from './GradientMask.types';
import { referencedMaskLength } from './maskGeometry';

export function viewportMaskProps(props: Pick<ViewportMaskViewProps,
  'top' | 'bottom' | 'topFeather' | 'bottomFeather' | 'enabled' | 'restrictTouchesToVisibleArea' | 'percentageReference'>, screenHeight = 0) {
  'worklet';
  const top = referencedMaskLength(props.topFeather, props.percentageReference, screenHeight);
  const bottom = referencedMaskLength(props.bottomFeather, props.percentageReference, screenHeight);
  return {
    boundaryMode: true, edgeMode: true,
    restrictTouchesToVisibleArea: props.restrictTouchesToVisibleArea === true,
    visibleTop: Number.isFinite(props.top) ? Math.max(0, props.top) : 0,
    visibleBottom: Number.isFinite(props.bottom) ? Math.max(0, props.bottom) : 0,
    topHeight: top.value, topHeightRatio: top.isRatio,
    bottomHeight: bottom.value, bottomHeightRatio: bottom.isRatio,
    topOpacity: 1, bottomOpacity: 1, maskOpacity: props.enabled === false ? 0 : 1,
  };
}
