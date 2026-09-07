import type { ViewportMaskViewProps } from './GradientMask.types';
import { normalizeGradient, referencedMaskLength } from './maskGeometry';

/**
 * Viewport mode feathers with the default transparent-to-opaque profile and never reads
 * `maskDirection`. They are still sent on every render: Fabric recycles native views by
 * component name and replays only the props an element sends, so a prop this wrapper omits
 * keeps the value left behind by the gradient wrapper that used the view before.
 */
export const viewportGradientProps = { ...normalizeGradient(), maskDirection: 'top' as const };

export function viewportMaskProps(props: Pick<ViewportMaskViewProps,
  'top' | 'bottom' | 'topFeather' | 'bottomFeather' | 'enabled' | 'restrictTouchesToVisibleArea' | 'percentageReference' | 'boundaryPercentageReference'>, screenHeight = 0) {
  'worklet';
  const top = referencedMaskLength(props.topFeather, props.percentageReference, screenHeight);
  const bottom = referencedMaskLength(props.bottomFeather, props.percentageReference, screenHeight);
  const visibleTop = referencedMaskLength(props.top, props.boundaryPercentageReference ?? props.percentageReference, screenHeight);
  const visibleBottom = referencedMaskLength(props.bottom, props.boundaryPercentageReference ?? props.percentageReference, screenHeight);
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
