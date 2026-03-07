# 使用官方 Playwright Python image（已內建 Chromium，支援 x86_64）
FROM mcr.microsoft.com/playwright/python:v1.49.1-noble

# 工作目錄
WORKDIR /app

# 安裝 Python 套件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製監控腳本
COPY monitor.py .

# 建立資料目錄（存放狀態 JSON）
RUN mkdir -p /data

# 以非 root 使用者執行（更安全）
RUN useradd -m -u 1000 monitor && chown -R monitor:monitor /app /data
USER monitor

# 啟動
CMD ["python", "-u", "monitor.py"]
