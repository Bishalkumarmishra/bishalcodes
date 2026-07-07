import React, { useState, useEffect } from 'react';
import NepaliDate from 'nepali-date-converter';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_MONTHS_NE = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const GREGORIAN_MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_NE_SHORT = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

const NE_MONTHS_EVENTS: Record<number, Record<number, { title: string; isHoliday: boolean }>> = {
  0: {
    1: { title: "नयाँ वर्ष / मे दिवस", isHoliday: true },
    11: { title: "लोकतन्त्र दिवस", isHoliday: true },
    30: { title: "मातातीर्थ औंसी", isHoliday: false }
  },
  1: {
    15: { title: "गणतन्त्र दिवस", isHoliday: true }
  },
  2: {
    1: { title: "अधिकमास समाप्ति / मिथुन संक्रान्ति / सोमबारे औंसी", isHoliday: false },
    2: { title: "अन्तर्राष्ट्रिय पारिवारिक रेमिट्यान्स दिवस", isHoliday: false },
    3: { title: "विश्व खडेरी विरुद्ध संघर्ष दिवस", isHoliday: false },
    5: { title: "द्वन्द्वमा यौन हिंसा उन्मूलनको लागि अन्तर्राष्ट्रिय दिवस", isHoliday: false },
    6: { title: "भोटो जात्रा / सिथि नखः / कुमारषष्ठी", isHoliday: true },
    7: { title: "रवी सप्तमी व्रत / अन्तर्राष्ट्रिय बुबा दिवस / विश्व योग दिवस / संगीत दिवस", isHoliday: false },
    8: { title: "गोरखकाली पूजा / वायु अष्टमी", isHoliday: false },
    9: { title: "अन्तर्राष्ट्रिय एकल महिला दिवस", isHoliday: false },
    11: { title: "निर्जला एकादशी व्रत / तुलसीको दल राख्ने दिन / भूमी पूजा", isHoliday: false },
    12: { title: "अन्तर्राष्ट्रिय लागू पदार्थ तथा अवैध तस्करी विरुद्ध दिवस", isHoliday: false },
    13: { title: "शाने प्रदोष व्रत", isHoliday: false },
    15: { title: "दही चिउरा खाने दिन / राष्ट्रिय धान दिवस / ज्या पुन्हि / कवीर जयन्ती", isHoliday: false },
    18: { title: "विश्व खेलकुद पत्रकार दिवस", isHoliday: false },
    20: { title: "अन्तर्राष्ट्रिय सहकारी दिवस", isHoliday: false },
    23: { title: "गोरखकाली पूजा", isHoliday: false },
    24: { title: "बुधाष्टमी व्रत", isHoliday: false },
    26: { title: "योगिनी एकादशी व्रत (स्मार्तहरूको)", isHoliday: false },
    27: { title: "योगिनी एकादशी व्रत (वैष्णवहरूको) / विश्व जनसंख्या दिवस", isHoliday: false },
    28: { title: "प्रदोष व्रत", isHoliday: false },
    29: { title: "भानु जयन्ती", isHoliday: false },
    31: { title: "विश्व युवा दक्षता दिवस", isHoliday: false }
  },
  3: {
    1: { title: "साउने संक्रान्ति / कर्कट संक्रान्ति / लुतो फाल्ने दिन", isHoliday: false },
    15: { title: "खीर खाने दिन", isHoliday: false },
    27: { title: "जनै पूर्णिमा / रक्षा बन्धन", isHoliday: true },
    28: { title: "गाईजात्रा", isHoliday: true }
  },
  4: {
    3: { title: "कृष्ण जन्माष्टमी", isHoliday: true },
    4: { title: "गौरा पर्व / दर खाने दिन", isHoliday: true },
    5: { title: "हरितालिका तीज व्रत", isHoliday: true },
    6: { title: "गणेश चतुर्थी / हरितालिका तीज चतुर्थी", isHoliday: false },
    7: { title: "ऋषि पञ्चमी", isHoliday: false }
  },
  5: {
    3: { title: "इन्द्रजात्रा (Valley Holiday)", isHoliday: true },
    16: { title: "विश्व पर्यटन दिवस", isHoliday: false },
    28: { title: "घटस्थापना (Dashain Begins)", isHoliday: true }
  },
  6: {
    4: { title: "फूलपाती (Maha Saptami)", isHoliday: true },
    5: { title: "महा अष्टमी (Maha Ashtami)", isHoliday: true },
    6: { title: "महानवमी (Maha Navami)", isHoliday: true },
    7: { title: "विजया दशमी (Bijaya Dashami)", isHoliday: true },
    8: { title: "एकादशी", isHoliday: true },
    9: { title: "द्वादशी", isHoliday: true },
    11: { title: "कोजाग्रत पूर्णिमा (Dashain Ends)", isHoliday: true },
    27: { title: "कागतिहार", isHoliday: false },
    28: { title: "कुकुरतिहार / लक्ष्मीपूजा", isHoliday: true },
    29: { title: "गाईपूजा / गोवर्धन पूजा / म्हपूजा", isHoliday: true },
    30: { title: "भाइटीका (Tihar Diwas)", isHoliday: true }
  },
  7: {
    3: { title: "छठ पर्व (Chhath Parva)", isHoliday: true },
    24: { title: "उधौली पर्व / धान्य पूर्णिमा / योमरी पुन्ही", isHoliday: true }
  },
  8: {
    10: { title: "क्रिसमस डे (Christmas Day)", isHoliday: true },
    15: { title: "तमु ल्होसार", isHoliday: true },
    29: { title: "पृथ्वी जयन्ती / राष्ट्रिय एकता दिवस", isHoliday: false }
  },
  9: {
    1: { title: "माघे संक्रान्ति / मकर संक्रान्ति", isHoliday: true },
    16: { title: "सहिद दिवस (Martyr's Day)", isHoliday: false },
    21: { title: "सोनाम ल्होसार", isHoliday: true }
  },
  10: {
    7: { title: "श्रीपञ्चमी / सरस्वती पूजा / प्रजातन्त्र दिवस", isHoliday: true },
    26: { title: "महाशिवरात्रि (Maha Shivaratri)", isHoliday: true },
    27: { title: "ग्याल्पो ल्होसार", isHoliday: true }
  },
  11: {
    8: { title: "अन्तर्राष्ट्रिय नारी दिवस", isHoliday: false },
    22: { title: "फागु पूर्णिमा - पहाडी जिल्ला (Holi)", isHoliday: true },
    23: { title: "फागु पूर्णिमा - तराई जिल्ला (Holi)", isHoliday: true },
    15: { title: "घोडेजात्रा (Valley Holiday)", isHoliday: true },
    24: { title: "चैते दशमी", isHoliday: false },
    25: { title: "रामनवमी", isHoliday: true }
  }
};

