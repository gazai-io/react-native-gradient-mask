import type { ViewportMaskViewProps } from './GradientMask.types';
import { referencedMaskLength } from './maskGeometry';

export function viewportMaskProps(props: Pick<ViewportMaskViewProps,
  'top' | 'bottom' | 'topFeather' | 'bottomFeather' | 'enabled' | 'restrictTouchesToVisibleArea' | 'percentageReference'>, screenHeight = 0) {
  'worklet';
  const top = referencedMaskLength(props.topFeather, props.percentageReference, screenHeight);
  const bottom = referencedMaskLength(props.bottomFeather, props.percentageReference, screenHeight);
  const visibleTop = referencedMaskLength(props.top, props.percentageReference, screenHeight);
  const visibleBottom = referencedMaskLength(props.bottom, props.percentageReference, screenHeight);
  return {
    boundaryMode: true, edgeMode: true,
    restrictTouchesToVisibleArea: props.restrictTouchesToVisibleArea === true,
    visibleTop: visibleTop.value, visibleTopRatio: visibleTop.isRatio,
    visibleBottom: visibleBottom.value, visibleBottomRatio: visibleBottom.isRatio,
    topHeight: top.value, topHeightRatio: top.isRatio,
    bottomHeight: bottom.value, bottomHeightRatio: bottom.isRatio,
    topOpacity: 1, bottomOpacity: 1, maskOpacity: props.enabled === false ? 0 : 1,
  };
}
