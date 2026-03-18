# Antigravity Backup Extension

[English](#english) | [繁體中文](#繁體中文)

---

<a name="english"></a>
## English Description

This extension provides a simple and efficient way to backup and restore your Antigravity (VS Code based) settings, conversations, and workspace context to/from a network path.

### Features
- **Direct Mirroring (v1.1.x)**: Uses Windows `robocopy` for fast folder mirroring without the overhead of ZIP compression.
- **Login Protection**: Specifically designed to backup your data *without* overriding your GitHub/Google login tokens on the target machine.
- **UI Context Preservation**: Syncs `workspaceStorage` and `History` to keep your "Recent Conversations" and "Command History" intact.
- **Auto Configuration**: Automatically detects settings changes and updates the UI real-time.

### What is Backed Up?
- **Content**: All `.pb` conversation files, brain (indexing) data, knowledge items, global workflows, and **`GEMINI.md` (Rules)**.
- **Identity**: Core user settings (`user_settings.pb`).
- **UI Context**: Workspace states (`workspaceStorage`) and command history.

### What is EXCLUDED? (Privacy & Stability)
- **`installation_id`**: Not restored to keep each machine's unique identity.
- **`globalStorage`**: Excluded to protect your login tokens (GitHub/Google) from being overwritten.

### Usage
1. Open the **Antigravity Backup** view in the sidebar.
2. Configure your `Network Path` in VS Code Settings (`antigravityBackup.networkPath`).
3. Click **Backup to Network** to sync your data.
4. Click **Restore from Network** to recover your data.
   - *Note: Close and re-open Antigravity after restore.*

---

<a name="繁體中文"></a>
## 繁體中文說明

此套件提供簡單且高效的方式，讓您可以將 Antigravity (基於 VS Code) 的設定、對話紀錄與工作區上下文備份到網路路徑，或從中還原。

### 核心功能
- **直連鏡像 (v1.1.x)**： 使用 Windows `robocopy` 進行快速資料夾鏡像，免除 ZIP 壓縮帶來的效能損耗。
- **登入保護**： 特別優化還原邏輯，**不會**覆蓋目標電腦的 GitHub/Google 登入權杖 (Token)。
- **保留 UI 上下文**： 同步 `workspaceStorage` 與 `History`，確保「最近對話清單」與「指令歷史」在還原後依然存在。
- **自動更新設定**： 即時偵測路徑變更並更新介面顯示。

### 備份範圍
- **對話內容**： 所有的 `.pb` 對話檔、Brain (索引數據)、知識庫 (Knowledge)、全域工作流以及 **`GEMINI.md` (全域規則)**。
- **身份設定**： 核心使用者設定檔 (`user_settings.pb`)。
- **UI 狀態**： 工作區狀態快取 (`workspaceStorage`) 與輸入歷史紀錄。

### 排除項目 (隱私與穩定性)
- **`installation_id`**： 還原時主動跳過，以保留每台電腦唯一的機器身份。
- **`globalStorage`**： 不進行還原以保護您的 GitHub/Google 登入狀態不被登出。

### 使用方法
1. 開啟側邊欄的 **Antigravity Backup** 面板。
2. 在設定中配置您的備份路徑 (`antigravityBackup.networkPath`)。
3. 點擊 **Backup to Network** 進行備份。
4. 點擊 **Restore from Network** 進行還原。
   - *注意：還原完成後，請務必重啟 Antigravity 以載入最新索引。*

---
### Release Notes / 更新日誌 (1.1.16)
- **English**: Fixed restoration of `GEMINI.md` (Rules). Cleaned up redundant logs in restore process.
- **中文**: 修正 `GEMINI.md` (全域規則) 的還原邏輯。優化還原過程中的 Log 顯示（移除冗餘跳過提示）。

---
### Release Notes / 更新日誌 (1.1.15)
- **English**: Lightweight sync. Removed `globalStorage` from backup to avoid file locking and protect login tokens.
- **中文**: 輕量化同步。移除 `globalStorage` 備份以避免檔案鎖定問題，並確保 GitHub 登入狀態不被干擾。


---
Created by HHGold
