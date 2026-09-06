# Changelog

## 0.2.4

- Document background touch pass-through and `pointerEvents="box-none"` for non-interactive ancestor wrappers.
- Keep the original chat layout with one background button; clarify the pass-through switch and synchronize its label with the shared value.
- Add iOS/Android regression coverage for background clicks, repeated toggles, feather touches, and wrapper hit testing.
- Native/JS library behavior and default touch restriction remain unchanged. Physical-device performance remains unverified.

## 0.2.3

- Fix the Example screen-line controls to subtract the measured container position, including Android window/status-bar coordinates.
- Demonstrate true transparency with a switchable page background and transparent mask container.
- Add iOS/Android MP4 recordings and GIF previews, refresh coordinate and integration docs, and exclude demo media from the npm runtime package.
- Native/JS library behavior is unchanged from 0.2.2; the screen-position conversion is demonstrated in Example code.

## 0.2.2

- Accept px, percentage and ratio lengths for viewport top/bottom boundaries, including animated shared values.
- Apply percentageReference to both boundaries and feathers; optional boundaryPercentageReference independently overrides boundaries. Numeric coordinates retain their local-container meaning.
- Resolve native container ratios consistently for alpha masks and touch bounds without changing child layout.
- Update Chat viewport top and bottom percentage controls to follow the selected reference.

## 0.2.1

- Pin publishing npm to 11.6.2 for Node 24.13.0 compatibility. The 0.2.0 workflow failed before publication because npm 12 requires a newer Node runtime.
- First npm release of the 0.2.0 features below; runtime implementation is unchanged.

## 0.2.0

- Add opt-in native viewport boundaries with independent animated feather lengths; preserve the existing gradient components.
- Add `restrictTouchesToVisibleArea` (default false). Restrict new touches to the visible interval while allowing an existing drag to continue outside it.
- Add `percentageReference`: container (default) or screen. Support mixed logical px, percentage, ratio, and calculated lengths.
- Retain native mask layers/shaders, remove Android software rendering/full-size CPU bitmap allocation, and preserve iOS alpha masks across Fabric updates.
- Align Example to Expo 56 / RN 0.85.3 / Reanimated 4; add fixed-list chat, touch, percentage, regression, and Release comparison scenes.
- Validate native interaction on iOS and Android simulators. Physical-device performance remains unverified; see validation records.
