"""
旅遊席次監控器 - Docker 無頭版 v2
- 雄獅旅遊 + 可樂旅遊，席次變動時通知 Telegram
- 支援 Telegram 指令即時查詢
"""

import os
import re
import json
import time
import threading
import requests
import logging
from datetime import datetime  # 補回缺失的導入
from pathlib import Path
import traceback
import html
import socket  # 用於診斷 DNS

# ============================================================
# 從環境變數讀取設定
# ============================================================
TELEGRAM_TOKEN   = os.environ.get("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
# 每天固定在這幾個時間點執行（24 小時制）
SCHEDULE_HOURS = [10, 17]   # 早上 10:00 / 下午 17:00

# ── 雄獅旅遊 ──
LION_NORM_GROUP_ID   = os.environ.get("LION_NORM_GROUP_ID",   "5c25c87a-b6d7-4ecc-88b6-07a379bfcf6e")
LION_TARGET_GROUP_ID = os.environ.get("LION_TARGET_GROUP_ID", "26PI516CIA-T")
LION_DATE_START      = os.environ.get("LION_DATE_START",      "2026-05-01")
LION_DATE_END        = os.environ.get("LION_DATE_END",        "2026-05-31")
LION_API_URL         = "https://travel.liontravel.com/detail/groupcalendarjson"

# ── 可樂旅遊 ──
COLA_TOUR_CODE = os.environ.get("COLA_TOUR_CODE", "LAA061309BR6")
COLA_TOUR_DATE = os.environ.get("COLA_TOUR_DATE", "2026/06/13")
COLA_URL       = f"https://tour.colatour.com.tw/itinerary?TourCode={COLA_TOUR_CODE}&TourDate={COLA_TOUR_DATE}"

# 狀態存檔路徑
STATE_FILE = Path("/data/state.json")

log_buffer    = []                  # 儲存最近的日誌供 Telegram 查詢

class TelegramLogHandler(logging.Handler):
    """自定義 Handler：將日誌同步存入 log_buffer"""
    def emit(self, record):
        try:
            msg = self.format(record)
            timestamp = datetime.now().strftime("%H:%M:%S")
            log_buffer.append(f"[{timestamp}] {msg}")
            if len(log_buffer) > 20:
                log_buffer.pop(0)
        except Exception:
            pass

# 初始化日誌系統
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s", # 簡便格式，因為快取會自帶時間
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)
log.addHandler(TelegramLogHandler())

state_lock    = threading.Lock()
check_event   = threading.Event()   # 外部觸發立即查詢
current_state = {}                  # 最新席次快取

# ============================================================
# Telegram API
# ============================================================
def diagnose_network():
    """當 Telegram 連線失敗時，執行網路診斷"""
    log.info("--- 啟動網路診斷 ---")
    results = []
    
    # 1. 測試 DNS 解析
    host = "api.telegram.org"
    try:
        start = time.time()
        ip = socket.gethostbyname(host)
        results.append(f"✅ DNS 解析成功: {host} -> {ip} ({time.time()-start:.2f}s)")
    except Exception as e:
        results.append(f"❌ DNS 解析失敗: {host}, 錯誤: {e}")

    # 2. 測試外部網路 (Google)
    try:
        start = time.time()
        r = requests.get("https://www.google.com", timeout=10)
        results.append(f"✅ 外部網路測試 (Google): {r.status_code} ({time.time()-start:.2f}s)")
    except Exception as e:
        results.append(f"❌ 外部網路測試 (Google) 失敗: {e}")

    for msg in results:
        log.info(f"[診斷] {msg}")
    log.info("--- 診斷結束 ---")

