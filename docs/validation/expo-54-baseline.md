# Expo 54 原版建置基準

驗證日期：2026-09-06。來源 commit：`ed37b6e1e3691d90bc899efc1d6ed2804214a4da`。
所有基準檢查均使用此 commit 的程式碼、package.json 與 lockfile；先完成基準，再升級環境。

## 實際安裝版本

| 套件 | 根目錄開發環境 | Example |
| --- | --- | --- |
| Expo | 54.0.31 | 54.0.31 |
| React Native | 0.81.5 | 0.81.5 |
| React | 19.2.3 | 19.1.0 |
| Reanimated | 3.19.5 | 4.1.6 |
| Worklets | 未安裝 | 0.5.1 |

工具：根目錄 shell 的 Node 為 24.13.0；Example shell／產生的 `.xcode.env.local`
使用 Homebrew Node 23.9.0。Xcode 26.5 (17F42)、OpenJDK 17.0.14。
Example 原先已啟用 New Architecture。

## 安裝順序與已完成檢查

先在根目錄執行 `npm ci`，完成後才在 `example/` 執行 `npm ci`。
Example 的 `file:..` 連結會執行根目錄 `prepare`，兩者不可同時首次安裝；
否則會因根目錄 `expo-module` 尚未就緒而失敗。本次依序重跑後安裝成功。

| 檢查 | 結果 |
| --- | --- |
| 根目錄 `npm ci` | 通過 |
| Example `npm ci` | 通過 |
| 根目錄 `npm run build` | 通過 |
| Example `npx tsc --noEmit` | 通過 |
| Example `npx expo export --platform ios --platform android` | 通過，兩平台均產生 Hermes bundle |
| Example iOS / Android `expo prebuild --no-install` | 通過，package.json 無變更 |
| iOS `pod install` | 通過，80 Pods，包含 GradientMask 0.1.1 |
| Android `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a` | 通過，263 tasks，6m 56s |
| iOS Release `xcodebuild`（arm64 / x86_64 simulator） | `BUILD SUCCEEDED` |
| iOS Release 安裝、啟動 | 通過；iPhone 17 Pro Max / iOS 26.5 顯示訊息列表、Half (50%)、Auto、Opacity Stress Test |

點擊自動化工具回報 `Sky Computer Use native pipe closed before response`，因此沒有把
模式切換、壓力測試或捲動互動記為通過。Android 驗證範圍為 APK 建置，未執行裝置互動測試。
沒有量測 FPS，也不以本次 smoke check 推論效能。

iOS 原生建置命令（在 `example/ios/`，destination 請替換為本機模擬器）：

```sh
xcodebuild -workspace reactnativegradientmaskexample.xcworkspace \
  -scheme reactnativegradientmaskexample -configuration Release \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  -derivedDataPath /tmp/gradient-mask-baseline-derived -jobs 6 CODE_SIGNING_ALLOWED=NO
```

## 重現

在上述 commit 的獨立 checkout 依序執行：

```sh
npm ci
npm run build
cd example
npm ci
npx tsc --noEmit
npx expo export --platform ios --platform android --output-dir /tmp/gradient-mask-baseline-export
npx expo prebuild --no-install
cd ios
pod install
cd ..
npx expo run:ios
```

Android 建置（需 JDK 17 與 Android SDK）：

```sh
cd example/android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
```

原版網路安裝曾因執行沙箱無法解析 npm registry 而失敗；允許連網後成功，
沒有修改依賴版本來避開問題。

## 記錄位置

本機完整輸出位於 `/private/tmp/gradient-mask-baseline-*.log`；這些暫存檔不隨 Git 保存。
本文件保存可重現命令、版本與結論。環境升級另記於 `expo-56-upgrade.md`。
原版 APK、Podfile.lock、啟動畫面保存在 `/private/tmp/gradient-mask-baseline-artifacts/`；
iOS App 保存在上述 derived data 目錄。升級前已確認所有原本追蹤的檔案與來源 commit 相同。
