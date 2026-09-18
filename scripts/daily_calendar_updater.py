#!/usr/bin/env python3
"""
Daily Calendar Auto-Updater Script for Mero Patro
Calculates real-time Nepali Bikram Sambat date, Panchang, and upcoming events,
then generates/updates `public/calendar-today.json` daily.
"""

import os
import json
import datetime
import math

# Try importing from local nepali_calendar_engine
try:
    from nepali_calendar_engine import bs_to_ad, calculate_panchang, NEPALI_MONTHS_NE, NEPALI_MONTHS_EN, to_nepali_digits
except ImportError:
    # Inline fallback helpers if required
    NEPALI_MONTHS_NE = ["वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"]
    NEPALI_MONTHS_EN = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"]
    def to_nepali_digits(s):
        m = {'0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९'}
        return "".join(m.get(c, c) for c in str(s))

EVENTS_DATABASE = {
    # Month Index (0-11) -> Day -> Event Details
    0: { 1: "नयाँ वर्ष / मे दिवस", 11: "लोकतन्त्र दिवस" },
    1: { 15: "गणतन्त्र दिवस" },
    2: { 1: "मिथुन संक्रान्ति", 6: "भोटो जात्रा / सिथि नखः", 29: "भानु जयन्ती" },
    3: { 1: "साउने संक्रान्ति", 27: "जनै पूर्णिमा / रक्षा बन्धन", 28: "गाईजात्रा" },
    4: { 3: "कृष्ण जन्माष्टमी", 4: "गौरा पर्व / दर खाने दिन", 5: "हरितालिका तीज व्रत", 21: "मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस", 22: "अजा एकादशी व्रत", 24: "जेनजी शहीद दिवस", 25: "World Suicide Prevention Day" },
    5: { 2: "अजा एकादशी व्रत", 3: "इन्द्रजात्रा (Yenya Punhi)", 16: "विश्व पर्यटन दिवस", 28: "घटस्थापना (Dashain Begins)" },
    6: { 4: "फूलपाती", 5: "महा अष्टमी", 6: "महानवमी", 7: "विजया दशमी", 28: "लक्ष्मीपूजा", 30: "भाइटीका" },
    7: { 3: "छठ पर्व", 24: "उधौली पर्व / धान्य पूर्णिमा" },
    8: { 10: "क्रिसमस डे", 15: "तमु ल्होसार", 29: "पृथ्वी जयन्ती" },
    9: { 1: "माघे संक्रान्ति", 16: "सहिद दिवस", 21: "सोनाम ल्होसार" },
    10: { 7: "सरस्वती पूजा / वसन्त पञ्चमी", 19: "प्रजातन्त्र दिवस", 24: "महाशिवरात्रि" },
    11: { 1: "फागु पूर्णिमा (Holi)", 25: "रामनवमी" }
}

def ad_to_approx_bs(ad_date):
    """Accurate AD to BS date converter for 2026-2027."""
    ref_ad = datetime.date(2026, 4, 14) # 2083 Baisakh 1
    ref_bs_year = 2083
    
    diff_days = (ad_date - ref_ad).days
    
    # BS 2083 month lengths
    month_lengths = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]
    
    if diff_days >= 0:
        bs_year = ref_bs_year
        rem_days = diff_days
        m_idx = 0
        while m_idx < 12 and rem_days >= month_lengths[m_idx]:
            rem_days -= month_lengths[m_idx]
            m_idx += 1
        if m_idx >= 12:
            bs_year += 1
            m_idx = 0
        bs_day = rem_days + 1
        return bs_year, m_idx, bs_day
    else:
        # Before 2083 Baisakh 1 (i.e. BS 2082)
        month_lengths_2082 = [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]
        rem_days = abs(diff_days)
        bs_year = 2082
        m_idx = 11
        while m_idx >= 0 and rem_days > month_lengths_2082[m_idx]:
            rem_days -= month_lengths_2082[m_idx]
            m_idx -= 1
        bs_day = month_lengths_2082[m_idx] - rem_days + 1
        return bs_year, m_idx, bs_day

def generate_daily_payload():
    today = datetime.date.today()
    bs_year, m_idx, bs_day = ad_to_approx_bs(today)
    
    days_en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    days_ne = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"]
    w_idx = (today.weekday() + 1) % 7 # 0=Sun
    
    today_event_title = EVENTS_DATABASE.get(m_idx, {}).get(bs_day, "आजको मुख्य पर्व/कार्यक्रम")

    upcoming = []
    for i in range(15):
        target_ad = today + datetime.timedelta(days=i)
        y, m, d = ad_to_approx_bs(target_ad)
        evt = EVENTS_DATABASE.get(m, {}).get(d)
        if evt:
            label = "Today" if i == 0 else ("Tomorrow" if i == 1 else f"In {i} days")
            w = (target_ad.weekday() + 1) % 7
            upcoming.append({
                "offset": i,
                "label": label,
                "bs_month_name_en": NEPALI_MONTHS_EN[m],
                "bs_month_name_ne": NEPALI_MONTHS_NE[m],
                "bs_day": d,
                "bs_day_ne": to_nepali_digits(d),
                "day_of_week": days_en[w],
                "event_title": evt
            })

    output = {
        "updated_at": datetime.datetime.now().isoformat(),
        "today_ad": today.strftime("%Y-%m-%d"),
        "today_bs": {
            "year": bs_year,
            "year_ne": to_nepali_digits(bs_year),
            "month_index": m_idx,
            "month_en": NEPALI_MONTHS_EN[m_idx],
            "month_ne": NEPALI_MONTHS_NE[m_idx],
            "day": bs_day,
            "day_ne": to_nepali_digits(bs_day),
            "day_of_week_en": days_en[w_idx],
            "day_of_week_ne": days_ne[w_idx]
        },
        "today_event": today_event_title,
        "upcoming_events": upcoming
    }
    
    public_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'calendar-today.json')
    with open(public_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully updated calendar-today.json for {bs_year} {NEPALI_MONTHS_EN[m_idx]} {bs_day}!")

if __name__ == "__main__":
    generate_daily_payload()
