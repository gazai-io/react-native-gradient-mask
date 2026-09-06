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

The example above calculates its numeric 50% line from the measured container. Alternatively pass `top="50%"` and select the percentage reference. `bottom` is an absolute coordinate in that container, **not** a bottom inset. The list fills the same container throughout the animation. The mask never calls scroll methods, compensates offsets, changes message data, or remounts children.

| Parameter | Static value | Animated value | Default |
| --- | --- | --- | --- |
| `top` | `MaskLength` | static / shared / derived length | required |
| `bottom` | `MaskLength` | static / shared / derived length | required |
| `topFeather` | `MaskLength` | static / shared / derived length | 0 |
| `bottomFeather` | `MaskLength` | static / shared / derived length | 0 |
| `restrictTouchesToVisibleArea` | boolean | static / shared / derived boolean | false |
| `percentageReference` | `container` / `screen` | static / shared / derived reference | container |
| `boundaryPercentageReference` | `container` / `screen` | static / shared / derived reference | inherits percentageReference |
| `enabled` | boolean | static / shared / derived boolean | true |

Numbers and `"40px"` mean React Native layout units (iOS points / Android dp), not screenshot physical pixels. A length may also be `"50%"`, `{ value: .5, unit: 'ratio' }`, `{ value: 50, unit: 'percent' }`, or `{ value: 40, unit: 'px' }`. Boundary and feather percentages resolve against the current **container height** by default, before overlap clamping. Set `percentageReference="screen"` to use `Dimensions.get('screen').height` in RN layout units. Screen size changes are subscribed to; keyboard/window changes do not redefine this as usable content height. Computed numbers such as `containerHeight * .3` work directly. Different units may be used on the two edges simultaneously.

`top` and `bottom` accept numbers, px, percentages, and ratio objects. `percentageReference` is shared by boundaries and feathers; optional `boundaryPercentageReference` overrides only boundaries. `topFeather="50%" bottomFeather="40px"` controls feather lengths; it does not position the visible top at 50%. Product definitions of “40px / 40%” are not inferred or fixed by this package.

## Clamp and alpha rules

For actual native container height `H`:

1. Resolve percentage/ratio coordinates against their selected reference; clamp input ratios to `[0,1]`. Non-finite coordinates become 0. Clamp `top` to `[0,H]`; clamp `bottom` to `[top,H]`. Inverted bounds produce an empty visible interval, never a reversed gradient.
2. Negative/non-finite feather lengths become 0. Percentages/ratios clamp to `[0,1]` and multiply the selected container/screen height. Each resolved feather then clamps to `[0,H]`.
3. Let `V = bottom - top`. If `topFeather + bottomFeather > V`, scale **both** by `V / sum`. Their ratio is preserved and they meet at one fully opaque point. `V=0` hides all content.
4. Outside `[top,bottom]`, alpha is 0. Inside, the top feather rises from 0 to 1, the bottom feather falls from 1 to 0, and the middle is fully opaque. Zero feather creates a hard edge.
5. `enabled=false` bypasses clipping, feathering, and the optional touch restriction, without discarding values. Set either feather to 0 to independently disable that feather while retaining hard clipping.

These are alpha masks, not colored overlays. They add no touch intercepting views.

### Optional native touch restriction

`restrictTouchesToVisibleArea` defaults to `false`, preserving all existing touch behavior. When `true`, new touch sequences must start at `top <= y < bottom` after the same native coordinate clamp as the visual mask. Feathered pixels remain interactive; zero/empty/inverted visible intervals reject all new touches. Existing drags continue to the original child if the finger or the boundary moves outside the interval. Disabling the mask (`enabled=false`) also disables this restriction.

Rejected touches can reach eligible underlying siblings or ancestors. This does not emit a range-change event or implement tap-to-hide-UI logic: the App's normal handlers determine that behavior. It governs touch hit testing, not accessibility focus filtering. Android RN hit-testing uses integer physical-pixel insets, conservatively rounding the visible interval inward by less than one physical pixel at fractional boundaries.

```tsx
<AnimatedViewportMaskView
  top={top} bottom={bottom}
  topFeather="50%" bottomFeather="40px"
  percentageReference="screen"
  restrictTouchesToVisibleArea={restrictTouches}
>
  <FlashList {...listProps} />
</AnimatedViewportMaskView>
```

`restrictTouches` can be a boolean or a shared/derived boolean. The new controls do not change list geometry or schedule per-frame React renders. `percentageReference` also applies to the existing edge-height API (`topMaskHeight` / `bottomMaskHeight`). It does not change numeric `top` / `bottom`: those remain local container coordinates.

