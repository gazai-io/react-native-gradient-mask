# 動態聊天遮罩驗收紀錄（2026-09-06）

後續新增的可選原生觸控限制與螢幕比例模式，以及已補齊的 iOS XCTest 手勢驗證，見 [0.2.0 紀錄](release-0.2.0.md)。下表保留最初階段的驗收狀態。

**結論：原始碼、型別、Example、原生模擬器驗證與打包檢查已交付；整份清單尚未完全驗收通過。實體 iPhone／Android 效能比較及產品內整合仍未驗證。** 不以模擬器 fps 宣稱「無效能問題」。

## 版本與修改分段

- 原版 SDK 54／RN 0.81.5 先完成原生建置與啟動：[baseline](expo-54-baseline.md)。
- 主要 Example 對齊 App：Expo 56.0.17、RN 0.85.3、React 19.2.3、Reanimated 4.3.1、Worklets 0.8.3：[upgrade](expo-56-upgrade.md)。環境 commit `70b4e5a`。
- 原邊緣功能進度先存為 `a143df6`，再依使用者清單新增明確 opt-in viewport API；與環境升級分開。
- 使用者要求修改前 commit：後續各批修正均先保存前一批進度。診斷 commit 亦保留；最終原始碼已移除臨時 native NSLog。

## 功能與 Example 核對

| 編號 | 結果及證據 | 限制／待驗證 |
| --- | --- | --- |
| M-01 | `top`／`bottom` 為容器內座標；原生 alpha mask 隱藏範圍外內容。iOS／Android 白底黑背景 oracle 已確認 50..160 的可視區域。 | 產品內容器與鍵盤座標轉換由 App 負責。 |
| M-02 | `topFeather`／`bottomFeather` 各自設定；預設 0、Example 各 40；原生透明漸層，無實色遮擋 overlay。 | px／比例產品語意未擅自假定。 |
| M-03 | shared／derived values 經 `useAnimatedProps` 驅動原生邊界；套件無逐幀 React state／`runOnJS`。 | 僅實測本次 Reanimated 4 環境，未重測所有 peer 支援版本。 |
| M-04 | 固定高度 FlashList；mask-only benchmark 內容 render=1。兩平台 chat-auto 過程 offset=120、mount=1/unmount=0、layout=2；文字更新合法產生 React render。 | 尚未在產品自己的 row 元件及 anchoring 策略下測試。 |
| M-05 | 200 筆假資料、80ms 逐字增加、追加／前插；兩平台場景均執行，遮罩邊界保持正確。原生列表捲動 benchmark 完成。 | 截圖與短場景不能證明所有裝置完全不閃爍；實體裝置長時間壓測未做。 |
| M-06 | 套件沒有增加觸控 overlay；Android 拖曳由 offset 120 變為 236.6，列表未 remount。Example 參考線／面板 `pointerEvents="none"`。 | iOS 手動手勢尚未完成：本機 Computer Use 點擊工具失敗。範圍外手勢排除仍由 App 做。 |
| M-07 | 兩平台原生 Release build、白底 oracle、舊方向漸層及聊天場景均完成。 | 新 viewport API 不支援 Web；舊 Web API 本輪未做瀏覽器回歸。 |
| M-08 | 舊兩個元件保留；新增 `ViewportMaskView`／`AnimatedViewportMaskView` 才啟用可視邊界。四方向、opacity=0、animated opacity 1↔0 兩平台視覺回歸完成。 | 舊 SDK 54 的「最終功能版本」未重新跑；SDK 54 紀錄是未修改原版 baseline。 |
| E-01 | 預設 Chat viewport：固定全高列表，Top 0↔50%（App 用容器高度計算）。 | — |
| E-02 | Bottom panel 用 shared value 模擬面板升降，只改 bottom，不改列表容器。 | 真實鍵盤接線及 Android window resize 策略需產品端驗證。 |
| E-03 | Type characters／Stop typing 控制持續文字成長，列表仍可捲動。 | Android 逐字成長同時拖曳已測（offset 230.9、mount 1/0、layout 2）；iOS 同時手動捲動與逐字成長未測。 |
| E-04 | Append／Prepend；穩定 message id；自動情境前後 offset、mount、layout 不變。FlashList 自動位置補償在診斷場景關閉。 | App 應自行決定前插後要維持數值 offset 或視覺 anchor。 |
| E-05 | 快速點擊可中途反向；另有 0／40、50%／40px、8-unit window、越界、反向邊界按鈕。benchmark 含快速開关、重疊羽化。 | Android 在 Top 動畫途中再次點擊已確認回到 0、列表不 remount；iOS 手動與實體裝置長時間測試待補。 |
| E-06 | 顯示容器 width/height、top/bottom、羽化參數；青／粉色參考線位於容器座標；文字以 UI animated props 更新。 | 一秒一次的列表診斷屬 Example，不在套件 render 路徑。 |

座標、單位、非有限值、零高度與重疊 clamp 規則：[API 文件](../viewport-mask.md)。`top`／`bottom` 是 layout 單位的數值，百分比線由 App 計算；羽化可混合數字、`px`、`%` 或 ratio 物件。

## 原生問題與修正