def tg_request(method: str, **kwargs) -> dict | None:
    """呼叫 Telegram Bot API (加入重試機制)"""
    if not TELEGRAM_TOKEN:
        log.warning("未設定 TELEGRAM_TOKEN，略過 API 呼叫")
        return None
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/{method}"
    
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.post(url, timeout=30, **kwargs)
            if r.status_code == 200:
                return r.json()
            log.warning(f"Telegram API {method} 失敗 (嘗試 {attempt}): {r.status_code} {r.text[:200]}")
        except requests.exceptions.Timeout:
            log.error(f"Telegram 連線超時 (嘗試 {attempt}/{max_retries})")
            if attempt == max_retries:
                log.error("已達最大重試次數，啟動診斷...")
                diagnose_network()
            else:
                time.sleep(2) # 等待兩秒後重試
        except Exception as e:
            log.error(f"Telegram 連線錯誤 (嘗試 {attempt}): {e}")
            if attempt < max_retries: time.sleep(2)
            
    return None

def send_telegram(message: str, chat_id: str = None) -> bool:
    """發送訊息"""
    cid = chat_id or TELEGRAM_CHAT_ID
    if not cid:
        log.warning("未設定 TELEGRAM_CHAT_ID，訊息僅列印")
        return False
        
    # 如果訊息太長（Telegram 限制 4096 字），截斷它
    if len(message) > 4000:
        message = message[:4000] + "\n...(太長已截斷)"

    result = tg_request("sendMessage", data={
        "chat_id": cid,
        "text": message,
        "parse_mode": "HTML",
    })
    if result and result.get("ok"):
        return True
    return False

def report_error(context: str, err: Exception):
    """將錯誤詳細資訊發送到 Telegram"""
    tb = traceback.format_exc()
    # 必須跳脫 HTML，否則 <module> 等字元會導致 Telegram API 報錯 (Bad Request: can't parse entities)
    safe_err = html.escape(str(err))
    safe_tb = html.escape(tb[-1000:])
    
    msg = (
        f"❌ <b>系統發生錯誤</b>\n"
        f"📍 位置: {context}\n"
        f"⚠️ 類型: {type(err).__name__}\n"
        f"📝 訊息: {safe_err}\n\n"
        f"🔍 <b>堆疊追蹤:</b>\n"
        f"<code>{safe_tb}</code>"
    )
    log.error(f"[{context}] 錯誤發送至 Telegram: {err}")
    send_telegram(msg)

# ============================================================
# 狀態讀寫
# ============================================================
def load_state() -> dict:
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        log.warning(f"讀取狀態檔失敗: {e}")
    return {}