For example, a 200-unit container on an 800-unit screen gives `10%` feathers of 20 units in container mode and 80 units in screen mode. `40px` remains 40 in both modes. If requested feathers do not fit the visible interval, the same proportional overlap clamp still applies.

## Existing edge API

`GradientMaskView` also accepts `topMaskHeight` / `bottomMaskHeight` as `MaskLength`, independent `topMaskEnabled` / `bottomMaskEnabled`, and per-edge opacity. Either height opts into fades anchored to the container edges. This API does **not** create a movable visible interval. Use the viewport API for chat window boundaries.

With neither edge height supplied, `colors`, `locations`, `direction`, and `maskOpacity` retain their legacy meaning. Animated wrappers accept shared/derived values without per-frame React state updates.

## Example and performance

The default Example tab is **Chat viewport** (200 fixed offline messages). Controls cover E-01–E-06: top 0/50%, simulated bottom panel, character streaming, append/prepend, zero/mixed feather units, narrow and inverted/out-of-range bounds, and enable/disable. Rapidly tap Top to reverse an in-flight animation. Reference lines and parameter text update on the UI thread. A once-per-second diagnostic text reports scroll offset, list mounts/unmounts, list layout count, and React renders. Streaming legitimately renders message changes; mask-only updates should not.

FlashList's automatic visible-content-position maintenance is explicitly disabled in this diagnostic scene, making App-level anchoring behavior distinguishable from the mask. Prepending data can change which message occupies a given numeric scroll offset; the mask does not prevent or compensate for that.

The panel is simulated so the container stays fixed; connecting an actual keyboard is App integration work. The mask itself does not resize in response to a keyboard or window event.

Build modes (set **before** producing the native Release JS bundle):

- `EXPO_PUBLIC_MASK_VALIDATION=touch`: touch range controls, background/content tap counters, scrolling, and container/screen percentage pixel oracle.
- `EXPO_PUBLIC_MASK_VALIDATION=geometry`: white-on-black native pixel oracle; static and animated viewport, zero feather, overlap, clamp, legacy fade.
- `EXPO_PUBLIC_MASK_VALIDATION=legacy-regression`: four legacy directions, opacity zero, animated opacity toggling.
- `EXPO_PUBLIC_MASK_VALIDATION=chat-auto`: runs the offline chat scenarios without UI automation.
- `EXPO_PUBLIC_MASK_VALIDATION=benchmark`: 200 identical FlashList messages and identical UI-thread scroll trajectory, six 5-second phases after a 3-second warmup: mask disabled, static viewport, animated bounds, rapid enable/disable, overlapping feathers, and a deliberate 500ms JS stall.
- unset: interactive Example and original Example tab.

The benchmark reports frame-callback frequency, p95/max interval, intervals over 25ms, and content render count. These are UI scheduling diagnostics, **not GPU frame completion or a physical-device performance certificate**. Collect Android `dumpsys gfxinfo ... framestats` / Perfetto and iOS Instruments Animation Hitches/Core Animation on real product devices, with the same Release build, thermal state, refresh rate, list, and scrolling. Run mask-disabled/enabled comparisons in both orders and retain raw traces. The JS stall is a deliberately adverse scenario; exclude it from normal scrolling acceptance.

See [validation and outstanding requirements](validation/viewport-checklist.md) for actual evidence and limits.

## Shared or separate references (0.2.2)

```tsx
// Shared screen basis: control only top and bottom for the moving visible window.
<AnimatedViewportMaskView
  percentageReference="screen"
  top={top} bottom={bottom}
  topFeather={40} bottomFeather={40}
/>
// Optional separation: screen-based feathers, container-based boundaries.
<ViewportMaskView
  percentageReference="screen" boundaryPercentageReference="container"
  top="25%" bottom="75%" topFeather="10%" bottomFeather={40}
/>
```

Both boundaries are measured downward from the **container origin**. With an 800-unit screen, `top="50%"` in screen mode requests local y=400, then clamps to the actual container. It does not measure the container's screen position or automatically align to the physical screen midpoint. To align an absolute screen line, the App passes `screenLineY - containerScreenY` as a numeric coordinate. `bottom={40}` is y=40, not a 40-unit inset; use `bottom={containerHeight - 40}` for that inset.

The Chat viewport `%: container/screen` toggle now changes both percentage boundaries and feathers. Press `Top 0 ↔ 50%` to animate the top boundary using the selected reference; `Bottom 100% ↔ 75%` changes the percentage bottom coordinate. `Bottom panel` returns to an App-calculated numeric bottom coordinate. Reference lines show the clamped position. The old README videos have not been re-recorded.