export default function WidgetCalendar() {
  const [calYear, setCalYear] = useState<number>(2083);
  const [calMonth, setCalMonth] = useState<number>(2); // 0-indexed (Ashadh)
  const [isSmall, setIsSmall] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkSize = () => {
        setIsSmall(window.innerWidth < 265);
      };
      checkSize();
      window.addEventListener('resize', checkSize);
      return () => window.removeEventListener('resize', checkSize);
    }
  }, []);

  const toNepaliStr = (num: number): string => {
    const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
  };

  const getDaysInMonth = (year: number, monthIndex: number): number => {
    try {
      const test = new NepaliDate(year, monthIndex, 1);
      let maxDays = 29;
      for (let d = 29; d <= 32; d++) {
        try {
          test.setDate(d);
          if (test.getMonth() === monthIndex) {
            maxDays = d;
          }
        } catch (_) { break; }
      }
      return maxDays;
    } catch (_) { return 30; }
  };

  const getFirstDayOfWeek = (year: number, monthIndex: number): number => {
    try {
      const testNp = new NepaliDate(year, monthIndex, 1);
      return testNp.toJsDate().getDay();
    } catch (_) { return 0; }
  };

  const shiftCalMonth = (direction: 'PREV' | 'NEXT') => {
    if (direction === 'PREV') {
      if (calMonth === 0) {
        setCalMonth(11);
        setCalYear(prev => prev - 1);
      } else {
        setCalMonth(prev => prev - 1);
      }
    } else {
      if (calMonth === 11) {
        setCalMonth(0);
        setCalYear(prev => prev + 1);
      } else {
        setCalMonth(prev => prev + 1);
      }
    }
  };

  const getSecondaryDay = (day: number) => {
    try {
      const npDate = new NepaliDate(calYear, calMonth, day);
      return npDate.toJsDate().getDate().toString();
    } catch (_) { return ''; }
  };

  const generateCalendarCells = () => {
    const daysCount = getDaysInMonth(calYear, calMonth);
    const startWeekday = getFirstDayOfWeek(calYear, calMonth);
    const cells = [];
    
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysCount; d++) {
      cells.push(d);
    }
    return cells;
  };

  const cells = generateCalendarCells();
  const activeMonthEvents = NE_MONTHS_EVENTS[calMonth] || {};

  return (
    <div className={`w-full min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center select-none ${isSmall ? 'p-0.5' : 'p-3'}`}>
      <div className={`w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-950 flex flex-col justify-between ${isSmall ? 'max-w-[218px]' : 'max-w-[340px]'}`}>
        
        {/* Navigation / Brand Header */}
        <div className={`bg-[#9c3e1b] text-white flex items-center justify-between border-b border-black/10 ${isSmall ? 'py-1.5 px-2' : 'py-2.5 px-3.5'}`}>
          {/* Brand Logo */}
          <div className="flex items-center gap-1 shrink-0">
            <img 
              src="https://www.bishalcodes.com/logo.png" 
              alt="Bishal Codes" 
              className={isSmall ? "h-3.5 w-auto" : "h-5 w-auto"} 
            />
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => shiftCalMonth('PREV')} 
              className="p-1 rounded hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft size={isSmall ? 11 : 14} />
            </button>
            <span className={`font-bold uppercase tracking-wider ${isSmall ? 'text-[9px]' : 'text-xs'}`}>
              {NEPALI_MONTHS_NE[calMonth]} {toNepaliStr(calYear)}
            </span>
            <button 
              onClick={() => shiftCalMonth('NEXT')} 
              className="p-1 rounded hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight size={isSmall ? 11 : 14} />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className={`grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/10 ${isSmall ? 'text-[8px] py-1' : 'text-[10px] py-2'}`}>
          {DAYS_NE_SHORT.map((day, i) => (
            <div key={i} className={i === 6 ? 'text-rose-500' : ''}>{day}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 border-collapse">
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square border-r border-b border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5" />;
            }

            const isSaturday = index % 7 === 6;
            const event = activeMonthEvents[day] || null;
            const isHoliday = event?.isHoliday || isSaturday;
            const secDay = getSecondaryDay(day);

            const todayNp = new NepaliDate();
            const isToday = todayNp.getYear() === calYear && todayNp.getMonth() === calMonth && todayNp.getDate() === day;

            return (
              <div
                key={index}
                title={event ? event.title : undefined}
                className={`aspect-square border-r border-b border-slate-100 dark:border-slate-900 font-semibold flex flex-col items-center justify-between transition-all relative ${
                  isToday
                    ? 'bg-[#9c3e1b] text-white shadow-inner scale-100 z-10 rounded-md'
                    : isHoliday 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                } ${isSmall ? 'p-0.5' : 'p-1.5'}`}
              >
                {/* BS day */}
                <span className={`font-bold mt-0.5 self-start ml-0.5 ${isSmall ? 'text-[9px]' : 'text-[11px] sm:text-xs'} ${isToday ? 'text-white' : ''}`}>
                  {toNepaliStr(day)}
                </span>
                
                {/* AD day (secondary) */}
                <span className={`absolute font-bold ${isToday ? 'text-white/80' : 'text-slate-450 dark:text-slate-500'} ${isSmall ? 'top-0.5 right-0.5 text-[6.5px]' : 'top-1 right-1.5 text-[8px]'}`}>
                  {secDay}
                </span>

                {/* Event Name or Dot */}
                {event ? (
                  isSmall ? (
                    <span className={`w-1 h-1 rounded-full mb-0.5 ${
                      isToday ? 'bg-white' : (event.isHoliday ? 'bg-rose-500' : 'bg-amber-500')
                    }`} />
                  ) : (
                    <span className={`text-[7px] leading-tight font-bold truncate max-w-[96%] mb-0.5 text-center ${
                      isToday ? 'text-white' : (event.isHoliday ? 'text-rose-500 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500')
                    }`}>
                      {event.title.split('/')[0].trim()}
                    </span>
                  )
                ) : (
                  !isSmall && <span className="h-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Month Footer Holidays List */}
        <div className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 text-left ${isSmall ? 'p-2' : 'p-3'}`}>
          <h5 className={`font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${isSmall ? 'text-[8px] mb-1' : 'text-[9px] mb-2'}`}>
            Holidays in {NEPALI_MONTHS_EN[calMonth]}
          </h5>
          <div className={`overflow-y-auto space-y-1 pr-1 custom-scrollbar ${isSmall ? 'max-h-[50px] text-[8px]' : 'max-h-[90px] text-[10px]'}`}>
            {Object.keys(activeMonthEvents).length === 0 ? (
              <p className="text-slate-400 italic text-[9px]">No holidays this month.</p>
            ) : (
              Object.entries(activeMonthEvents).map(([d, ev]) => (
                <div key={d} className="flex items-start gap-1 py-0.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <span className={`px-1 rounded font-bold shrink-0 ${isSmall ? 'text-[7px]' : 'text-[8px]'} ${
                    ev.isHoliday 
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {d} गते
                  </span>
                  <span className="text-slate-650 dark:text-slate-400 font-medium truncate">
                    {ev.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info branding */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-3 text-center">
          <a 
            href="https://bishalcodes.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[9px] font-bold text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition-colors"
          >
            bishalcodes.com
          </a>
        </div>

      </div>
    </div>
  );
}