def save_state(state: dict):
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(
            json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except Exception as e:
        log.error(f"儲存狀態檔失敗: {e}")

# ============================================================
# 雄獅旅遊抓取
# ============================================================
def fetch_lion() -> dict | None:
    payload = {
        "NormGroupID": LION_NORM_GROUP_ID,
        "GoDateStart": LION_DATE_START,
        "GoDateEnd":   LION_DATE_END,
        "TourSource":  "Lion",
    }
    headers = {
        "Content-Type": "application/json",
        "Referer": (
            f"https://travel.liontravel.com/detail"
            f"?NormGroupID={LION_NORM_GROUP_ID}&GroupID={LION_TARGET_GROUP_ID}"
        ),
    }
    try:
        resp = requests.post(LION_API_URL, json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            item = next((x for x in data if x.get("ID") == LION_TARGET_GROUP_ID), None)
            if item:
                return {
                    "available": item.get("AvailableVacancy"),
                    "total":     item.get("TotalVacnacy"),
                    "status":    item.get("Status"),
                }
            log.warning(f"[雄獅] 找不到 {LION_TARGET_GROUP_ID}")
        else:
            log.error(f"[雄獅] HTTP {resp.status_code}")
    except Exception as e:
        log.error(f"[雄獅] 抓取錯誤: {e}")
    return None

# ============================================================
# 可樂旅遊抓取（Playwright）+ 重試 3 次
# ============================================================
def fetch_cola(max_retries: int = 3) -> dict | None:
    """\u62b9取可樂旅遊席次，失敗自動重試"""
    for attempt in range(1, max_retries + 1):
        log.info(f"[\u53ef\u6a02] \u7b2c {attempt}/{max_retries} \u6b21\u6293\u53d6...")
        result = _fetch_cola_once()
        if result is not None:
            return result
        if attempt < max_retries:
            wait = 15 * attempt   # \u6bcf\u6b21\u591a\u7b49\u4e00\u9ede：15s / 30s
            log.info(f"[\u53ef\u6a02] \u6293\u53d6\u5931\u6557，{wait} \u79d2\u5f8c\u91cd\u8a66...")
            time.sleep(wait)
    log.error("[\u53ef\u6a02] \u6700\u7d42\u5931\u6557，\u653e\u68c4")
    return None


def _fetch_cola_once() -> dict | None:
    """\u55ae\u6b21\u6293\u53d6，\u56de\u50b3 dict \u6216 None"""
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox", # Docker 必備
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-gpu",
                ]
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
                locale="zh-TW",
            )
            page = context.new_page()
            page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
            )
            try:
                page.goto(COLA_URL, wait_until="domcontentloaded", timeout=45000)
            except Exception:
                pass
            page.wait_for_timeout(4000)
            body_text = page.inner_text("body")
            browser.close()

        m_avail = re.search(r"\u53ef\u552e\s*\n?\s*(\d+)", body_text)
        m_total = re.search(r"\u5718\u4f4d\s*\n?\s*(\d+)", body_text)
        m_wait  = re.search(r"\u5019\u88dc\s*\n?\s*(\d+)", body_text)

        if m_avail:
            return {
                "available": int(m_avail.group(1)),
                "total":     int(m_total.group(1)) if m_total else None,
                "waitlist":  int(m_wait.group(1))  if m_wait  else None,
            }
        log.warning("[\u53ef\u6a02] \u7121\u6cd5\u89e3\u6790\u53ef\u552e\u5e2d\u6b21")
        return None

    except ImportError as e:
        log.error(f"[\u53ef\u6a02] playwright 未安裝或匯入錯誤: {e}")
        return None
    except Exception as e:
        log.error(f"[\u53ef\u6a02] \u6293\u53d6\u932f\u8aa4: {e}")
        return None

