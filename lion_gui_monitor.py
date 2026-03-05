import tkinter as tk
from tkinter import ttk, messagebox
import requests
import threading
import time
from datetime import datetime

# --- 配置區 ---
NORM_GROUP_ID = "5c25c87a-b6d7-4ecc-88b6-07a379bfcf6e"
TARGET_GROUP_ID = "26PI516CIA-T"
TARGET_DATE_START = "2026-05-01"
TARGET_DATE_END = "2026-05-31"
API_URL = "https://travel.liontravel.com/detail/groupcalendarjson"

class LionMonitorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("雄獅旅遊席次監控器")
        self.root.geometry("500x400")
        self.root.configure(bg="#f0f0f0")

        self.is_monitoring = False
        self.last_vacancy = None
        
        self.setup_ui()

    def setup_ui(self):
        # 標題
        title_label = tk.Label(self.root, text="雄獅旅遊席次監控", font=("Microsoft JhengHei", 18, "bold"), bg="#f0f0f0", fg="#d32f2f")
        title_label.pack(pady=10)

        # 資訊區塊
        info_frame = tk.Frame(self.root, bg="white", bd=2, relief="groove")
        info_frame.pack(padx=20, pady=10, fill="x")

        tk.Label(info_frame, text=f"產品代碼: {TARGET_GROUP_ID}", font=("Microsoft JhengHei", 12), bg="white").pack(anchor="w", padx=10, pady=2)
        tk.Label(info_frame, text=f"出發月份: {TARGET_DATE_START} ~ {TARGET_DATE_END}", font=("Microsoft JhengHei", 10), bg="white").pack(anchor="w", padx=10, pady=2)

        # 狀態顯示
        self.status_var = tk.StringVar(value="等待開始...")
        status_label = tk.Label(self.root, textvariable=self.status_var, font=("Microsoft JhengHei", 14), bg="#f0f0f0", fg="#333")
        status_label.pack(pady=10)

        # 詳細數據區
        data_frame = tk.Frame(self.root, bg="#f0f0f0")
        data_frame.pack(pady=5)

        self.vacancy_var = tk.StringVar(value="可賣: --")
        self.total_var = tk.StringVar(value="總額: --")
        
        tk.Label(data_frame, textvariable=self.vacancy_var, font=("Microsoft JhengHei", 16, "bold"), fg="#1976d2", bg="#f0f0f0").grid(row=0, column=0, padx=20)
        tk.Label(data_frame, textvariable=self.total_var, font=("Microsoft JhengHei", 12), fg="#666", bg="#f0f0f0").grid(row=0, column=1, padx=20)

        # 按鈕區
        btn_frame = tk.Frame(self.root, bg="#f0f0f0")
        btn_frame.pack(pady=20)

        self.start_btn = ttk.Button(btn_frame, text="開始監控", command=self.toggle_monitoring)
        self.start_btn.pack(side="left", padx=10)

        self.refresh_btn = ttk.Button(btn_frame, text="立即更新", command=self.manual_refresh)
        self.refresh_btn.pack(side="left", padx=10)

        # 日誌區
        self.log_text = tk.Text(self.root, height=8, font=("Consolas", 9), state="disabled")
        self.log_text.pack(padx=20, pady=10, fill="both", expand=True)

    def log(self, message):
        now = datetime.now().strftime("%H:%M:%S")
        self.log_text.config(state="normal")
        self.log_text.insert("end", f"[{now}] {message}\n")
        self.log_text.see("end")
        self.log_text.config(state="disabled")

    def toggle_monitoring(self):
        if not self.is_monitoring:
            self.is_monitoring = True
            self.start_btn.config(text="停止監控")
            self.log("監控已啟動 (每 10 分鐘檢查一次)")
            threading.Thread(target=self.monitor_loop, daemon=True).start()
        else:
            self.is_monitoring = False
            self.start_btn.config(text="開始監控")
            self.status_var.set("監控已停止")
            self.log("監控已停止")

    def manual_refresh(self):
        threading.Thread(target=self.fetch_data, daemon=True).start()
        self.log("手動刷新數據...")

    def fetch_data(self):
        payload = {
            "NormGroupID": NORM_GROUP_ID,
            "GoDateStart": TARGET_DATE_START,
            "GoDateEnd": TARGET_DATE_END,
            "TourSource": "Lion"
        }
        headers = {
            "Content-Type": "application/json",
            "Referer": f"https://travel.liontravel.com/detail?NormGroupID={NORM_GROUP_ID}&GroupID={TARGET_GROUP_ID}"
        }
        try:
            response = requests.post(API_URL, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                # 根據調查，回傳的資料結構是一個包含多個項目的 list，每個項目都有 "ID" 欄位
                target_item = next((item for item in data if item.get("ID") == TARGET_GROUP_ID), None)
                
                if target_item:
                    available = target_item.get("AvailableVacancy")
                    total = target_item.get("TotalVacnacy")
                    status = target_item.get("Status")
                    self.root.after(0, self.update_ui, available, total, status)
                else:
                    self.log(f"錯誤: 在 API 結果中找不到 {TARGET_GROUP_ID}")
            else:
                self.log(f"API 錯誤: {response.status_code}")
        except Exception as e:
            self.log(f"連線錯誤: {str(e)}")

    def update_ui(self, available, total, status):
        self.vacancy_var.set(f"可賣: {available}")
        self.total_var.set(f"總席: {total}")
        self.status_var.set(f"狀態: {status}")
        
        if self.last_vacancy is not None and available != self.last_vacancy:
            self.log(f"🚨 席次變動: {self.last_vacancy} -> {available}")
            messagebox.showinfo("席次變動通知", f"產品 {TARGET_GROUP_ID} 席次發生變化！\n原本: {self.last_vacancy}\n現在: {available}")
        
        self.last_vacancy = available

    def monitor_loop(self):
        while self.is_monitoring:
            self.fetch_data()
            # 監控週期: 600 秒 (10 分鐘)
            count = 0
            while count < 600 and self.is_monitoring:
                time.sleep(1)
                count += 1

if __name__ == "__main__":
    root = tk.Tk()
    app = LionMonitorApp(root)
    root.mainloop()
