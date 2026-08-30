import time
import requests

SUPABASE_URL = "https://knopoetvssfyxmvggqei.supabase.co"
SUPABASE_KEY = "sb_publishable_-lTSqONdT5KgK3D2d8102Q_8t9yXYbe"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

print("🚀 Supabase Anti-Pause Keep-Alive Daemon Started...")

def ping():
    try:
        url = f"{SUPABASE_URL}/rest/v1/"
        response = requests.get(url, headers=headers, timeout=10)
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pinging Supabase... Status Code: {response.status_code}")
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Ping failed: {e}")

if __name__ == "__main__":
    while True:
        ping()
        # Sleep 6 hours
        time.sleep(21600)