# ============================================================
# 主要查詢與比對邏輯
# ============================================================
def do_check(state: dict, silent: bool = False) -> dict:
    """
    執行一次完整查詢。
    silent=True 時只更新資料，不發定期報告（但變動仍會警報）。
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    report_lines = [f"🔍 <b>旅遊席次報告</b>\n🕐 {now_str}\n"]
    alerts = []

    # ── 雄獅 ──────────────────────────────────────
    log.info("[雄獅] 開始抓取...")
    lion = fetch_lion()

    if lion:
        avail  = lion["available"]
        total  = lion["total"]
        status = lion["status"]
        log.info(f"[雄獅] 可賣={avail} 總席={total} 狀態={status}")

        report_lines.append(
            f"🦁 <b>雄獅旅遊</b>\n"
            f"   產品: {LION_TARGET_GROUP_ID}\n"
            f"   可賣: <b>{avail}</b>  總席: {total}\n"
            f"   狀態: {status}"
        )

        prev = state.get("lion_available")
        if prev is not None and avail != prev:
            alerts.append(
                f"🚨 <b>[雄獅] 席次變動！</b>\n"
                f"產品: {LION_TARGET_GROUP_ID}\n"
                f"可賣: {prev} → <b>{avail}</b>\n"
                f"總席: {total}  狀態: {status}"
            )

        state["lion_available"] = avail
        state["lion_total"]     = total
        state["lion_status"]    = status
    else:
        report_lines.append("🦁 <b>雄獅旅遊</b>\n   ⚠️ 抓取失敗")

    # ── 可樂旅遊 ───────────────────────────────────
    log.info("[可樂] 開始抓取（Chromium 啟動中，約需 20 秒）...")
    cola = fetch_cola()

    if cola:
        c_avail    = cola["available"]
        c_total    = cola["total"]
        c_waitlist = cola["waitlist"]
        log.info(f"[可樂] 可售={c_avail} 團位={c_total} 候補={c_waitlist}")

        report_lines.append(
            f"\n🎡 <b>可樂旅遊</b>\n"
            f"   團號: {COLA_TOUR_CODE}  出發: {COLA_TOUR_DATE}\n"
            f"   可售: <b>{c_avail}</b>  團位: {c_total}  候補: {c_waitlist}"
        )

        prev = state.get("cola_available")
        if prev is not None and c_avail != prev:
            alerts.append(
                f"🚨 <b>[可樂] 可售席次變動！</b>\n"
                f"團號: {COLA_TOUR_CODE}\n"
                f"出發: {COLA_TOUR_DATE}\n"
                f"可售: {prev} → <b>{c_avail}</b>\n"
                f"團位: {c_total}  候補: {c_waitlist}"
            )

        state["cola_available"] = c_avail
        state["cola_total"]     = c_total
        state["cola_waitlist"]  = c_waitlist
    else:
        report_lines.append("\n🎡 <b>可樂旅遊</b>\n   ⚠️ 抓取失敗")

    # ── 發送警報（優先，席次有變動）──────────────
    for alert in alerts:
        send_telegram(alert)
        time.sleep(1)

    # ── 發送定期報告 ──────────────────────────────
    if not silent:
        nxt = next_trigger_time()
        report_lines.append(f"\n⏰ 下次自動查詢：{nxt.strftime('%m/%d (%a) %H:%M')}")
        send_telegram("\n".join(report_lines))

    state["last_check"] = now_str
    return state

# ============================================================
# 建立狀態摘要文字（給 /status 指令用）
# ============================================================
def build_status_text(state: dict) -> str:
    last = state.get("last_check", "尚未查詢")
    lines = [f"📊 <b>目前快取狀態</b>\n🕐 最後查詢: {last}\n"]

    # 雄獅
    if "lion_available" in state:
        lines.append(
            f"🦁 <b>雄獅旅遊</b>\n"
            f"   產品: {LION_TARGET_GROUP_ID}\n"
            f"   可賣: <b>{state['lion_available']}</b>  "
            f"總席: {state.get('lion_total', '--')}\n"
            f"   狀態: {state.get('lion_status', '--')}"
        )
    else:
        lines.append("🦁 <b>雄獅旅遊</b>\n   （尚無資料）")

    # 可樂
    if "cola_available" in state:
        lines.append(
            f"\n🎡 <b>可樂旅遊</b>\n"
            f"   團號: {COLA_TOUR_CODE}  出發: {COLA_TOUR_DATE}\n"
            f"   可售: <b>{state['cola_available']}</b>  "
            f"團位: {state.get('cola_total', '--')}  "
            f"候補: {state.get('cola_waitlist', '--')}"
        )
    else:
        lines.append("\n🎡 <b>可樂旅遊</b>\n   （尚無資料）")

    return "\n".join(lines)

# ============================================================
# Telegram 指令監聽（Long Polling）
# ============================================================
HELP_TEXT = (
    "🤖 <b>旅遊席次監控指令</b>\n\n"
    "/check  或  <code>查旅遊</code>\n"
    "   → 立刻查詢一次席次\n\n"
    "/status  或  <code>狀態</code>\n"
    "   → 顯示雙旅遊目前席次\n\n"
    "/help  或  <code>說明</code>\n"
    "   → 顯示本說明"
)

def polling_loop():
    """持續監聽 Telegram 訊息，解析指令"""
    log.info("[Polling] Telegram 指令監聽已啟動")
    offset = None

    while True:
        try:
            params = {"timeout": 30, "allowed_updates": ["message"]}
            if offset:
                params["offset"] = offset

            result = tg_request("getUpdates", data=params)
            if not result or not result.get("ok"):
                time.sleep(5)
                continue

            updates = result.get("result", [])
            for update in updates:
                offset = update["update_id"] + 1
                msg = update.get("message", {})
                chat_id = str(msg.get("chat", {}).get("id", ""))
                text    = msg.get("text", "").strip()

                if not text:
                    continue

                log.info(f"[Polling] 收到訊息 from {chat_id}: {text!r}")

                # 只回應授權的 chat_id（避免陌生人控制）
                if chat_id != TELEGRAM_CHAT_ID:
                    send_telegram("⛔ 未授權的使用者", chat_id=chat_id)
                    continue

                # ── 指令判斷 ──────────────────────────
                lower = text.lower()
                if lower in ("/check", "查旅遊", "查詢"):
                    send_telegram("🔄 收到！馬上幫你查，稍等約 30 秒...", chat_id=chat_id)
                    # 在新執行緒執行查詢（避免阻塞 polling）
                    threading.Thread(
                        target=_manual_check, args=(chat_id,), daemon=True
                    ).start()

                elif lower in ("/status", "狀態", "目前狀態"):
                    with state_lock:
                        text_out = build_status_text(current_state)
                    send_telegram(text_out, chat_id=chat_id)

                elif lower in ("/logs", "看日誌", "日誌"):
                    # 將日誌合併並透過 html.escape 處理，避免 < > 符號讓 Telegram API 報錯
                    raw_text = "\n".join(log_buffer)
                    clean_text = html.escape(raw_text)
                    
                    if len(clean_text) > 3500:
                        clean_text = "..." + clean_text[-3500:] # 只取最後 3500 字
                        
                    header = "📜 <b>最近運行日誌</b>\n\n"
                    send_telegram(header + f"<code>{clean_text}</code>", chat_id=chat_id)

                elif lower in ("/help", "說明", "help"):
                    send_telegram(HELP_TEXT, chat_id=chat_id)

                else:
                    send_telegram(
                        f"❓ 不認識的指令，輸入 /help 查看說明",
                        chat_id=chat_id
                    )

        except Exception as e:
            log.error(f"[Polling] 錯誤: {e}")
            time.sleep(10)

def _manual_check(chat_id: str):
    """在背景執行即時查詢，兩個旅遊都完成後才一起回報"""
    global current_state
    try:
        # ── 雄獅：API 快速，先查 ──────────────────────
        log.info("[手動查詢] 抓取雄獅...")
        lion = fetch_lion()

        # ── 可樂：含重試，耐心等 ──────────────────────
        log.info("[手動查詢] 抓取可樂（含重試，請稍候）...")
        # 這裡會自動嘗試最多 3 次
        cola = fetch_cola(max_retries=3)

        # ── 兩個都完成，組合訊息一次發送 ─────────────
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        lines = [f"✅ <b>即時查詢完成</b>  🕐 {now_str}\n"]
        state_update = {}

        if lion:
            lines.append(
                f"🦁 <b>雄獅旅遊</b>\n"
                f"   可賣: <b>{lion['available']}</b>  "
                f"總席: {lion.get('total', '--')}\n"
                f"   狀態: {lion.get('status', '--')}"
            )
            state_update["lion_available"] = lion["available"]
            state_update["lion_total"]     = lion["total"]
            state_update["lion_status"]    = lion["status"]
        else:
            lines.append("🦁 <b>雄獅旅遊</b>\n   ⚠️ 抓取失敗")

        if cola:
            lines.append(
                f"\n🎡 <b>可樂旅遊</b>\n"
                f"   可售: <b>{cola['available']}</b>  "
                f"團位: {cola.get('total', '--')}  "
                f"候補: {cola.get('waitlist', '--')}"
            )
            state_update["cola_available"] = cola["available"]
            state_update["cola_total"]     = cola["total"]
            state_update["cola_waitlist"]  = cola["waitlist"]
        else:
            lines.append("\n🎡 <b>可樂旅遊</b>\n   ⚠️ 重試 3 次均失敗")

        send_telegram("\n".join(lines), chat_id=chat_id)

        # 更新全域狀態
        state_update["last_check"] = now_str
        with state_lock:
            current_state.update(state_update)
        save_state(current_state)

    except Exception as e:
        log.error(f"[手動查詢] 錯誤: {e}")
        send_telegram(f"⚠️ 查詢失敗: {e}", chat_id=chat_id)


# ============================================================
# 定時監控主迴圈（每天指定時間點執行）
# ============================================================
def next_trigger_time() -> datetime:
    """計算下一個觸發時間點（10:00 或 17:00）"""
    from datetime import timedelta
    now = datetime.now()
    today = now.date()

    candidates = []
    for h in SCHEDULE_HOURS:
        t = datetime(today.year, today.month, today.day, h, 0, 0)
        if t > now:
            candidates.append(t)

    if candidates:
        return min(candidates)
    else:
        # 今天的時間點都過了，取明天第一個
        tomorrow = today + timedelta(days=1)
        h = SCHEDULE_HOURS[0]
        return datetime(tomorrow.year, tomorrow.month, tomorrow.day, h, 0, 0)


def monitor_loop():
    """在每天 10:00 / 17:00 自動查詢"""
    global current_state

    while True:
        # 計算下次執行時間
        nxt = next_trigger_time()
        wait_sec = (nxt - datetime.now()).total_seconds()
        log.info(f"[監控] 下次查詢時間：{nxt.strftime('%m/%d %H:%M')}（{wait_sec/3600:.1f} 小時後）")

        # 休眠到指定時間
        time.sleep(max(0, wait_sec))

        try:
            with state_lock:
                state_copy = dict(current_state)

            result = do_check(state_copy, silent=False)

            with state_lock:
                current_state.update(result)
            save_state(current_state)

        except Exception as e:
            report_error("監控主迴圈 (monitor_loop)", e)
            time.sleep(60) # 發生錯誤先等一分鐘再重試，避免造成 Telegram 訊息轟炸

# ============================================================
# 程式進入點
# ============================================================
def main():
    global current_state

    times_str_log = " / ".join(f"{h:02d}:00" for h in SCHEDULE_HOURS)
    log.info("=" * 50)
    log.info("旅遊席次監控器 v2 啟動")
    log.info(f"排程時間: {times_str_log}")
    log.info(f"雄獅: {LION_TARGET_GROUP_ID}  ({LION_DATE_START}~{LION_DATE_END})")
    log.info(f"可樂: {COLA_TOUR_CODE}  {COLA_TOUR_DATE}")
    log.info("=" * 50)

    # 讀取上次狀態
    current_state = load_state()

    # 啟動通知
    times_str = " / ".join(f"{h:02d}:00" for h in SCHEDULE_HOURS)
    send_telegram(
        f"✅ <b>旅遊席次監控器已啟動</b>\n"
        f"🦁 雄獅: {LION_TARGET_GROUP_ID}\n"
        f"🎡 可樂: {COLA_TOUR_CODE} ({COLA_TOUR_DATE})\n"
        f"⏰ 每天自動查詢時間：{times_str}\n\n"
        f"📱 可直接輸入指令：\n"
        f"<code>查旅遊</code> — 立刻查詢\n"
        f"<code>狀態</code> — 目前席次\n"
        f"/help — 完整說明"
    )

    # 啟動 Telegram 指令監聽（背景執行緒）
    t_polling = threading.Thread(target=polling_loop, daemon=True)
    t_polling.start()

    # 啟動定時監控（主迴圈）
    monitor_loop()


if __name__ == "__main__":
    main()
