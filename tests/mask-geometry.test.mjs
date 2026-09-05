import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMaskLength, resolveEdgeHeights, nativeMaskProps, normalizeGradient, clampMaskOpacity } from '../src/maskGeometry.ts';
import { readAnimatedMaskProps } from '../src/animatedMaskProps.ts';

const sizes = (top, bottom, height) => resolveEdgeHeights(normalizeMaskLength(top), normalizeMaskLength(bottom), height);

test('mixed units: top 50%, bottom 40px follow container resize', () => {
  assert.deepEqual(sizes('50%', 40, 400), { top: 200, bottom: 40 });
  assert.deepEqual(sizes('50%', '40px', 200), { top: 100, bottom: 40 });
  assert.deepEqual(sizes({ value: 0.5, unit: 'ratio' }, { value: 40, unit: 'px' }, 600), { top: 300, bottom: 40 });
  assert.deepEqual(sizes({ value: 50, unit: 'percent' }, 40, 400), { top: 200, bottom: 40 });
});

test('calculated numbers are pixel heights; either edge can stand alone', () => {
  assert.deepEqual(sizes(240 * 0.5, 64 - 24, 400), { top: 120, bottom: 40 });
  assert.deepEqual(sizes(undefined, 40, 400), { top: 0, bottom: 40 });
  assert.deepEqual(sizes('25%', undefined, 400), { top: 100, bottom: 0 });
});

test('zero layout and oversubscribed edges remain finite and fit', () => {
  assert.deepEqual(sizes('50%', 40, 0), { top: 0, bottom: 0 });
  assert.deepEqual(sizes(80, 80, 100), { top: 50, bottom: 50 });
  assert.deepEqual(sizes('100%', '100%', 400), { top: 200, bottom: 200 });
  for (const h of [0, 1, 17.25, 200, 1000]) for (const t of [0, 40, '50%', '200%']) {
    const result = sizes(t, 90, h);
    assert.ok(Number.isFinite(result.top) && Number.isFinite(result.bottom));
    assert.ok(result.top >= 0 && result.bottom >= 0 && result.top + result.bottom <= h + 1e-8);
  }
});

test('malformed and non-finite input cannot reach native gradients', () => {
  for (const value of [NaN, Infinity, -40, '-2%', '40px junk', 'NaNpx', 'Infinity%', '', { value: NaN, unit: 'ratio' }]) {
    assert.equal(normalizeMaskLength(value).value, 0);
  }
  assert.deepEqual(normalizeMaskLength(' 40Px '), { value: 40, isRatio: false });
  assert.deepEqual(normalizeMaskLength('.5%'), { value: 0.005, isRatio: true });
  assert.deepEqual(normalizeMaskLength('200%'), { value: 1, isRatio: true });
  assert.equal(clampMaskOpacity(NaN), 0);
  assert.equal(clampMaskOpacity(-1), 0);
  assert.equal(clampMaskOpacity(2), 1);
});

test('edge switches preserve values and do not accidentally enable legacy masking', () => {
  assert.equal(nativeMaskProps({}).edgeMode, false);
  assert.equal(nativeMaskProps({ topMaskHeight: 0 }).edgeMode, true);
  const p = { topMaskHeight: '50%', bottomMaskHeight: 40, topMaskEnabled: false };
  assert.equal(nativeMaskProps(p).topHeight, 0);
  assert.equal(nativeMaskProps(p).bottomHeight, 40);
  assert.equal(nativeMaskProps({ ...p, topMaskEnabled: true }).topHeight, 0.5);
});

test('shared and derived values are read at update time, including unit changes', () => {
  const top = { value: '50%' };
  const bottom = { value: 40 };
  const enabled = { value: true };
  const p = { topMaskHeight: top, bottomMaskHeight: bottom, topMaskEnabled: enabled };
  assert.equal(nativeMaskProps(readAnimatedMaskProps(p)).topHeight, 0.5);
  top.value = 60;
  bottom.value = 80;
  enabled.value = false;
  const next = nativeMaskProps(readAnimatedMaskProps(p));
  assert.equal(next.topHeight, 0);
  assert.equal(next.topHeightRatio, false);
  assert.equal(next.bottomHeight, 80);
  assert.equal(nativeMaskProps(readAnimatedMaskProps({ topMaskHeight: { value: .5, unit: 'ratio' } })).topHeight, .5);
});

test('gradient defaults, single colors and invalid stops are safe and deterministic', () => {
  assert.deepEqual(normalizeGradient(), { colors: [0, -16777216], locations: [0, 1] });
  assert.deepEqual(normalizeGradient([null]), { colors: [0, 0], locations: [0, 1] });
  assert.deepEqual(normalizeGradient([0, 0xff000000], [1, 0]).locations, [0, 1]);
  assert.deepEqual(normalizeGradient([0, 0xff000000], [0, NaN]).locations, [0, 1]);
  assert.deepEqual(normalizeGradient([0, 0x80000000, 0xff000000], [0, .4, 1]).locations, [0, .4, 1]);
});

// Boundary transport is independent of feather lengths; native clamps against actual bounds.
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../src/viewportMaskProps.ts', import.meta.url), 'utf8')).replace("'./maskGeometry'", JSON.stringify(new URL('../src/maskGeometry.ts', import.meta.url).href));
const { viewportMaskProps } = await import('data:text/javascript,' + encodeURIComponent(source));
test('viewport opt-in preserves coordinates independently from mixed-unit feathers', () => {
  const p = viewportMaskProps({top: 400 * .5, bottom: 360, topFeather: '50%', bottomFeather: '40px'});
  assert.equal(p.boundaryMode, true);
  assert.equal(p.visibleTop, 200);
  assert.equal(p.visibleBottom, 360);
  assert.equal(p.topHeight, .5);
  assert.equal(p.topHeightRatio, true);
  assert.equal(p.bottomHeight, 40);
  assert.equal(p.bottomHeightRatio, false);
  assert.equal(viewportMaskProps({top: -10, bottom: NaN}).visibleTop, 0);
  assert.equal(viewportMaskProps({top: -10, bottom: NaN}).visibleBottom, 0);
  assert.equal(viewportMaskProps({top: 20, bottom: 30, enabled: false}).maskOpacity, 0);
});
