# Antigravity Backup

Antigravity Backup 是一個專為「Antigravity」AI 助手所設計的 VS Code 擴充套件，幫助您輕易地將對話紀錄與設定（如 `Conversations`、`Brain` 記憶檔或 `Rules` 等）備份到您自訂的網路路徑，或從網路路徑還原。

## 功能

- **一鍵備份 (Backup)**：使用內建 `robocopy` 與 `copy` 功能，快速將本機端的 Antigravity 記憶和對話同步到遠端路徑。
- **一鍵還原 (Restore)**：快速將遠端備份的檔案同步回本機（注意：這會覆寫您本機目前的紀錄，請務必先關閉 Antigravity 應用程式後再還原）。

## Extension Settings 擴充套件設定

此擴充功能會貢獻以下一項設定，供使用者自訂：

* `antigravityBackup.networkPath`: 備份目的地網路路徑 (預設值: `\\\\gy\\share\\Antigravity\\Conversations`)

如果您換了網路硬碟位置，只需在 VS Code 的使用者設定 (Settings) 裡修改此值，在側邊欄按下 **Refresh Config** 即可套用。

## 如何使用 (How to Use)

安裝成功後，請依照以下步驟操作：

### 1. 找到工具欄
在 VS Code 最左側的活動列 (Activity Bar) 中，您會看到一個新的「雲端下載圖示 ☁️」。點擊它即可打開 Antigravity 備份面板。

### 2. 設定網路路徑 (選填)
預設備份路徑為 `\\gy\share\Antigravity\Conversations`。
- 如果您需要更改路徑，請至 VS Code **「設定 (Settings)」** (`Ctrl+,`)。
- 搜尋 `antigravityBackup.networkPath` 並輸入您的新路徑。
- 修改後，返回面板點擊 **「Refresh Config」** 按鈕即可同步路徑。

### 3. 備份 (Backup)
當您在使用 Antigravity 完成一段重要的對話或開發後，點擊 **「Backup to Network」**。
- 系統會自動執行增量備份，將所有重要的對話、大腦記憶、工作流與全域規則同步到設定的網路位置。
- 下方的狀態列會顯示備份進度與結果。

### 4. 還原 (Restore)
當您切換到另一台電腦，或需要找回之前的對話紀錄時：
- **重要：請先關閉 Antigravity 應用程式！** 避免檔案被鎖定。
- 點擊 **「Restore from Network」** 按鈕。
- 系統會將網路路徑上的所有備份資料覆蓋回目前的本機端目錄。
- 完成後重新啟動 Antigravity 即可看到完整的歷史紀錄。
