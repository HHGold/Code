import tkinter as tk
from tkinter import ttk, messagebox
import requests
import threading
import time
from datetime import datetime

# ========================
# 雄獅旅遊配置
# ========================
LION_NORM_GROUP_ID = "5c25c87a-b6d7-4ecc-88b6-07a379bfcf6e"
LION_TARGET_GROUP_ID = "26PI516CIA-T"
LION_DATE_START = "2026-05-01"
LION_DATE_END = "2026-05-31"
LION_API_URL = "https://travel.liontravel.com/detail/groupcalendarjson"

# ========================
# 可樂旅遊配置
# ========================
COLA_TOUR_CODE = "LAA061309BR6"
COLA_TOUR_DATE = "2026/06/13"
COLA_URL = f"https://tour.colatour.com.tw/itinerary?TourCode={COLA_TOUR_CODE}&TourDate={COLA_TOUR_DATE}"


class LionMonitorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("旅遊席次監控器 (雄獅 + 科林)")
        self.root.geometry("580x620")
        self.root.configure(bg="#1a1a2e")
        self.root.resizable(True, True)

        # 監控狀態
        self.is_monitoring = False

        # 雄獅上次席次
        self.lion_last_vacancy = None

        # 科林上次可售
        self.cola_last_available = None

        # Playwright browser (共用)
        self._playwright = None
        self._pw_browser = None

        self.setup_ui()
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    # ──────────────────────────────────────
    # UI 建立
    # ──────────────────────────────────────
    def setup_ui(self):
        BG = "#1a1a2e"
        CARD = "#16213e"
        ACCENT_RED = "#e94560"
        ACCENT_BLUE = "#0f3460"
        TEXT_MAIN = "#eaeaea"
        TEXT_SUB = "#a0a0c0"

        # ── 主標題 ──
        tk.Label(
            self.root,
            text="✈ 旅遊席次監控器",
            font=("Microsoft JhengHei", 18, "bold"),
            bg=BG, fg=ACCENT_RED
        ).pack(pady=(14, 4))

        # ══════════════════════
        # 雄獅旅遊區塊
        # ══════════════════════
        lion_outer = tk.Frame(self.root, bg=ACCENT_BLUE, bd=0)
        lion_outer.pack(padx=16, pady=6, fill="x")

        lion_header = tk.Frame(lion_outer, bg=ACCENT_BLUE)
        lion_header.pack(fill="x", padx=2, pady=(6, 2))
        tk.Label(
            lion_header,
            text="🦁  雄獅旅遊",
            font=("Microsoft JhengHei", 13, "bold"),
            bg=ACCENT_BLUE, fg="#ffd700"
        ).pack(side="left", padx=8)

        lion_card = tk.Frame(lion_outer, bg=CARD, bd=0)
        lion_card.pack(fill="x", padx=2, pady=(0, 6))

        tk.Label(
            lion_card,
            text=f"產品代碼: {LION_TARGET_GROUP_ID}   |   出發月份: {LION_DATE_START[:7]} ~ {LION_DATE_END[:7]}",
            font=("Microsoft JhengHei", 9),
            bg=CARD, fg=TEXT_SUB
        ).pack(anchor="w", padx=10, pady=(6, 2))

        lion_data = tk.Frame(lion_card, bg=CARD)
        lion_data.pack(fill="x", padx=10, pady=4)

        self.lion_vacancy_var = tk.StringVar(value="可賣: --")
        self.lion_total_var = tk.StringVar(value="總席: --")
        self.lion_status_var = tk.StringVar(value="狀態: 等待中")

        tk.Label(lion_data, textvariable=self.lion_vacancy_var,
                 font=("Microsoft JhengHei", 18, "bold"), fg="#4fc3f7", bg=CARD).grid(row=0, column=0, padx=14)
        tk.Label(lion_data, textvariable=self.lion_total_var,
                 font=("Microsoft JhengHei", 12), fg=TEXT_SUB, bg=CARD).grid(row=0, column=1, padx=14)
        tk.Label(lion_card, textvariable=self.lion_status_var,
                 font=("Microsoft JhengHei", 10), fg=TEXT_SUB, bg=CARD).pack(anchor="w", padx=10, pady=(0, 6))

        # ══════════════════════
        # 可樂旅遊區塊
        # ══════════════════════
        cola_outer = tk.Frame(self.root, bg="#1b4332", bd=0)
        cola_outer.pack(padx=16, pady=6, fill="x")

        cola_header = tk.Frame(cola_outer, bg="#1b4332")
        cola_header.pack(fill="x", padx=2, pady=(6, 2))
        tk.Label(
            cola_header,
            text="🌏  可樂旅遊",
            font=("Microsoft JhengHei", 13, "bold"),
            bg="#1b4332", fg="#69f0ae"
        ).pack(side="left", padx=8)

        cola_card = tk.Frame(cola_outer, bg=CARD, bd=0)
        cola_card.pack(fill="x", padx=2, pady=(0, 6))

        tk.Label(
            cola_card,
            text=f"團號: {COLA_TOUR_CODE}   |   出發日: {COLA_TOUR_DATE}   |   台北出發 9天",
            font=("Microsoft JhengHei", 9),
            bg=CARD, fg=TEXT_SUB
        ).pack(anchor="w", padx=10, pady=(6, 2))

        cola_data = tk.Frame(cola_card, bg=CARD)
        cola_data.pack(fill="x", padx=10, pady=4)

        self.cola_available_var = tk.StringVar(value="可售: --")
        self.cola_total_var = tk.StringVar(value="團位: --")
        self.cola_waitlist_var = tk.StringVar(value="候補: --")
        self.cola_status_var = tk.StringVar(value="狀態: 等待中")

        tk.Label(cola_data, textvariable=self.cola_available_var,
                 font=("Microsoft JhengHei", 18, "bold"), fg="#69f0ae", bg=CARD).grid(row=0, column=0, padx=14)
        tk.Label(cola_data, textvariable=self.cola_total_var,
                 font=("Microsoft JhengHei", 12), fg=TEXT_SUB, bg=CARD).grid(row=0, column=1, padx=14)
        tk.Label(cola_data, textvariable=self.cola_waitlist_var,
                 font=("Microsoft JhengHei", 12), fg="#ff8a65", bg=CARD).grid(row=0, column=2, padx=14)
        tk.Label(cola_card, textvariable=self.cola_status_var,
                 font=("Microsoft JhengHei", 10), fg=TEXT_SUB, bg=CARD).pack(anchor="w", padx=10, pady=(0, 6))

        # ══════════════════════
        # 控制按鈕
        # ══════════════════════
        btn_frame = tk.Frame(self.root, bg=BG)
        btn_frame.pack(pady=10)

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Start.TButton",
                        font=("Microsoft JhengHei", 11, "bold"),
                        background="#e94560", foreground="white",
                        padding=(12, 6))
        style.configure("Refresh.TButton",
                        font=("Microsoft JhengHei", 10),
                        background="#0f3460", foreground="white",
                        padding=(12, 6))

        self.start_btn = ttk.Button(
            btn_frame, text="▶ 開始監控",
            style="Start.TButton",
            command=self.toggle_monitoring
        )
        self.start_btn.pack(side="left", padx=8)

        self.refresh_btn = ttk.Button(
            btn_frame, text="🔄 立即更新",
            style="Refresh.TButton",
            command=self.manual_refresh
        )
        self.refresh_btn.pack(side="left", padx=8)

        # ══════════════════════
        # 日誌區
        # ══════════════════════
        log_frame = tk.Frame(self.root, bg=BG)
        log_frame.pack(padx=16, pady=(4, 12), fill="both", expand=True)

        tk.Label(
            log_frame, text="📋 監控日誌",
            font=("Microsoft JhengHei", 10, "bold"),
            bg=BG, fg=TEXT_SUB
        ).pack(anchor="w")

        self.log_text = tk.Text(
            log_frame, height=10,
            font=("Consolas", 9),
            bg="#0d1117", fg="#8b949e",
            insertbackground="white",
            state="disabled",
            relief="flat", bd=0
        )
        self.log_text.pack(fill="both", expand=True)

        # 設定 Tag 顏色
        self.log_text.tag_config("warn", foreground="#ffa726")
        self.log_text.tag_config("ok", foreground="#66bb6a")
        self.log_text.tag_config("err", foreground="#ef5350")

    # ──────────────────────────────────────
    # 日誌
    # ──────────────────────────────────────
    def log(self, message, tag=None):
        now = datetime.now().strftime("%H:%M:%S")
        self.log_text.config(state="normal")
        self.log_text.insert("end", f"[{now}] {message}\n", tag or "")
        self.log_text.see("end")
        self.log_text.config(state="disabled")

    # ──────────────────────────────────────
    # 控制
    # ──────────────────────────────────────
    def toggle_monitoring(self):
        if not self.is_monitoring:
            self.is_monitoring = True
            self.start_btn.config(text="⏹ 停止監控")
            self.log("監控已啟動 (每 10 分鐘自動檢查)", "ok")
            threading.Thread(target=self.monitor_loop, daemon=True).start()
        else:
            self.is_monitoring = False
            self.start_btn.config(text="▶ 開始監控")
            self.log("監控已停止", "warn")

    def manual_refresh(self):
        threading.Thread(target=self.fetch_all, daemon=True).start()
        self.log("手動刷新中...")

    def monitor_loop(self):
        while self.is_monitoring:
            self.fetch_all()
            count = 0
            while count < 600 and self.is_monitoring:
                time.sleep(1)
                count += 1

    def fetch_all(self):
        """同時抓取兩個來源"""
        t1 = threading.Thread(target=self.fetch_lion, daemon=True)
        t2 = threading.Thread(target=self.fetch_cola, daemon=True)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

    # ──────────────────────────────────────
    # 雄獅 API
    # ──────────────────────────────────────
    def fetch_lion(self):
        payload = {
            "NormGroupID": LION_NORM_GROUP_ID,
            "GoDateStart": LION_DATE_START,
            "GoDateEnd": LION_DATE_END,
            "TourSource": "Lion"
        }
        headers = {
            "Content-Type": "application/json",
            "Referer": f"https://travel.liontravel.com/detail?NormGroupID={LION_NORM_GROUP_ID}&GroupID={LION_TARGET_GROUP_ID}"
        }
        try:
            response = requests.post(LION_API_URL, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                target = next((item for item in data if item.get("ID") == LION_TARGET_GROUP_ID), None)
                if target:
                    available = target.get("AvailableVacancy")
                    total = target.get("TotalVacnacy")
                    status = target.get("Status")
                    self.root.after(0, self.update_lion_ui, available, total, status)
                else:
                    self.root.after(0, self.log, f"[雄獅] 找不到 {LION_TARGET_GROUP_ID}", "err")
            else:
                self.root.after(0, self.log, f"[雄獅] API 錯誤: {response.status_code}", "err")
        except Exception as e:
            self.root.after(0, self.log, f"[雄獅] 連線錯誤: {str(e)}", "err")

    def update_lion_ui(self, available, total, status):
        self.lion_vacancy_var.set(f"可賣: {available}")
        self.lion_total_var.set(f"總席: {total}")
        self.lion_status_var.set(f"狀態: {status}")
        self.log(f"[雄獅] 可賣={available} 總席={total} 狀態={status}", "ok")

        if self.lion_last_vacancy is not None and available != self.lion_last_vacancy:
            self.log(f"🚨 [雄獅] 席次變動: {self.lion_last_vacancy} → {available}", "warn")
            messagebox.showinfo(
                "雄獅席次變動！",
                f"產品 {LION_TARGET_GROUP_ID}\n席次變化: {self.lion_last_vacancy} → {available}"
            )
        self.lion_last_vacancy = available

    # ──────────────────────────────────────
    # 可樂旅遊 (Playwright 無頭瀏覽器)
    # ──────────────────────────────────────
    def fetch_cola(self):
        try:
            from playwright.sync_api import sync_playwright
            import re

            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
                )
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                    locale="zh-TW",
                )
                page = context.new_page()
                page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

                try:
                    page.goto(COLA_URL, wait_until="domcontentloaded", timeout=45000)
                except Exception:
                    pass  # 即使超時也嘗試讀取已載入內容
                page.wait_for_timeout(3000)

                body_text = page.inner_text("body")
                browser.close()

            # 解析席次：從「團位\nXX\n可售\nYY\n候補\nZZ」格式
            available = None
            total = None
            waitlist = None

            # 找「可售」後面的數字
            m_avail = re.search(r"可售\s*\n?\s*(\d+)", body_text)
            m_total = re.search(r"團位\s*\n?\s*(\d+)", body_text)
            m_wait  = re.search(r"候補\s*\n?\s*(\d+)", body_text)

            if m_avail:
                available = int(m_avail.group(1))
            if m_total:
                total = int(m_total.group(1))
            if m_wait:
                waitlist = int(m_wait.group(1))

            if available is not None:
                self.root.after(0, self.update_cola_ui, available, total, waitlist)
            else:
                self.root.after(0, self.log, "[科林] 無法解析可售席次", "err")

        except ImportError:
            self.root.after(0, self.log, "[科林] 錯誤: 請安裝 playwright (pip install playwright)", "err")
        except Exception as e:
            self.root.after(0, self.log, f"[科林] 抓取錯誤: {str(e)}", "err")

    def update_cola_ui(self, available, total, waitlist):
        self.cola_available_var.set(f"可售: {available}")
        self.cola_total_var.set(f"團位: {total if total is not None else '--'}")
        self.cola_waitlist_var.set(f"候補: {waitlist if waitlist is not None else '--'}")
        self.cola_status_var.set(f"狀態: 已更新 {datetime.now().strftime('%H:%M:%S')}")
        self.log(f"[科林] 可售={available} 團位={total} 候補={waitlist}", "ok")

        if self.cola_last_available is not None and available != self.cola_last_available:
            self.log(f"🚨 [科林] 可售席次變動: {self.cola_last_available} → {available}", "warn")
            messagebox.showinfo(
                "科林席次變動！",
                f"團號: {COLA_TOUR_CODE}\n出發日: {COLA_TOUR_DATE}\n可售席次: {self.cola_last_available} → {available}"
            )
        self.cola_last_available = available

    # ──────────────────────────────────────
    # 關閉
    # ──────────────────────────────────────
    def on_close(self):
        self.is_monitoring = False
        self.root.destroy()


if __name__ == "__main__":
    root = tk.Tk()
    app = LionMonitorApp(root)
    root.mainloop()
