# restrictTouchesToVisibleArea 穿透重測

## 發現與修正

1. 原生遮罩排除範圍外的新觸控後，外層一般 View 仍會成為 hit target。重測改為把背景 Pressable 放在整個容器後面，確認 auto wrapper 阻擋、box-none wrapper 放行。套件不會自行修改 App 祖先節點。
2. Example 開關寫入 shared value 後立即讀回來設定 React label，可能顯示舊值；改為計算一次 next，同時寫入 shared value 與 label。
3. 保留原本三分頁與控制區，僅在列表後面加一顆背景按鈕，計數直接顯示於按鈕內。沒有新增測試分頁。

## 驗證

- iOS 原有四項 touch scene 功能測試通過。新增 wrapper 案例第一次冷啟动找不到場景，重新執行後通過；[wrapper summary](artifacts/pass-through-retest/ios-wrapper-summary.json)。
- Android 15 項 touch scene 檢查全部通過，含上下穿透、羽化保留觸控、動態邊界與比例、開關、拖曳續行及祖先 wrapper；[原始結果](artifacts/pass-through-retest/android-harness-results.json)。
- iOS 原版聊天頁實測 all → visible → all → visible，後方按鈕計數 0 → 1 → 1 → 2；羽化區點擊不觸發背景按鈕。標籤與狀態一致；[summary](artifacts/pass-through-retest/ios-chat-summary.json)、[截圖](artifacts/pass-through-retest/ios-chat-button.png)。

模擬器冷啟動時 Android UI tree 曾尚未可讀，測試改為有截止時間的就緒等待。此為驗證工具問題，不計為功能通過依據。

所有改動均為 Example、測試與整合文件；本次未修改原生套件 API 或 hit-test 實作。功能確認範圍為 iOS 26.5 / Android API 35 模擬器，並非實體裝置效能驗收。

Android 原版聊天頁同樣通過 all → visible → all → visible，背景計數 0 → 1 → 1 → 2；[結果](artifacts/pass-through-retest/android-chat-results.json)、[截圖](artifacts/pass-through-retest/android-chat-button.png)。

## 清楚的開關標籤

現有開關改為「背景穿透：關／開」，功能與預設值不變。Android 重跑通過。iOS 首次在使用者同時操作的模擬器上，計數已增加到 14，與測試預期的 1 不符；改在獨立的 GradientMask-Label-Validation 模擬器重跑後，精確計數 0 → 1 → 1 → 2 通過，未更改測試斷言或執行碼。[iOS](artifacts/pass-through-retest/ios-clear-label-summary.json)、[Android](artifacts/pass-through-retest/android-clear-label-results.json)。後續自動互動測試應使用獨立模擬器，避免干擾使用者。
