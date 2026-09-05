import type { GradientMaskViewProps, MaskLength } from './GradientMask.types';

export type NormalizedMaskLength = { value: number; isRatio: boolean };

export function clampMaskOpacity(value: number | undefined): number {
  'worklet';
  if (value === undefined) return 1;
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function normalizeMaskLength(length: MaskLength | undefined): NormalizedMaskLength {
  'worklet';
  let value = 0;
  let isRatio = false;
  if (typeof length === 'number') {
    value = length;
  } else if (typeof length === 'string') {
    const text = length.trim().toLowerCase();
    if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:px|%)$/.test(text)) {
      value = parseFloat(text);
      isRatio = text.endsWith('%');
      if (isRatio) value /= 100;
    }
  } else if (length && typeof length === 'object') {
    value = length.value;
    isRatio = length.unit === 'percent' || length.unit === 'ratio';
    if (length.unit === 'percent') value /= 100;
    if (!isRatio && length.unit !== 'px') value = 0;
  }
  value = Number.isFinite(value) ? Math.max(0, value) : 0;
  return { value: isRatio ? Math.min(1, value) : value, isRatio };
}

export function resolveEdgeHeights(top: NormalizedMaskLength, bottom: NormalizedMaskLength, height: number) {
  'worklet';
  const size = Number.isFinite(height) ? Math.max(0, height) : 0;
  const topHeight = Math.min(size, top.isRatio ? top.value * size : top.value);
  const bottomHeight = Math.min(size, bottom.isRatio ? bottom.value * size : bottom.value);
  const sum = topHeight + bottomHeight;
  const scale = sum > size ? size / sum : 1;
  return { top: topHeight * scale, bottom: bottomHeight * scale };
}

/** Flat props keep layout-dependent calculations on the native side. */
export function nativeMaskProps(props: Pick<GradientMaskViewProps,
  'maskOpacity' | 'topMaskHeight' | 'bottomMaskHeight' | 'topMaskEnabled' | 'bottomMaskEnabled' |
  'topMaskOpacity' | 'bottomMaskOpacity'>) {
  'worklet';
  const top = normalizeMaskLength(props.topMaskHeight);
  const bottom = normalizeMaskLength(props.bottomMaskHeight);
  return {
    edgeMode: props.topMaskHeight !== undefined || props.bottomMaskHeight !== undefined,
    topHeight: props.topMaskEnabled === false ? 0 : top.value,
    topHeightRatio: top.isRatio,
    bottomHeight: props.bottomMaskEnabled === false ? 0 : bottom.value,
    bottomHeightRatio: bottom.isRatio,
    topOpacity: clampMaskOpacity(props.topMaskOpacity),
    bottomOpacity: clampMaskOpacity(props.bottomMaskOpacity),
    maskOpacity: clampMaskOpacity(props.maskOpacity),
  };
}

export function normalizeGradient(colors?: readonly (number | null)[], locations?: readonly number[]) {
  const input = colors?.length ? colors : [0x00000000, 0xff000000];
  const result = input.map(color => color !== null && Number.isFinite(color) ? color | 0 : 0);
  if (result.length === 1) result.push(result[0]!);
  const valid = locations?.length === result.length && locations.every((value, index) =>
    Number.isFinite(value) && value >= 0 && value <= 1 && (index === 0 || value >= locations[index - 1]!));
  return {
    colors: result,
    locations: valid ? [...locations] : result.map((_, index) => index / (result.length - 1)),
  };
}
