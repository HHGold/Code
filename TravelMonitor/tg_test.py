import os
import time
import requests
import traceback

# 請確保環境變數已設定，或者直接在這裡填寫
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "8787539119:AAG1MtwWqpyKAbytjMqbOzXLtqVfQ0LFSYg")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "1044095870")

def test_telegram_connection():
    print(f"--- Telegram 連線測試開始 ---")
    print(f"Token: {TELEGRAM_TOKEN[:10]}...{TELEGRAM_TOKEN[-5:]}")
    print(f"Chat ID: {TELEGRAM_CHAT_ID}")
    print("-" * 30)

    # 1. 測試 getMe (基本連線驗證)
    print("1. 測試 getMe (基本驗證)... ", end="", flush=True)
    start_time = time.time()
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getMe"
        r = requests.get(url, timeout=10)
        elapsed = time.time() - start_time
        if r.status_code == 200:
            data = r.json()
            print(f"成功! (耗時: {elapsed:.2f}s)")
            print(f"   Bot 名稱: @{data.get('result', {}).get('username')}")
        else:
            print(f"失敗! 狀態碼: {r.status_code}, 內容: {r.text}")
    except Exception as e:
        print(f"出錯! {e}")

    # 2. 測試 sendMessage (發送訊息驗證)
    print("\n2. 測試 sendMessage (發送訊息)... ", end="", flush=True)
    start_time = time.time()
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": "🛠️ 這是來自電腦端的 Telegram 連線自動測試訊息。"
        }
        r = requests.post(url, json=payload, timeout=30)
        elapsed = time.time() - start_time
        if r.status_code == 200:
            print(f"成功! (耗時: {elapsed:.2f}s)")
        else:
            print(f"失敗! 狀態碼: {r.status_code}, 內容: {r.text}")
    except requests.exceptions.Timeout:
        print(f"逾時! (超過 30 秒)")
    except Exception as e:
        print(f"出錯! {e}")
        traceback.print_exc()

    print("\n" + "-" * 30)
    print("測試結束")

if __name__ == "__main__":
    if not TELEGRAM_TOKEN:
        print("錯誤: 未偵測到 TELEGRAM_TOKEN")
    else:
        test_telegram_connection()
