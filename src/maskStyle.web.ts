import type { GradientMaskViewProps } from './GradientMask.types';
import { nativeMaskProps, resolveEdgeHeights } from './maskGeometry';

function rgba(color: number, strength: number): string {
  'worklet';
  const alpha = ((color >>> 24) & 255) / 255;
  return `rgba(0,0,0,${1 - strength * (1 - alpha)})`;
}

function edgeGradient(colors: number[], locations: number[], height: number, strength: number, bottom: boolean) {
  'worklet';
  let stops = '';
  for (let i = 0; i < colors.length; i++) {
    if (i) stops += ',';
    stops += `${rgba(colors[i]!, strength)} ${locations[i]! * height}px`;
  }
  // Preserve the final alpha through the end of the edge, then leave the middle opaque.
  stops += `,${rgba(colors[colors.length - 1]!, strength)} ${height}px,black ${height}px`;
  return `linear-gradient(${bottom ? 'to top' : 'to bottom'},${stops})`;
}

export function buildMaskStyle(props: GradientMaskViewProps, colors: number[], locations: number[], height: number) {
  'worklet';
  const p = nativeMaskProps(props);
  let image = 'none';
  if (p.maskOpacity > 0 && p.edgeMode) {
    const sizes = resolveEdgeHeights(
      { value: p.topHeight, isRatio: p.topHeightRatio },
      { value: p.bottomHeight, isRatio: p.bottomHeightRatio }, height);
    const topActive = sizes.top > 0 && p.topOpacity > 0;
    const bottomActive = sizes.bottom > 0 && p.bottomOpacity > 0;
    if (topActive) image = edgeGradient(colors, locations, sizes.top, p.maskOpacity * p.topOpacity, false);
    if (bottomActive) {
      const bottom = edgeGradient(colors, locations, sizes.bottom, p.maskOpacity * p.bottomOpacity, true);
      image = topActive ? `${image},${bottom}` : bottom;
    }
  } else if (p.maskOpacity > 0) {
    const direction = props.direction === 'bottom' ? 'to top' : props.direction === 'left' ? 'to right' :
      props.direction === 'right' ? 'to left' : 'to bottom';
    let stops = '';
    for (let i = 0; i < colors.length; i++) {
      if (i) stops += ',';
      stops += `${rgba(colors[i]!, p.maskOpacity)} ${locations[i]! * 100}%`;
    }
    image = `linear-gradient(${direction},${stops})`;
  }
  return { maskImage: image, WebkitMaskImage: image, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' };
}
