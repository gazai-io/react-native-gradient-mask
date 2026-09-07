# Native stack 左滑返回與 view recycling 驗證

起因是回報 iOS 左滑離開失效，懷疑是 0.2.4 的觸控穿透改動。結論是穿透改動無罪，但過程中查出另一個真的會靜默吃掉觸控的缺陷。

## 發現與修正

1. **`restrictTouchesToVisibleArea` 擋不到原生返回手勢。** `hitTest` 回傳 `nil` 是穿透而非吞掉，UIKit 會繼續往後方 sibling 找，最後命中的 view 仍在 navigation controller 底下。`UIScreenEdgePanGestureRecognizer` 掛在 navigation controller 的 view 上，是遮罩的祖先，而 UIKit 會把 touch 交給命中 view **與其所有祖先**的 gesture recognizer。且該 prop 預設 `false`，只有 `ViewportMaskView` 系列會送 `boundaryMode`，一般 `GradientMaskView` 連判斷式都走不到。

2. **空區間全擋不是缺陷，未修改。** `EdgeMaskGeometry.containsTouch` 的 `end > start` 條件曾被誤判為 bug。實際上 `top` / `bottom` 在 `ViewportMaskViewProps` 是必填；繪製路徑與觸控路徑一致 —— iOS `applyMaskUpdates` 在 `start == end` 時 maskRoot 只剩高度 0 的 `middleSolid`，alpha mask 全透明，內容整個看不見；Android `GradientMaskView.kt` 直接在 `end <= start` 時 return，連 `super.draw()` 都不呼叫。空區間本來就什麼都看不到，拒收觸控是既有且有測試的契約（`tests/swift/main.swift`、`docs/viewport-mask.md`）。改掉它等於退回一個正確行為。

3. **回收的原生 view 會保留前一個畫面的狀態（已修）。** Fabric 依 component name 回收 view，而 `ExpoViewProps::propsMap` 只把「這個 element 實際送出的 raw props」併入上一份 map。Wrapper 沒送的 prop 永遠不會呼叫到原生 setter，於是回收後的 view 保留前一位使用者的值。兩個方向都漏：

   - `GradientMaskView` 掛進由 `ViewportMaskView` 回收來的 view，會繼承 `boundaryMode`、`restrictTouchesToVisibleArea` 與舊的可視區間，於是把內容裁掉、並拒收自己從未宣告過的範圍外觸控。
   - 反方向 `ViewportMaskView` 會繼承前一個 gradient element 的 `colors` / `locations`，羽化用到別人的漸層色。

   修法是讓每個 wrapper 每次 render 都送出完整的原生 prop 面：`nativeMaskProps` 補 `boundaryMode` / `restrictTouchesToVisibleArea` / `visibleTop` / `visibleBottom` 與兩個 ratio 旗標，`viewportMaskProps` 旁邊新增 `viewportGradientProps` 補 `colors` / `locations` / `maskDirection`。

4. **防止再次漏送。** `tests/mask-geometry.test.mjs` 新增的測試會直接 parse `ios/GradientMaskModule.swift` 與 `GradientMaskModule.kt`，比對兩平台註冊的 prop 一致，並確認兩組 wrapper 都涵蓋整份清單。日後新增 `Prop(...)` 而沒有 wrapper 送出，測試會直接紅掉。

## Native stack 場景

`example/NativeStackScene.tsx`，以 `EXPO_PUBLIC_MASK_VALIDATION=native-stack` 啟用，或在一般 Example 點 **Native stack** 分頁。使用 `@react-navigation/native-stack` + `react-native-screens`，讓畫面真的由 `UINavigationController` 管理，才會有原生邊緣返回手勢。

三個畫面：

| 畫面 | 內容 | 要看什麼 |
|---|---|---|
| Home | 兩顆 push 按鈕 | 起點 |
| Viewport mask | 全螢幕 `ViewportMaskView` 包 12 列 tap targets，控制列可切 `restrictTouchesToVisibleArea` 與可視區（full / half / empty） | 開關限制後從左緣左滑，返回是否仍然有效 |
| Gradient mask | 全螢幕 `GradientMaskView`，**完全沒有任何 boundary prop** | 每一列都必須可點、畫面不得被裁切 |

