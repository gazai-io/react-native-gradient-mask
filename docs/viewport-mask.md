# Native viewport mask

`ViewportMaskView` and `AnimatedViewportMaskView` are explicit opt-in APIs for iOS and Android. Existing `GradientMaskView` and `AnimatedGradientMaskView` remain available. Web support for the new viewport API is not implemented; existing Web exports can still be imported independently.

```tsx
const containerHeight = useSharedValue(0);
const top = useDerivedValue(() => containerHeight.value * 0.5);
const bottom = useDerivedValue(() => containerHeight.value - panelHeight.value);
const feather = useSharedValue(40);

<View style={{ flex: 1 }} onLayout={e => {
  containerHeight.value = e.nativeEvent.layout.height;
}}>
  <AnimatedViewportMaskView
    style={StyleSheet.absoluteFill}
    top={top}
    bottom={bottom}
    topFeather={feather}
    bottomFeather={40}
  >
    <FlashList data={messages} renderItem={renderMessage} />
  </AnimatedViewportMaskView>
</View>
```

The App calculates its 50% line from the measured **container**, not the screen. `bottom` is an absolute coordinate in that container, **not** a bottom inset. The list fills the same container throughout the animation. The mask never calls scroll methods, compensates offsets, changes message data, or remounts children.

| Parameter | Static value | Animated value | Default |
| --- | --- | --- | --- |
| `top` | number | number / shared / derived value | required |
| `bottom` | number | number / shared / derived value | required |
| `topFeather` | `MaskLength` | static / shared / derived length | 0 |
| `bottomFeather` | `MaskLength` | static / shared / derived length | 0 |
| `enabled` | boolean | static / shared / derived boolean | true |

Numbers and `"40px"` mean React Native layout units (iOS points / Android dp), not screenshot physical pixels. A length may also be `"50%"`, `{ value: .5, unit: 'ratio' }`, `{ value: 50, unit: 'percent' }`, or `{ value: 40, unit: 'px' }`. Feather percentages resolve against the current **container height**, before overlap clamping. Computed numbers such as `containerHeight * .3` work directly. Different units may be used on the two edges simultaneously.

`top` and `bottom` intentionally accept numeric coordinates only. `topFeather="50%" bottomFeather="40px"` controls feather lengths; it does not position the visible top at 50%. Product definitions of “40px / 40%” are not inferred or fixed by this package.

## Clamp and alpha rules

For actual native container height `H`:

1. Non-finite coordinates become 0. Clamp `top` to `[0,H]`; clamp `bottom` to `[top,H]`. Inverted bounds produce an empty visible interval, never a reversed gradient.
2. Negative/non-finite feather lengths become 0. Percentages/ratios clamp to `[0,1]`. Each resolved feather clamps to `[0,H]`.
3. Let `V = bottom - top`. If `topFeather + bottomFeather > V`, scale **both** by `V / sum`. Their ratio is preserved and they meet at one fully opaque point. `V=0` hides all content.
4. Outside `[top,bottom]`, alpha is 0. Inside, the top feather rises from 0 to 1, the bottom feather falls from 1 to 0, and the middle is fully opaque. Zero feather creates a hard edge.
5. `enabled=false` bypasses both clipping and feathering, without discarding values. Set either feather to 0 to independently disable that feather while retaining hard clipping.

These are alpha masks, not colored overlays. They add no touch intercepting views. Touch exclusion outside the visible interval remains the App's responsibility. The mask's children retain their original hit testing geometry.

## Existing edge API

`GradientMaskView` also accepts `topMaskHeight` / `bottomMaskHeight` as `MaskLength`, independent `topMaskEnabled` / `bottomMaskEnabled`, and per-edge opacity. Either height opts into fades anchored to the container edges. This API does **not** create a movable visible interval. Use the viewport API for chat window boundaries.

With neither edge height supplied, `colors`, `locations`, `direction`, and `maskOpacity` retain their legacy meaning. Animated wrappers accept shared/derived values without per-frame React state updates.

## Example and performance

The default Example tab is **Chat viewport** (200 fixed offline messages). Controls cover E-01–E-06: top 0/50%, simulated bottom panel, character streaming, append/prepend, zero/mixed feather units, narrow and inverted/out-of-range bounds, and enable/disable. Rapidly tap Top to reverse an in-flight animation. Reference lines and parameter text update on the UI thread. A once-per-second diagnostic text reports scroll offset, list mounts/unmounts, list layout count, and React renders. Streaming legitimately renders message changes; mask-only updates should not.

FlashList's automatic visible-content-position maintenance is explicitly disabled in this diagnostic scene, making App-level anchoring behavior distinguishable from the mask. Prepending data can change which message occupies a given numeric scroll offset; the mask does not prevent or compensate for that.

The panel is simulated so the container stays fixed; connecting an actual keyboard is App integration work. The mask itself does not resize in response to a keyboard or window event.

Build modes (set **before** producing the native Release JS bundle):

- `EXPO_PUBLIC_MASK_VALIDATION=geometry`: white-on-black native pixel oracle; static and animated viewport, zero feather, overlap, clamp, legacy fade.
- `EXPO_PUBLIC_MASK_VALIDATION=legacy-regression`: four legacy directions, opacity zero, animated opacity toggling.
- `EXPO_PUBLIC_MASK_VALIDATION=chat-auto`: runs the offline chat scenarios without UI automation.
- `EXPO_PUBLIC_MASK_VALIDATION=benchmark`: 200 identical FlashList messages and identical UI-thread scroll trajectory, six 5-second phases after a 3-second warmup: mask disabled, static viewport, animated bounds, rapid enable/disable, overlapping feathers, and a deliberate 500ms JS stall.
- unset: interactive Example and original Example tab.

The benchmark reports frame-callback frequency, p95/max interval, intervals over 25ms, and content render count. These are UI scheduling diagnostics, **not GPU frame completion or a physical-device performance certificate**. Collect Android `dumpsys gfxinfo ... framestats` / Perfetto and iOS Instruments Animation Hitches/Core Animation on real product devices, with the same Release build, thermal state, refresh rate, list, and scrolling. Run mask-disabled/enabled comparisons in both orders and retain raw traces. The JS stall is a deliberately adverse scenario; exclude it from normal scrolling acceptance.

See [validation and outstanding requirements](validation/viewport-checklist.md) for actual evidence and limits.
