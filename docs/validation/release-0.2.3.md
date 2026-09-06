# 0.2.3 發布：新版影片、GIF 與整合說明

## 內容

- Example 的 `Top 50% screen` 對齊實際螢幕中線，螢幕比例下緣同樣換算容器原點；保留 numeric local coordinates 的套件契約。
- 移除 Example 遮罩容器背景，以可切換的頁面棋盤背景展示真實透明度。
- iOS / Android 實錄 MP4，各自轉成 360px、12fps、128 色的循環 GIF，三語 README 嵌入新 GIF 並連至完整影片。
- README 修正舊 Android Bitmap 與固定 60fps 描述；API 文件補完整螢幕位置換算、透明背景、獨立座標基準與嵌入 root 限制。
- 所有示範媒體排除 npm tarball，以版本化 GitHub / Release URL 提供；README 文件連結也固定至 v0.2.3。

## 驗證依據

- 既有兩平台原生、邊界、觸控與幾何結果見 [0.2.2](release-0.2.2.md)。本次未修改 library runtime。
- 修正後 iOS 956-unit 高螢幕：上緣 y=478、下緣 y=717；Android 2400px 截圖：上緣 1200.5、下緣 1800.5，容器 frame 不變。見 [位置驗證](artifacts/screen-origin/)。
- 新背景下再次執行 iOS ScreenBoundaryUITests 與 Android screen_origin.py 均通過；[背景截圖](artifacts/background-demo/)。
- iOS DemoRecordingUITests 實際操作八個步驟，simctl 錄影；Android adb screenrecord 錄製相同順序。
- 影片抽幀檢查確認含上緣定位、背景切換、下緣定位、羽化與開關；GIF 可解碼且為多幀。

GIF 為降低體積而降幀與量化，不是效能比較。實體裝置效能仍未驗證；不宣稱已通過全部原始效能验收。

發布前 TypeScript build、Example typecheck、11 項 Node 測試通過。npm pack 110 檔共 58,138 bytes，逐檔比對一致，含必要原生檔案與型別，排除 Example、tests、驗證圖片與所有示範媒體。