- iOS Fabric 在掛載後會清除 `CALayer.mask`。原本只在 props/layout 更新時設定 mask，造成初始遮罩／舊 API 顯示失效。現在使用專屬 host layer 保留 alpha mask，並與 framework mask 合成；保留所有 gradient/solid layers，不按字元或每幀重建。
- `direction` 在新 RN 會被 Yoga 解讀；公開 API 不變，傳到原生改名 `maskDirection`，避免碰撞。
- Android 使用硬體相容的 `saveLayer` + cached unit shaders + `DST_OUT`，沒有 `LAYER_TYPE_SOFTWARE`、大型 CPU bitmap、逐幀 color filter／shader 配置。仍有 GPU offscreen pass 成本，不能宣稱零成本。
- benchmark 報表 render 曾重置 callback 的相對時鐘，已改成持續 UI timestamp；修正前結果捨棄。

## Release 效能比較（僅模擬器）

同一個 200-row FlashList、同一 scrollTo 軌跡、容器固定 360 layout units；3 秒暖機，每階段 5 秒。以下是 UI frame callback 指標，各階段內容 render 次數均為 1。

| 場景 | iOS fps / p95 ms / >25ms 次數 | Android fps / p95 ms / >25ms 次數 |
| --- | --- | --- |
| mask 關閉 | 59.60 / 17 / 2 | 56.19 / 34 / 17 |
| 靜態 viewport 開啟 | 60.00 / 17 / 0 | 57.58 / 17 / 9 |
| 動態上下邊界 | 60.00 / 17 / 0 | 58.19 / 17 / 5 |
| 快速開關 | 60.00 / 17 / 0 | 60.00 / 17 / 0 |
| 羽化重疊 | 60.00 / 17 / 0 | 58.59 / 17 / 6 |
| 故意阻塞 JS 500ms | 60.00 / 17 / 0 | 59.19 / 17 / 4 |

裝置：iPhone 17 Pro Max / iOS 26.5 simulator；Android API 35 arm64 emulator。量測時停止另一平台測試 App，未並行原生建置。暖機後仍可能存在主機與 emulator 的抖動，數字較好不代表 mask 能提升效能。

Android 整段 `gfxinfo`：1,757 frames、75 missed-deadline frames（4.27%）、render p95 42ms、slow bitmap uploads 0。這是六階段合計，**不能拆成各階段 GPU 通過與否**；emulator GPU histogram 有 4950ms bucket，亦不可當成實體 GPU trace。UI callback 約 60fps 不等於 GPU 每幀都按時完成。

原始資料：[iOS JSON](artifacts/ios-benchmark.json)、[Android JSON](artifacts/android-benchmark.json)、[Android gfxinfo](artifacts/android-gfxinfo.txt)、[iOS 畫面](artifacts/ios-benchmark.png)、[Android 畫面](artifacts/android-benchmark.png)。

**實體裝置效能：未驗證，未通過完成標準。** 本次只有模擬器，已向使用者提出提供可開發測試裝置的需求。還需相同 Release 場景的 iPhone Instruments／Android Perfetto，開關順序交替，記錄刷新率、溫度、時長、frame deadline、CPU/GPU、記憶體；設定產品接受門檻後才可簽核。此外 App 固定版本有 Expo Doctor 提示的 Hermes V1 記憶體 regression，詳見環境紀錄，不能由遮罩套件保證消除。

## 測試、打包與可重跑場景

- TypeScript library build、Example typecheck 通過。
- Node 幾何／參數測試 8 項通過；Swift geometry 13 assertions 通過；Android JUnit 2 tests 通過。
- iOS / Android Release build 通過；舊原始 Example 的 SDK 54、SDK 56 環境 build 記錄另存，不混同功能回歸。
- 清除舊 build 目錄後重建，避免 TS 6 升級前留下的 `build/src` 被意外打包。
- `npm pack` 檢查必要 Swift、Kotlin、podspec、Gradle、Expo module config、JS 與 TypeScript declaration 都存在。包名版本維持 0.1.1；未發布 npm。
- `git diff --check` 通過。最終建置使用空的 `EXPO_PUBLIC_MASK_VALIDATION`，啟動預設互動 Example。

執行方式與 build modes：[Example 說明](../viewport-mask.md#example-and-performance)。切换 build mode 後務必檢查 App 畫面；Android 若 Gradle 將 bundle 視為 up-to-date，先執行 `:app:createBundleReleaseJsAndAssets --rerun-tasks` 再 assembleRelease。

功能截圖：[iOS viewport](artifacts/ios-viewport-geometry.png)、[Android viewport](artifacts/android-viewport-geometry.png)、[iOS legacy on](artifacts/ios-legacy-opacity-on.png)、[iOS legacy off](artifacts/ios-legacy-opacity-off.png)、[Android legacy off](artifacts/android-legacy-opacity-off.png)、[iOS chat](artifacts/ios-chat-boundary.png)、[Android chat](artifacts/android-chat-boundary.png)、[Android scroll](artifacts/android-chat-scrolled.png)。

最終互動驗證：[Android streaming + scroll](artifacts/android-stream-scroll.png)、[iOS default Example](artifacts/ios-default-example.png)、[Android default Example](artifacts/android-default-example.png)、[npm pack 檢查](artifacts/npm-pack.json)。