`Replace with gradient` 用 `navigation.replace()`，在同一次 commit 裡卸載 viewport 遮罩並掛上 gradient 遮罩 —— 這正是 Fabric 交接同一顆原生 view 的時機，是複現 recycling 缺陷的關鍵操作。

## 執行步驟

```bash
# 1. 套件原始碼改完後一定要重建。Example 走 package.json 的 main: build/index.js，
#    不是 src/，忘記重建會測到修復前的程式碼。
npm run build
npm run test:geometry

# 2. 建置並啟動 Example。--port 必須避開你自己 App 的 Metro（見下方陷阱 2）
cd example
RCT_METRO_PORT=8083 EXPO_PUBLIC_MASK_VALIDATION=native-stack \
  npx expo run:ios --port 8083 --device "<simulator udid>"
```

手動檢查項目：

1. Home → **Push viewport mask screen** → 從左緣右滑 → 應回到 Home。
2. 再進去，**限制觸控：開** → 再左滑 → 仍應回到 Home。
3. 切 **可視區：half** 與 **empty**，各再左滑一次 → 都應回到 Home。
4. 進 viewport 畫面，開限制、切 half，按 **Replace with gradient** → gradient 畫面的 12 列**每一列都要能點亮**，且整頁不得有被裁掉的帶狀區域。任何死掉或消失的區塊就是殘留的 boundary 狀態。
5. 在 gradient 畫面再左滑一次 → 應回到 Home。

## 環境陷阱

這三個都不是套件問題，但都會讓驗證得到錯誤結論，記下來省下次的時間。

1. **預編譯 React core 連不到第三方 Fabric pod。** 加入 `react-native-screens` 後連結失敗，缺 `facebook::react::Sealable`、`ShadowNode::getDebugName` 等符號（訊息裡的 SwiftUICore 警告是誤導，不是原因）。解法是在 `example/app.json` 加 `expo-build-properties` 的 `ios.buildReactNativeFromSource: true`。寫在 app.json 而不是 `ios/Podfile.properties.json`，因為後者會被 `expo prebuild` 重新產生。

2. **Metro port 撞到別的專案。** Example 沒有裝 `expo-dev-client`，所以 `expo run:ios` 印出的 `expo-development-client://...?url=` deep link 是無效的，App 只會連預設的 8081。如果 8081 上跑的是另一個專案的 Metro，Example 會載入那個專案的 bundle，然後炸出與本專案無關的錯誤（實測是 `Cannot find native module 'ExpoLinking'`）。必須用 `--port` 搭配 `RCT_METRO_PORT` 重新建置，把 port 烘進 App，不能只換 Metro 的 port。

3. **`build/` 過期。** 同上第一點的註解。`src/` 改完沒跑 `npm run build`，Example 測到的是舊程式碼。

另外承接 `pass-through-retest.md` 的結論：自動互動測試應使用獨立模擬器，避免與使用者正在操作的模擬器互相干擾。

## 驗證狀態

- `npm run test:geometry`：15 項通過，含 4 項新增的 prop 覆蓋率與回收狀態測試。
- `tsc --noEmit`：套件與 Example 皆乾淨。
- Swift geometry（`swiftc tests/swift/main.swift ios/EdgeMaskGeometry.swift`）：23 項通過。該檔案本次未修改。
- iOS 模擬器（iPhone 16 Pro / iOS 18.3）：native stack 場景建置並啟動成功，左滑返回經人工確認可用。
- **尚未完成**：上述五項手動檢查的 XCUITest 自動化，以及 Android 對應驗證。`tests/ios/ViewportTouchUITests.swift` 已有可延用的 harness 與 `tests/ios/configure.rb` target 設定流程。
- `npm run lint` 目前失敗，屬既有問題（repo 使用 `.eslintrc.js`，ESLint 9 需要 flat config），與本次改動無關。
