# 0.2.2 邊界比例修正

## 行為

- `top` / `bottom` 改為 MaskLength，接受數值、px、百分比、ratio 與 shared/derived values；既有數值行為不變。
- `percentageReference` 同時供邊界與羽化使用。可選 `boundaryPercentageReference` 僅覆寫邊界，不填即繼承共用基準。
- screen 百分比代表從容器原點向下的螢幕高度比例，非螢幕絕對座標。bottom 是座標，不是底部 inset。
- container 比例由原生依實際 bounds 計算，screen 比例由 worklet 轉成 RN 單位；遮罩與觸控使用相同 clamp。無逐幀 React state 或 child layout 修改。
- Example 的 Top 0 ↔ 50%、Bottom 100% ↔ 75% 都遵循所選基準；Bottom panel 保留外部計算值。

## 驗證

沿用 Expo 56 / RN 0.85.3 / Reanimated 4 環境。

- TypeScript build、Example typecheck、11 項 Node 參數/幾何測試通過。
- Swift 原有 23 項檢查與新增 4 項比例觸控 assertions 通過；Android JUnit 4 tests 通過。
- iOS Release XCTest 4 tests 通過：[原始結果](artifacts/release-0.2.2/ios-summary.json)。
- Android Release 13 項互動檢查通過：[原始結果](artifacts/release-0.2.2/android-results.json)。
- 新案例以 400 高容器、top 25% / bottom 75% 驗證：容器基準下 y=125 可點、y=325 排除；螢幕基準下兩者相反；独立覆寫回 container 後恢復，容器 frame 不變。
- 舊觸控開關、數值邊界、羽化像素、範圍外起始/範圍內拖曳續行均重跑通過。

實體裝置效能、旋轉/多視窗及產品整合仍未驗證，不能宣稱所有原始效能驗收已完成。README 舊示範影片尚未重錄。

- 最終預設 Example iOS/Android Release 建置通過。
- npm pack 共 114 檔，逐一比對工作區一致，含原生檔案與新型別，驗證圖片不進套件。
