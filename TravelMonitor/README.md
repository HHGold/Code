# ✈ 旅遊席次監控器

自動監控 **雄獅旅遊** 與 **可樂旅遊** 的席次，席次有變動時立即透過 **Telegram** 通知。
支援在 Telegram 直接輸入指令手動查詢。

---

## 監控目標

| 旅遊業者 | 產品資訊 |
|---------|---------|
| 🦁 **雄獅旅遊** | 產品代碼：`26PI516CIA-T`，出發月份：2026/05 |
| 🎡 **可樂旅遊** | 團號：`LAA061309BR6`，出發日：2026/06/13，台北出發 9 天 |

---

## 自動排程

### 🔍 每小時静默巡邏

每天 **09:00 ~ 21:00**，每小時整點自動執行一次查詢：

| 行為 | 說明 |
|------|------|
| **席次有變動** | 🚨 立即發送 Telegram 變動通知 |
| **席次無變動** | 靜默，不發任何訊息 |

### 📈 每天定期報告

不論有無變動，幺天固定在以下時間發送完整席次報告：

| 時間 | 說明 |
|------|------|
| **10:00** | 早上定期報告 |
| **17:00** | 下午定期報告 |

---

## Telegram 指令（隨時手動查詢）

直接在 Bot 對話框輸入：

| 指令 | 效果 |
|------|------|
| `查旅遊` 或 `/check` | 🔄 **立刻查詢一次**，約 30~60 秒後回傳結果 |
| `狀態` 或 `/status` | 📊 顯示上次查詢的快取席次（即時，不需等待） |
| `看日誌` 或 `/logs` | 📜 顯示最近 20 筆系統運行日誌，可用於查修錯誤 |
| `說明` 或 `/help` | 📋 顯示指令說明 |

> ✅ **快速按鈕**：現在螢幕下方會顯示 **[🔍 立即查詢]** 與 **[📜 查看日誌]** 大按鈕，點擊即可直接執行指令，省去打字時間。

> ✅ 手動查詢與自動排程**完全獨立**，可隨時觸發，不影響排程。

---

## Telegram 通知類型

| 情境 | 訊息 |
|------|------|
| Container 啟動 | `✅ 旅遊席次監控器已啟動` + 排程說明 |
| **席次有變動**（每小時巡邏） | `🚨 [雄獎] 席次變動！` 或 `🚨 [可樂] 可售席次變動！`（**立即發出**） |
| 席次無變動（巡邏） | 🔇 靜默，不發任何訊息 |
| 定期報告（10:00 / 17:00） | `🔍 旅遊席次報告` + 兩個網站席次 + 下次查詢時間 |
| 手動查詢結果 | `✅ 即時查詢完成` + 兩個網站席次 |
| 發生錯誤 | `❌ 系統發生錯誤` + 錯誤詳細原因與堆疊追蹤 (Traceback) |

---

## 檔案結構

```
TravelMonitor/
├── monitor.py          # 監控主程式（需上傳到 NAS）
├── docker-compose.yml  # Docker 服務配置（在 Container Manager 上傳）
└── README.md           # 本說明文件
```

---

## Synology NAS 部署步驟（Container Manager GUI）

### 第 1 步：上傳 `monitor.py` 到 NAS

打開 **File Station**，建立資料夾並上傳：

```
/volume1/docker/travel-monitor/
    └── monitor.py      ← 上傳這個檔案
```

### 第 2 步：Container Manager → 專案 → 建立專案

| 欄位 | 填入 |
|------|------|
| **專案名稱** | `travel-monitor` |
| **路徑** | 點「設定路徑」→ 選 `/docker/travel-monitor` |
| **來源** | 上傳 docker-compose.yml（預設） |
| **檔案** | 瀏覽 → 選本機的 `docker-compose.yml` |

### 第 3 步：點「下一步」→「完成」

Container Manager 會自動：
1. 從 Microsoft 下載 Playwright image（**約 1.5GB，需等幾分鐘**）
2. 啟動 container，安裝必要套件
3. 執行監控程式

啟動後幾秒內，Telegram 就會收到啟動通知 📱

---

## 更新程式

若 `monitor.py` 有更新，只需：
1. 用 File Station 覆蓋 `/volume1/docker/travel-monitor/monitor.py`
2. 在 Container Manager 重新啟動 container

```
Container Manager → 容器 → travel_monitor → 重新啟動
```

---

## 技術注意事項 (維護必看) 🛠️

為了確保在 Synology NAS (Docker) 環境穩定運行，請注意以下幾點：

1. **Docker 網路模式 (Network Mode)**:
   - 必須在 `docker-compose.yml` 中設定 `network_mode: "host"`。
   - 原因：Synology 預設的 Bridge 模式常導致 Telegram API 連線發生 30 秒超時。使用 Host 模式可繞過虛擬網路層，大幅提升效能。

2. **Playwright 版本匹配**:
   - `docker-compose.yml` 中的 Image 版本 (例如 `v1.58.0`) 必須與程式內的 Playwright 套件版本完全一致。
   - 若未來更新 `pip install` 的版本，務必同步更新 Image 標籤，否則會報錯「找不到瀏覽器執行檔」。

3. **Telegram 連線穩定性**:
   - 已實施 `requests.Session()` 連線複用與自動 3 次重試機制。
   - 若發生連線超時，程式會自動啟動「網路診斷」(DNS 與 Google 測試)，結果可透過 `/logs` 查閱。

---

## 常見問題

**Q：可樂旅遊查詢比較慢？**
> 正常現象。可樂旅遊有 Cloudflare 防護，需啟動 Chromium 瀏覽器模擬人工操作，每次約 20~30 秒。

**Q：想查看系統運作狀況或錯誤原因？**
> 直接在 Telegram 輸入 `/logs` 或 `看日誌`，會回傳最新的 20 筆運作紀錄。如果抓取失敗，日誌中會包含詳細原因（如 Timeout 等）。

**Q：想改巡邏時間時段怨辦？**
> 修改 `monitor.py` 第 27、28 行：
> ```python
> MONITOR_START_HOUR = 9    # 開始時間
> MONITOR_END_HOUR   = 21   # 結束時間
> ```

**Q：想改定期報告時間怎麼辦？**
> 修改 `monitor.py` 第 26 行：
> ```python
> SCHEDULE_HOURS = [10, 17]   # 改這裡，例如改成 [9, 12, 18]
> ```
> 修改後重新上傳並重啟 container。

**Q：想新增其他旅遊監控？**
> 請洽開發者修改 `monitor.py`。
