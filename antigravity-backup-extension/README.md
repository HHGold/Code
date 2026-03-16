# Antigravity Backup (v1.1.7)

Antigravity Backup 是一款專為 Google **Antigravity** AI 助手量身打造的備份與還原工具。它能幫助您在新舊電腦之間，完美同步所有的 AI 對話紀錄、記憶檔案 (Brain) 以及首頁的最近對話清單。

## 🌟 核心功能

- **全方位備份 (Full State Backup)**：除了對話內容，更包含 `installation_id`、`user_settings.pb` 以及系統索引 (Index)，確保還原後的對話清單不會空白。
- **直連鏡像同步 (Direct Mirror)**：採用優化過的 `robocopy` 引擎，即便 `brain` 資料夾有數萬個碎小檔案也能在數秒內完成同步，不再卡死。
- **自動化設定**：移除冗餘的重新整理按鈕，面板會自動監聽並即時顯示最新的備份路徑。
- **影子還原技術**：即便在 IDE 運行中也能嘗試抓取關鍵快照，並於還原後提供顯眼的重啟提醒。

## 📁 備份範疇

本工具會保護以下關鍵數據：
1. **對話內容 (`.gemini/antigravity/`)**：包含 `conversations`、`brain`、`knowledge`、`annotations` 等 7 個核心目錄。
2. **身份識別**：`installation_id` 與 `user_settings`，讓新電腦能「繼承」舊電腦的對話權限。
3. **UI 索引 (`AppData/Roaming/Antigravity/User/`)**：備份 `globalStorage` (總書目)、`workspaceStorage` (首頁最近對話清單) 以及 `History` (指令歷史)。
4. **全域規則**：`GEMINI.md` 等自訂開發規則。

## ⚙️ 擴充套件設定

* `antigravityBackup.networkPath`: 備份目的地路徑 (例如：`\\gy\share\Antigravity\Backup`)。
  * *建議設置在穩定的 NAS 或雲端同步資料夾。*

## 🚀 如何使用

### 1. 備份 (Backup)
當您在舊電腦完成重要開發後：
- 打開側邊欄 **Antigravity Backup** 面板。
- 確認顯示的路徑正確。
- 點擊 **「Backup to Network」**。
- 狀態欄顯示 `✓ Backup Completed!` 即代表成功。

### 2. 還原 (Restore)
在新電腦安裝此擴充套件並設定相同路徑後：
- 點擊 **「Restore from Network」**。
- 等待狀態欄顯示 `✓ Restore Finished!`。
- **[重要]**：點擊彈出視窗的 OK，然後 **「完全關閉 Antigravity 軟體並重新啟動」**。這是讓對話清單出現在首頁的必要步驟。

## ⚠️ 注意事項

- **手動重啟**：Antigravity 1.20+ 版本的索引緩存非常深，單純的 `Reload Window` 無法刷新清單，還原後請務必手動重開軟體。
- **檔案鎖定**：如果備份時出現警告，建議先關閉 Antigravity 主視窗後再執行一次備份以讀取最完整的索引快照。

---
Developed by HHGold. Designed for peak productivity with Antigravity AI.
