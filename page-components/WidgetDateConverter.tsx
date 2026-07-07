import React, { useState, useEffect } from 'react';
import NepaliDate from 'nepali-date-converter';
import { ArrowRightLeft } from 'lucide-react';

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

const DAYS_NE = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];

export default function WidgetDateConverter() {
  const [conversionType, setConversionType] = useState<'BS_TO_AD' | 'AD_TO_BS'>('BS_TO_AD');
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
  
  // BS Inputs
  const [bsYear, setBsYear] = useState<number>(2083);
  const [bsMonth, setBsMonth] = useState<number>(2); // 0-indexed (Ashadh)
  const [bsDay, setBsDay] = useState<number>(7);

  // AD Inputs
  const [adYear, setAdYear] = useState<number>(new Date().getFullYear());
  const [adMonth, setAdMonth] = useState<number>(new Date().getMonth());
  const [adDay, setAdDay] = useState<number>(new Date().getDate());

  const [result, setResult] = useState<{
    main: string;
    sub: string;
  } | null>(null);

  const toNepaliStr = (num: number): string => {
    const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
  };

  const handleConvert = () => {
    try {
      if (conversionType === 'BS_TO_AD') {
        const npDate = new NepaliDate(bsYear, bsMonth, bsDay);
        const adDate = npDate.toJsDate();
        
        const adFormatted = adDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        setResult({
          main: adFormatted,
          sub: `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, '0')}-${String(adDate.getDate()).padStart(2, '0')}`
        });
      } else {
        const adDate = new Date(adYear, adMonth, adDay);
        const npDate = new NepaliDate(adDate);
        
        const nepDay = toNepaliStr(npDate.getDate());
        const nepYear = toNepaliStr(npDate.getYear());
        const nepMonthName = NEPALI_MONTHS_NE[npDate.getMonth()];
        const nepWeekdayName = DAYS_NE[adDate.getDay()];

        setResult({
          main: `${nepWeekdayName}, ${nepDay} ${nepMonthName} ${nepYear}`,
          sub: `${NEPALI_MONTHS_EN[npDate.getMonth()]} ${npDate.getDate()}, ${npDate.getYear()}`
        });
      }
    } catch (err: any) {
      setResult({
        main: 'Invalid Date Configuration',
        sub: err.message || 'Please verify the entered inputs.'
      });
    }
  };

  const getDaysInBsMonth = (y: number, m: number) => {
    try {
      const test = new NepaliDate(y, m, 1);
      let maxDays = 29;
      for (let d = 29; d <= 32; d++) {
        try {
          test.setDate(d);
          if (test.getMonth() === m) maxDays = d;
        } catch (_) { break; }
      }
      return maxDays;
    } catch (_) { return 30; }
  };

  return (
    <div className={`w-full min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-center select-none ${isSmall ? 'p-0.5' : 'p-3'}`}>
      <div className={`w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md bg-white dark:bg-slate-950 ${isSmall ? 'max-w-[218px]' : 'max-w-[340px]'}`}>
        
        {/* Header */}
        <div className={`bg-[#9c3e1b] text-white flex items-center justify-between border-b border-black/10 ${isSmall ? 'py-1.5 px-2.5' : 'py-2.5 px-4'}`}>
          <div className="flex items-center gap-1 shrink-0">
            <img 
              src="https://www.bishalcodes.com/logo.png" 
              alt="Bishal Codes" 
              className={isSmall ? "h-3.5 w-auto" : "h-5 w-auto"} 
            />
          </div>
          <span className={`font-bold uppercase tracking-wider ${isSmall ? 'text-[9px]' : 'text-xs'}`}>Date Converter</span>
        </div>

        {/* Form Body */}
        <div className={isSmall ? 'p-2.5 space-y-2.5' : 'p-4 space-y-3.5'}>
          {/* Conversion Mode Selection */}
          <div className="space-y-1 text-left">
            <label className={`text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>Conversion Type</label>
            <select
              value={conversionType}
              onChange={(e) => {
                setConversionType(e.target.value as 'BS_TO_AD' | 'AD_TO_BS');
                setResult(null);
              }}
              className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] transition-colors ${isSmall ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs'}`}
            >
              <option value="BS_TO_AD">Bikram Sambat (BS) to AD</option>
              <option value="AD_TO_BS">Gregorian (AD) to BS</option>
            </select>
          </div>

          {/* Dynamic Selectors */}
          {conversionType === 'BS_TO_AD' ? (
            <div className={`grid grid-cols-3 ${isSmall ? 'gap-1' : 'gap-2'}`}>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Year</span>
                <select
                  value={bsYear}
                  onChange={(e) => setBsYear(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {Array.from({ length: 96 }, (_, i) => 2000 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Month</span>
                <select
                  value={bsMonth}
                  onChange={(e) => setBsMonth(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {NEPALI_MONTHS_EN.map((name, i) => (
                    <option key={i} value={i}>{name.substring(0, 3)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Day</span>
                <select
                  value={bsDay}
                  onChange={(e) => setBsDay(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {Array.from({ length: getDaysInBsMonth(bsYear, bsMonth) }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-3 ${isSmall ? 'gap-1' : 'gap-2'}`}>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Year</span>
                <select
                  value={adYear}
                  onChange={(e) => setAdYear(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {Array.from({ length: 95 }, (_, i) => 1944 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Month</span>
                <select
                  value={adMonth}
                  onChange={(e) => setAdMonth(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {GREGORIAN_MONTHS_EN.map((name, i) => (
                    <option key={i} value={i}>{name.substring(0, 3)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-left">
                <span className={`text-slate-400 dark:text-slate-500 font-bold uppercase block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Day</span>
                <select
                  value={adDay}
                  onChange={(e) => setAdDay(Number(e.target.value))}
                  className={`w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b] ${isSmall ? 'px-1 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}
                >
                  {Array.from({ length: new Date(adYear, adMonth + 1, 0).getDate() }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleConvert}
            className={`w-full bg-[#9c3e1b] hover:bg-[#7d2f12] text-white font-bold rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${isSmall ? 'py-2 text-[10px]' : 'py-2.5 text-xs'}`}
          >
            <ArrowRightLeft size={isSmall ? 11 : 13} />
            <span>Convert Date</span>
          </button>

          {/* Result Block */}
          {result && (
            <div className={`bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg text-center space-y-1 animate-fadeIn ${isSmall ? 'p-2' : 'p-3'}`}>
              <span className={`text-[#9c3e1b] dark:text-[#ebd6cc] font-extrabold uppercase tracking-widest block ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}>Result</span>
              <div className={`font-bold text-slate-800 dark:text-white leading-tight ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
                {result.main}
              </div>
              <div className={`text-slate-400 dark:text-slate-500 font-medium ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>
                {result.sub}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center ${isSmall ? 'py-1.5 px-3' : 'py-2.5 px-4'}`}>
          <a 
            href="https://bishalcodes.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`font-bold text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition-colors ${isSmall ? 'text-[8px]' : 'text-[9px]'}`}
          >
            Source: bishalcodes.com
          </a>
        </div>

      </div>
    </div>
  );
}
