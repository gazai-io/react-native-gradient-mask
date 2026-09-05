# Changelog

## 0.2.0

- Add opt-in native viewport boundaries with independent animated feather lengths; preserve the existing gradient components.
- Add `restrictTouchesToVisibleArea` (default false). Restrict new touches to the visible interval while allowing an existing drag to continue outside it.
- Add `percentageReference`: container (default) or screen. Support mixed logical px, percentage, ratio, and calculated lengths.
- Retain native mask layers/shaders, remove Android software rendering/full-size CPU bitmap allocation, and preserve iOS alpha masks across Fabric updates.
- Align Example to Expo 56 / RN 0.85.3 / Reanimated 4; add fixed-list chat, touch, percentage, regression, and Release comparison scenes.
- Validate native interaction on iOS and Android simulators. Physical-device performance remains unverified; see validation records.
