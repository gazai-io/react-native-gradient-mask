# 0.2.0 發版驗證

本次新增兩項可選控制：

- `restrictTouchesToVisibleArea`：預設 `false`。開啟後，新手勢須從 clamp 後的 `top <= y < bottom` 範圍開始；羽化區可操作，既有拖曳移出後不中斷。`enabled=false` 一併取消限制。
- `percentageReference`：預設 `"container"`，可選 `"screen"`。百分比／ratio 羽化採 RN `Dimensions.get('screen').height`；數值／px 不變，top/bottom 仍為容器內數值座標。保留原有重疊 clamp。

## 實作範圍

iOS 在原生 `hitTest` 排除範圍外的新觸控；Android 同時處理 RN responder 的 hit-test（收縮 hitSlop）及原生 ACTION_DOWN。MOVE/UP 不重新拒絕已開始的手勢。未增加攔截 overlay、JS 範圍通知或逐幀 React state。

螢幕基準只在需要時訂閱 Dimensions，螢幕尺寸更新後重新計算比例。動畫中的百分比與模式仍可由 shared/derived values 驅動；實際 native container clamp 不變。

## 驗證結果

主要環境：Expo 56.0.17、React Native 0.85.3、Reanimated 4.3.1、Worklets 0.8.3、Node 24.13.0。

| 檢查 | 結果 |
| --- | --- |
| TypeScript build / Example typecheck | 通過 |
| Node 幾何與公開參數測試 | 10 項通過 |
| Swift 原生幾何 | 原有 13 + touch range 10 assertions 通過 |
| Android JUnit | 3 tests 通過 |
| iOS Release / Android Release | 建置通過 |
| iOS XCTest UI 整合 | 3 tests、0 failure，見 [原始 summary](artifacts/release-0.2.0/ios-xctest-summary.json) |
| Android 端到端互動與像素 | 10 checks 通過，見 [原始結果](artifacts/release-0.2.0/results.json) |

原生互動案例涵蓋：預設隱藏區域仍可點擊、開啟後上下區域點擊落到背景、羽化區可點擊、shared value 邊界更新、停用 mask 取消限制、重新關閉限制、範圍外拖曳起點被拒絕、範圍內開始拖曳至外部仍繼續。Android 最後一項 scroll offset 達 200，外部起點保持 0。

比例像素 oracle：固定 120-unit 高容器、上方 10%／下方 10px，在上方 30-unit 的同一像素取樣。容器模式已完全不透明（255）；螢幕模式仍在羽化中（iOS 92、Android 95），容器 frame 不變。圖像：[container](artifacts/release-0.2.0/percentage-container.png)、[screen](artifacts/release-0.2.0/percentage-screen.png)。這是比例功能驗證，不是 GPU 效能量測。

## 重跑

1. 安裝 root / Example 相依、建置套件，再以 Example 的 `npm run prebuild` 產生原生專案。
2. 使用 `EXPO_PUBLIC_MASK_VALIDATION=touch` 建置並啟動 Release Example。
3. Android：`python3 tests/android/touch_range.py /path/to/adb emulator-5554 /tmp/touch-results`（需 Pillow）。
4. iOS：根目錄執行 `ruby tests/ios/configure.rb`（需 CocoaPods 的 xcodeproj gem），再以 `EXPO_PUBLIC_MASK_VALIDATION=touch xcodebuild test` 執行 generated workspace 的 `GradientMaskUITests` scheme、Release configuration 及所選 simulator destination。
5. 清空 `EXPO_PUBLIC_MASK_VALIDATION` 重新建置，回到預設互動 Example。

## 發布與限制

版本 0.2.0；沿用 `.github/workflows/release.yml`，推送 `v0.2.0` 觸發 GitHub Trusted Publishing、npm provenance 與 GitHub release。Node 改由 `.nvmrc` 讀取，發布前核對 tag/package 版本並執行幾何測試及 build。

本機 npm 登入 401，因此使用已有成功紀錄的 GitHub OIDC 發布流程，不將 token 放入原始碼。打包會核對 Swift、Kotlin、Gradle、podspec、screen-height helper、JS 及型別檔案。

新觸控/比例測試使用 iOS 26.5 與 Android API 35 模擬器。**實體裝置效能比較、螢幕旋轉/摺疊/多視窗的實機整合、產品鍵盤整合仍未驗證。** 既有 UI-thread/GPU 比較限制見 [原驗收表](viewport-checklist.md)，不宣稱所有裝置無效能問題。Web 新 viewport API 不在本次支援範圍；觸控限制也不改變 VoiceOver/TalkBack 的 focus 篩選。

## 發布流程修正：0.2.1

`v0.2.0` 的 GitHub run 33998638055 在安裝 npm 階段失敗：npm@latest 已為 12.0.2，需要 Node 24.15.0 以上，不相容固定的 24.13.0。尚未建立 GitHub release 或發布 npm。保留原標籤，固定 npm 11.6.2，改以 0.2.1 發布；套件功能程式碼不變，沿用以上原生驗證。
