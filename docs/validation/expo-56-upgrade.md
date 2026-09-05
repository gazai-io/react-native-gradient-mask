# Expo 56 驗證環境升級

日期：2026-09-06。先完成 [Expo 54 原版基準](expo-54-baseline.md)，再開始本次升級。

## 版本依據

對照本機 `gazai-aichat/services/mobile/package-lock.json` 的實際版本，
將根目錄開發相依套件與 `example/` 的執行環境對齊。Example 是後續主要驗證環境。
以精確版本與 lockfile 固定本次比較條件。

| 套件 | App／Example 目標版本 |
| --- | --- |
| Expo | 56.0.17 |
| React Native | 0.85.3 |
| React | 19.2.3 |
| Reanimated | 4.3.1 |
| Worklets | 0.8.3 |
| Gesture Handler | 2.31.2 |
| Safe Area Context | 5.7.0 |
| FlashList | 2.3.1 |
| Expo Blur | 56.0.4 |
| Expo Font | 56.0.7 |
| Expo System UI | 56.0.5 |
| Expo Splash Screen | 56.0.14 |
| Expo Modules Core | 56.0.22 |
| Expo Modules JSI | 56.0.12 |
| Expo Vector Icons | 15.1.1 |
| Babel Preset Expo | 56.0.18 |
| React types | 19.2.14 |
| TypeScript | 6.0.3 |

根目錄 `expo-module-scripts` 升級至 56.0.3，加入明確的 React / Worklets 開發依賴，
避免驗證時同時解析到 Reanimated 3 與 4。`.nvmrc` 固定 Node 24.13.0。

## 環境設定變更

- Babel 與 App 一樣只使用 `babel-preset-expo`，由 preset 自動配置 Worklets 轉換。
  [Expo SDK 56 Reanimated 文件](https://docs.expo.dev/versions/v56.0.0/sdk/reanimated/)。
- 明確宣告 `expo-font`，供 Example 的 vector icons 使用。
- 補齊 App 的 `expo-system-ui`，讓既有 `userInterfaceStyle: light` 設定可套用。
- 移除 SDK 56 已不可調整的 `newArchEnabled` 與 `android.edgeToEdgeEnabled`。
- 舊 `splash` 欄位未通過 SDK 56 schema，遷移到 `expo-splash-screen` config plugin，
  保留原有 image、resizeMode、backgroundColor 設定。
- 根目錄與 Example 以 override 將 Expo Modules Core 固定為 App lockfile 的 56.0.22，
  並明確宣告 JSI 56.0.12，避免間接版本範圍解析成 56.0.25 / 56.0.13。
  Core 保留為 Expo 的間接依賴；JSI 不使用 override，以免 npm 產生無效 peer dependency 標記。
- Worklets 的 `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` 設為 `true`，與 App 相同。
- FlashList 固定為 App 的 2.3.1，並沿用 App 的 Expo install 排除設定；
  Expo 56.0.17 的建議版本為 2.0.2，本次優先重現 App 的版本。
- 線上版本檢查建議 Expo 56.0.21；為精確重現 App 的 56.0.17，將 `expo` 也列入
  install exclude。Splash Screen 也固定為 App 的 56.0.14，而非建議的 56.0.15。
  版本檢查通過不代表這三個排除項是 SDK 最新建議版本。
- 新增 `npm run typecheck` 與 `npm run export:native` 作為 Example 驗證命令。
- TypeScript 6 的第一次套件 build 回報 TS5011；在根目錄 tsconfig 明確指定
  `rootDir: "./src"`，維持 `build/index.js` 的既有輸出位置。
- 新版 expo-module-scripts 開啟 `verbatimModuleSyntax` 後，原有四個 props 型別 import
  觸發 TS1484。本次明確保留原環境的 `verbatimModuleSyntax: false`，維持既有型別 import
  的消除行為，不將 source import 重構混入環境升級。
- 本機安裝的 Expo 56.0.17 內附 `template.tgz` 標示 57.0.9，依賴 Expo 57.0.7 / RN 0.86.0。
  初次 prebuild 的警告揭露此差異；該次 generated 專案未用來建置。
  `npm run prebuild` 明確使用 `expo-template-bare-minimum@56.0.35`，
  `preios` / `preandroid` 也使用此命令，避免首次 `npm run ios` / `android` 自動選錯範本。

SDK 56 的最低 iOS 版本為 16.4，且需要 Xcode 26.4 以上；本次使用 Xcode 26.5。
來源：[Expo SDK 56 升級說明](https://expo.dev/blog/upgrading-to-sdk-56)。
原生專案由 Expo prebuild 重新產生，沿用 repository 忽略 generated `example/ios`、
`example/android` 的做法。

## 驗證方式

在 repository 根目錄先執行：

```sh
nvm use
npm ci
npm run build
cd example
npm ci
npm run typecheck
npx expo install --check
npm run export:native
npm run prebuild -- --clean --no-install
cd ios
pod install
cd ..
npm run ios -- --configuration Release
```

`prebuild --clean` 會重建 generated 原生專案；若有手動原生設定，請先移入 config plugin。
Android 使用 JDK 17 與已安裝的 Android SDK：

```sh
cd example/android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
```

## 環境升級驗證結果

| 檢查 | 結果 |
| --- | --- |
| 根目錄與 Example `npm ci` | 通過；Node 24.13.0 |
| 根目錄 `npm run build` | 通過，輸出 `build/index.js` |
| Example `npm run typecheck` | 通過 |
| Example `npm ls` 核心相依樹 | 通過，沒有 invalid peer dependencies |
| iOS / Android Hermes export | 通過，各約 3.2 MB |
| SDK 56 prebuild | 通過，RN 0.85.3 範本；Expo patch 差異已明確記錄 |
| iOS Pods | 通過，Core 56.0.22 / JSI 56.0.12；GradientMask deployment target 自動提高至 16.4 |
| Android arm64 Debug APK | 通過；最終建置 32s，289 tasks |
| iOS Release（arm64 / x86_64 simulator） | `BUILD SUCCEEDED` |
| iOS Release 啟動 | 通過；iPhone 17 Pro Max / iOS 26.5 顯示原有 Example 畫面 |
| Expo Doctor | 20/22；兩項未通過如下，未隱藏檢查 |

Doctor 剩餘項目：

1. 套件根目錄與 `example/` 的獨立 node_modules 各有相同版本的 React、RN、Expo 依賴。
   保留原有本機套件開發結構；autolinking 已確認 Core / JSI 選用 Example 路徑、
   GradientMask 選用套件根目錄，原生建置只有一份對應 Pod。
2. 指定版本包含已知 Hermes V1 記憶體回歸，Doctor 建議 SDK 57 / RN 0.86.2 以上。
   本次以對齊 App 為目標保留指定版本；此限制須納入後續效能量測，不能宣稱不存在系統層效能風險。

本階段未量測 FPS；UI 自動點擊工具連線中斷，因此只將啟動畫面記為通過。
Android 尚未完成裝置互動測試。兩平台原生建置與 JavaScript export 並不等於完整產品驗收。

## 功能變更紀錄

環境升級階段未修改 `src/`、套件 `ios/` / `android/` 或 `example/App.tsx`，已以 git diff 確認。
後續遮罩、手勢、動畫或效能修改應另開變更紀錄，引用本文件的驗證環境，
並與此環境升級分開提交；原版相容性結論以基準文件為準。

本機完整驗證 log 使用 `/private/tmp/gradient-mask-upgrade-*.log` 前綴，
與原版 `/private/tmp/gradient-mask-baseline-*.log` 分開保存；暫存檔不隨 Git 保存。
功能修改前的完整來源快照為 `/private/tmp/gradient-mask-sdk56-environment.tar.gz`，
環境差異 patch 為 `/private/tmp/gradient-mask-environment.patch`。
APK、Podfile.lock 位於 `/private/tmp/gradient-mask-upgrade-artifacts/`；
iOS App 位於 `/private/tmp/gradient-mask-upgrade-derived/Build/Products/Release-iphonesimulator/`。
