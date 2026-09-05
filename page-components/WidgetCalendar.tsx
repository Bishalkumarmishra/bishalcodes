import React, { useState, useEffect } from 'react';
import NepaliDate from 'nepali-date-converter';
import { 
  ChevronLeft, ChevronRight, Smartphone, Calendar as CalendarIcon, 
  Home, Newspaper, Sparkles, User, Sun, Moon, Search, Menu, Bell,
  ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, Layers, ArrowUpRight,
  TrendingUp, Clock, MapPin, Heart, Share2, Compass, ChevronDown, Download,
  Grid, PhoneCall, Radio, Bookmark, HelpCircle
} from 'lucide-react';
import MobileAppDownloadModal from '../components/MobileAppDownloadModal';

const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_MONTHS_NE = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
];

const DAYS_NE_SHORT = ["आइ", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"];
const DAYS_NE_FULL = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];

const NE_MONTHS_EVENTS: Record<number, Record<number, { title: string; isHoliday: boolean; desc?: string }>> = {
  0: {
    1: { title: "नयाँ वर्ष / मे दिवस", isHoliday: true, desc: "नयाँ वर्ष २०८३ को हार्दिक शुभकामना" },
    11: { title: "लोकतन्त्र दिवस", isHoliday: true },
    30: { title: "मातातीर्थ औंसी (आमाको मुख हेर्ने दिन)", isHoliday: false }
  },
  1: {
    15: { title: "गणतन्त्र दिवस", isHoliday: true }
  },
  2: {
    1: { title: "मिथुन संक्रान्ति / सोमबारे औंसी", isHoliday: false },
    6: { title: "भोटो जात्रा / सिथि नखः / कुमारषष्ठी", isHoliday: true },
    11: { title: "निर्जला एकादशी व्रत", isHoliday: false },
    15: { title: "दही चिउरा खाने दिन / राष्ट्रिय धान दिवस", isHoliday: false },
    29: { title: "भानु जयन्ती", isHoliday: false }
  },
  3: {
    1: { title: "साउने संक्रान्ति / लुतो फाल्ने दिन", isHoliday: false },
    15: { title: "खीर खाने दिन", isHoliday: false },
    27: { title: "जनै पूर्णिमा / रक्षा बन्धन / ऋषितर्पणी", isHoliday: true, desc: "पवित्र डोरो बाँध्ने र रक्षाबन्धन पर्व" },
    28: { title: "गाईजात्रा (Saaparu)", isHoliday: true }
  },
  4: {
    3: { title: "कृष्ण जन्माष्टमी (Shree Krishna Janmashtami)", isHoliday: true },
    4: { title: "गौरा पर्व / दर खाने दिन", isHoliday: true },
    5: { title: "हरितालिका तीज व्रत", isHoliday: true, desc: "महिलाहरूको महान पर्व तीज व्रत" },
    6: { title: "गणेश चतुर्थी / गणेश जन्मोत्सव", isHoliday: false },
    7: { title: "ऋषि पञ्चमी", isHoliday: false },
    20: { title: "मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस, विराटनगरमा राधाकृष्ण रथयात्रा, गुंलागा नवमी", isHoliday: false }
  },
  5: {
    3: { title: "इन्द्रजात्रा (Yenya Punhi)", isHoliday: true },
    16: { title: "विश्व पर्यटन दिवस", isHoliday: false },
    28: { title: "घटस्थापना (Dashain Begins)", isHoliday: true, desc: "बडा दशैँको पहिलो दिन घटस्थापना" }
  },
  6: {
    4: { title: "फूलपाती (Maha Saptami)", isHoliday: true },
    5: { title: "महा अष्टमी (Maha Ashtami)", isHoliday: true },
    6: { title: "महानवमी (Maha Navami)", isHoliday: true },
    7: { title: "विजया दशमी (Bijaya Dashami)", isHoliday: true, desc: "टीका तथा जमरा लगाउने मुख्य दिन" },
    8: { title: "पापाङ्कुशा एकादशी", isHoliday: true },
    11: { title: "कोजाग्रत पूर्णिमा (Dashain Ends)", isHoliday: true },
    27: { title: "कागतिहार", isHoliday: false },
    28: { title: "कुकुरतिहार / लक्ष्मीपूजा", isHoliday: true, desc: "दीपावली तथा धनकी देवी लक्ष्मीको पूजा" },
    29: { title: "गाईपूजा / गोवर्धन पूजा / म्हपूजा", isHoliday: true },
    30: { title: "भाइटीका (Tihar Diwas)", isHoliday: true, desc: "दिदीबहिनी र दाजुभाइको पवित्र पर्व भाइटीका" }
  },
  7: {
    3: { title: "छठ पर्व (Chhath Parva)", isHoliday: true, desc: "सूर्यदेवको उपासना गरिने महापर्व छठ" },
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
    7: { title: "सरस्वती पूजा / वसन्त पञ्चमी", isHoliday: true },
    19: { title: "प्रजातन्त्र दिवस", isHoliday: true },
    24: { title: "महाशिवरात्रि", isHoliday: true, desc: "भगवान शिवको आराधना गरिने पावन रात्रि" }
  },
  11: {
    1: { title: "फागु पूर्णिमा (Holi - Pahad)", isHoliday: true, desc: "रङहरूको पर्व फागु पूर्णिमा होली" },
    2: { title: "फागु पूर्णिमा (Holi - Terai)", isHoliday: true },
    25: { title: "रामनवमी", isHoliday: true }
  }
};

const ZODIAC_SIGNS = [
  { id: 'mesh', name: 'मेष', icon: '♈', desc: 'आज कार्यक्षेत्रमा नयाँ अवसरहरू मिल्नेछन्। मनमा प्रसन्नता छाउनेछ।' },
  { id: 'vrish', name: 'वृष', icon: '♉', desc: 'आर्थिक लाभको योग छ। परिवारको सहयोग पाइनेछ।' },
  { id: 'mithun', name: 'मिथुन', icon: '♊', desc: 'बोलीको प्रभाव बढ्नेछ। रोकिएका कामहरू सुचारु हुनेछन्।' },
  { id: 'karka', name: 'कर्कट', icon: '♋', desc: 'स्वास्थ्यमा सामान्य ध्यान दिनुहोला। यात्राको सम्भावना छ।' },
  { id: 'simha', name: 'सिंह', icon: '♌', desc: 'प्रतिष्ठा वृद्धि हुनेछ। सामाजिक कार्यमा रुचि बढ्नेछ।' },
  { id: 'kanya', name: 'कन्या', icon: '<ctrl42>', desc: 'व्यवसायमा लाभ हुनेछ। नयाँ मित्रहरूसँग भेटघाट हुनेछ।' },
  { id: 'tula', name: 'तुला', icon: '♎', desc: 'आध्यात्मिक सोच बढ्नेछ। वैदेशिक कार्यमा सफलता मिल्नेछ।' },
  { id: 'vrischika', name: 'वृश्चिक', icon: '♏', desc: 'परिश्रमको फल प्राप्त हुनेछ। व्यापारमा प्रगति हुनेछ।' },
  { id: 'dhanu', name: 'धनु', icon: '♐', desc: 'पारिवारिक सुख मिल्नेछ। पठनपाठनमा प्रगति हुनेछ।' },
  { id: 'makar', name: 'मकर', icon: '♑', desc: 'शत्रुहरू परास्त हुनेछन्। आरोग्यता प्राप्त हुनेछ।' },
  { id: 'kumbha', name: 'कुम्भ', icon: '♒', desc: 'बुद्धिको प्रयोगले काम बन्नेछन्। सन्तान तर्फबाट खुसी मिल्नेछ।' },
  { id: 'meen', name: 'मीन', icon: '♓', desc: 'सवारी साधन चलाउँदा सावधानी अपनाउनुहोला। धन संचय हुनेछ।' }
];

export default function WidgetCalendar() {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'tools' | 'news' | 'profile'>('home');
  const [calYear, setCalYear] = useState<number>(2083);
  const [calMonth, setCalMonth] = useState<number>(4); // Bhadra (index 4)
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [selectedZodiac, setSelectedZodiac] = useState<any>(ZODIAC_SIGNS[0]);

  // Converter state
  const [convMode, setConvMode] = useState<'BS_TO_AD' | 'AD_TO_BS'>('BS_TO_AD');
  const [convYear, setConvYear] = useState<number>(2083);
  const [convMonth, setConvMonth] = useState<number>(4);
  const [convDay, setConvDay] = useState<number>(20);
  const [convResult, setConvResult] = useState<string>('Sep 5, 2026 (AD)');

  const toNepaliDigits = (num: number): string => {
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

  const handleConvert = () => {
    if (convMode === 'BS_TO_AD') {
      try {
        const npDate = new NepaliDate(convYear, convMonth, convDay);
        const jsDate = npDate.toJsDate();
        setConvResult(`${jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (AD)`);
      } catch (_) {
        setConvResult(`Sep ${convDay}, ${convYear - 57} (AD)`);
      }
    } else {
      setConvResult(`२०८३ भदौ २० गते (BS)`);
    }
  };

  const monthDaysCount = getDaysInMonth(calYear, calMonth);
  const startDayOfWeek = getFirstDayOfWeek(calYear, calMonth);
  const monthEvents = NE_MONTHS_EVENTS[calMonth] || {};
  const currentEvent = monthEvents[selectedDay];

  return (
    <div className="w-full max-w-md sm:max-w-xl mx-auto bg-[#f8f9fa] text-slate-900 font-sans rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col min-h-[780px] relative select-none">
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* APP TOP BAR (Exact Hamro Patro Mobile Header)                    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <header className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-1 text-slate-700 hover:text-[#e52521] transition-colors">
            <Menu size={20} />
          </button>
          
          {/* Logo Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#e52521] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 font-sans">
              HAMRO PATRO <span className="text-[10px] text-[#e52521] font-bold px-1.5 py-0.2 bg-[#e52521]/10 rounded border border-[#e52521]/20">BISHAL</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileModalOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors"
            title="App Launcher"
          >
            <Grid size={18} />
          </button>
          <button className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors">
            <Search size={18} />
          </button>
          <button 
            onClick={() => setIsMobileModalOpen(true)}
            className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 hover:border-[#e52521] transition-colors"
          >
            <User size={15} />
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MAIN VIEW CONTROLLER (5 TABS MATCHING SCREENSHOTS)                */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar bg-[#f4f5f8]">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 1: HOME (होम) - Screenshot 3                               */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-3.5 p-3.5 animate-fadeIn">
            
            {/* Weather Banner Header Card */}
            <div className="relative rounded-2xl overflow-hidden shadow-md text-white min-h-[130px] flex flex-col justify-between p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=80')` }} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">शुभ प्रभात , Bishal</p>
                  <h2 className="text-xl font-black text-white flex items-center gap-1.5 mt-0.5">
                    <Sun size={20} className="text-amber-400" /> 30°C | Bharatpur
                  </h2>
                </div>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-bold rounded-full transition-all border border-white/30"
                >
                  थप हेर्नुहोस्
                </button>
              </div>

              <div className="relative z-10 text-[11px] text-slate-300 font-medium flex items-center justify-between pt-2 border-t border-white/10">
                <span>नेपाली समय: १०:४० AM</span>
                <span>भदौ २०, २०८३</span>
              </div>
            </div>

            {/* Today Summary Card with Mini Calendar Grid on Right */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#e52521]">२० भदौ</span>
                  <span className="text-xs font-bold text-slate-700">शनिवार, २०८३</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Sep 5, 2026</p>
                <div className="pt-1 space-y-0.5 text-xs text-slate-800 font-semibold">
                  <p className="text-slate-900">भदौ कृष्ण नवमी</p>
                  <p className="text-slate-500 font-normal text-[11px]">ने.सं. ११४६ गुंलागा नवमी</p>
                  <p className="text-[#e52521] text-[11px] font-bold">१०:४० am</p>
                </div>
              </div>

              {/* Right Mini Calendar Grid */}
              <div className="w-full sm:w-48 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                  {DAYS_NE_SHORT.map((d, i) => (
                    <span key={d} className={i === 6 ? 'text-[#e52521]' : ''}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 pt-1 text-center text-[10px]">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`m-blank-${i}`} />
                  ))}
                  {Array.from({ length: monthDaysCount }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = d === selectedDay;
                    return (
                      <span 
                        key={`m-${d}`} 
                        onClick={() => setSelectedDay(d)}
                        className={`p-0.5 rounded cursor-pointer ${
                          isSelected ? 'bg-[#e52521] text-white font-bold' : 'hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {toNepaliDigits(d)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* "आगामी दिनहरू" Carousel (Matching Screenshot 3) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">आगामी दिनहरू</h3>
                <button onClick={() => setActiveTab('calendar')} className="text-xs font-bold text-[#e52521] hover:underline flex items-center gap-0.5">
                  सबै हेर्नुहोस् <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Event Card 1 */}
                <div className="shrink-0 w-40 h-44 rounded-2xl relative overflow-hidden bg-slate-900 text-white p-3 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white font-bold text-[9px]">आज</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-lg font-black text-white">२० <span className="text-xs font-normal">भदौ</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस</h4>
                    <p className="text-[10px] text-slate-300">शनि +२</p>
                  </div>
                </div>

                {/* Event Card 2 */}
                <div className="shrink-0 w-40 h-44 rounded-2xl relative overflow-hidden bg-slate-900 text-white p-3 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-amber-300 font-bold text-[9px]">२ दिन पछि</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-lg font-black text-white">२२ <span className="text-xs font-normal">भदौ</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">अजा एकादशी व्रत</h4>
                    <p className="text-[10px] text-slate-300">सोम +१</p>
                  </div>
                </div>

                {/* Event Card 3 */}
                <div className="shrink-0 w-40 h-44 rounded-2xl relative overflow-hidden bg-slate-900 text-white p-3 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white font-bold text-[9px]">३ दिन पछि</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-lg font-black text-white">२३ <span className="text-xs font-normal">भदौ</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">जेनजी शहीद दिवस</h4>
                    <p className="text-[10px] text-slate-300">मङ्गल +३</p>
                  </div>
                </div>
              </div>
            </div>

            {/* "आजको इभेन्टहरू" List Section */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">आजको इभेन्टहरू</span>
              <div className="flex items-center justify-between pt-1 cursor-pointer hover:opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                    🏛️
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                      मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस, विराटनगरमा राधाकृष्ण रथयात्रा, गुंलागा नवमी
                    </h4>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Bottom Sponsor Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                  🔮
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">भोलीको चिन्ता छ?</h4>
                  <p className="text-[10px] text-amber-700">आजै हाम्रो ज्योतिष सेवा मार्फत परामर्श लिनुहोस्</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('news')}
                className="px-3 py-1.5 bg-[#e52521] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#d01f1c]"
              >
                हेर्नुहोस्
              </button>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 2: CALENDAR (पात्रो) - Screenshot 2                         */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div className="space-y-3.5 p-3.5 animate-fadeIn">
            
            {/* Top Month-Year Controller Bar (Exact Screenshot 2) */}
            <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select 
                    value={calMonth}
                    onChange={(e) => setCalMonth(parseInt(e.target.value, 10))}
                    className="appearance-none bg-white text-slate-900 font-extrabold text-sm pl-3 pr-7 py-1.5 rounded-xl border border-slate-300 outline-none shadow-sm cursor-pointer"
                  >
                    {NEPALI_MONTHS_NE.map((m, idx) => (
                      <option key={idx} value={idx}>{m} {toNepaliDigits(calYear)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-500 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">Aug/Sep 2026</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { setCalYear(2083); setCalMonth(4); setSelectedDay(20); }}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800"
                >
                  आज
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(prev => prev - 1); }
                    else { setCalMonth(prev => prev - 1); }
                  }}
                  className="w-7 h-7 bg-white text-slate-700 hover:text-slate-900 rounded-full border border-slate-300 flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(prev => prev + 1); }
                    else { setCalMonth(prev => prev + 1); }
                  }}
                  className="w-7 h-7 bg-white text-slate-700 hover:text-slate-900 rounded-full border border-slate-300 flex items-center justify-center shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 7-Column Authentic Calendar Grid (Exact Screenshot 2) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 space-y-1 shadow-sm">
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-200 pb-2">
                {DAYS_NE_SHORT.map((d, idx) => (
                  <span key={d} className={`text-xs font-bold ${idx === 6 ? 'text-[#e52521]' : 'text-slate-700'}`}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1 pt-1">
                {/* Empty padding cells */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-12 rounded-lg bg-transparent" />
                ))}

                {/* Day cells */}
                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const day = idx + 1;
                  const dayOfWeek = (startDayOfWeek + idx) % 7;
                  const isSaturday = dayOfWeek === 6;
                  const isSelected = selectedDay === day;
                  const isToday = calYear === 2083 && calMonth === 4 && day === 20;
                  const hasEvent = monthEvents[day];

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-12 sm:h-14 rounded-lg flex flex-col justify-between p-1 relative transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-[#24592a] text-white border-[#24592a] shadow-md z-10' 
                          : isToday
                          ? 'bg-slate-50 text-slate-900 border-[#e52521] ring-2 ring-[#e52521]/30'
                          : isSaturday
                          ? 'bg-white text-[#e52521] border-slate-200 hover:bg-slate-50'
                          : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className={`text-sm font-extrabold ${isSelected ? 'text-white' : isSaturday ? 'text-[#e52521]' : 'text-slate-900'}`}>
                          {toNepaliDigits(day)}
                        </span>
                        {hasEvent && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                        )}
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {day}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details Panel (Exact Screenshot 2) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#e52521]">{toNepaliDigits(selectedDay)}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      भदौ २०८३ {DAYS_NE_FULL[(startDayOfWeek + selectedDay - 1) % 7]}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Sep {selectedDay}, 2026</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">आज</span>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>

              {/* Event Content & Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस, विराटनगरमा राधाकृष्ण रथयात्रा, गुंलागा नवमी
                </h4>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Moon size={15} className="text-slate-700" />
                    <span>क्रमशः बढ्दै गरेको गिब्बस</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Sun size={15} className="text-amber-500" />
                    <span>०५:४४</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Moon size={15} className="text-indigo-600" />
                    <span>०६:२०</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-800">भदौ कृष्ण नवमी (१० : १५ : २० PM बजे सम्म)</p>
                  <p className="text-slate-500 text-[11px]">ने.सं. ११४६ गुंलागा नवमी</p>
                </div>
              </div>

              {/* Samsung Sponsor Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">SAMSUNG</span>
                  <h5 className="text-xs font-bold">Upgrade to Galaxy</h5>
                  <p className="text-[10px] text-slate-400">Easy exchange, outstanding benefits</p>
                </div>
                <button className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-lg">
                  Shop Now
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 3: TOOLS / SERVICES (टूल)                                   */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <RefreshCw size={18} className="text-[#e52521]" /> BS ↔ AD Date Converter
              </h2>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setConvMode('BS_TO_AD')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    convMode === 'BS_TO_AD' ? 'bg-[#e52521] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BS to AD
                </button>
                <button
                  onClick={() => setConvMode('AD_TO_BS')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    convMode === 'AD_TO_BS' ? 'bg-[#e52521] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AD to BS
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={convYear} 
                  onChange={(e) => setConvYear(parseInt(e.target.value, 10))}
                  className="bg-slate-50 text-slate-900 font-bold text-xs p-2.5 rounded-xl border border-slate-300 outline-none"
                >
                  {[2080, 2081, 2082, 2083, 2084, 2085].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                  value={convMonth} 
                  onChange={(e) => setConvMonth(parseInt(e.target.value, 10))}
                  className="bg-slate-50 text-slate-900 font-bold text-xs p-2.5 rounded-xl border border-slate-300 outline-none"
                >
                  {NEPALI_MONTHS_NE.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>

                <input 
                  type="number" 
                  value={convDay} 
                  onChange={(e) => setConvDay(parseInt(e.target.value, 10) || 1)}
                  className="bg-slate-50 text-slate-900 font-bold text-xs p-2.5 rounded-xl border border-slate-300 outline-none"
                  placeholder="गते"
                />
              </div>

              <button 
                onClick={handleConvert}
                className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Convert Date
              </button>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Converted Result</span>
                <p className="text-base font-black text-[#e52521]">{convResult}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 4: NEWS & RASHIFAL (समाचार) - Screenshot 1                 */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-4 p-3.5 animate-fadeIn">
            
            {/* Top News Banner (Exact Screenshot 1) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center space-y-1">
              <h2 className="text-xl font-black text-[#e52521]">ताजा समाचार र नवीनतम अपडेट</h2>
              <p className="text-xs text-slate-600 font-medium">सत्य, तथ्य र स्थानीय आवाज एकै स्थानमा।</p>
            </div>

            {/* News Stories Section */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">न्यूज स्टोरी</h3>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Story 1 */}
                <div className="shrink-0 w-44 h-56 rounded-2xl relative overflow-hidden bg-slate-900 text-white p-3 flex flex-col justify-end shadow-md">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-3 leading-snug">
                      फिदिम स्पोर्टिङ क्लब ताप्लेजुङ गोल्डकपको सेमिफाइनलमा
                    </h4>
                  </div>
                </div>

                {/* Story 2 */}
                <div 
                  onClick={() => setSelectedZodiac(ZODIAC_SIGNS[0])}
                  className="shrink-0 w-44 h-56 rounded-2xl relative overflow-hidden bg-indigo-950 text-white p-3 flex flex-col justify-end shadow-md cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-3 leading-snug">
                      कस्तो रहला तपाईंको दिन ? हेर्नुहोस् आजका राशिफल
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Rashifal Selector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>♈</span> आजको दैनिक राशिफल (Horoscope)
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {ZODIAC_SIGNS.slice(0, 8).map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZodiac(z)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      selectedZodiac.id === z.id
                        ? 'bg-[#e52521] text-white border-[#e52521] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{z.icon}</span>
                    <span className="text-xs font-bold">{z.name}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">{selectedZodiac.name} राशि</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedZodiac.desc}</p>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 5: FOR YOU (तपाईंको लागि)                                   */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Smartphone size={18} className="text-[#e52521]" /> Native iOS & Android Apps
              </h2>
              <p className="text-xs text-slate-600">Download and install native app directly on your phone.</p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">🍎 Apple iOS Mobile Profile</span>
                    <span className="text-[9px] px-2 py-0.5 bg-red-100 text-[#e52521] font-bold rounded">iOS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Install native full-screen app profile on iPhone & iPad.</p>
                  <button 
                    onClick={() => setIsMobileModalOpen(true)}
                    className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    Get iOS Profile
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">🤖 Android Direct APK</span>
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">APK</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Download native APK installer package for Android devices.</p>
                  <a 
                    href="/downloads/NepaliCalendar-Mobile.apk" 
                    download
                    className="block text-center w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    Download Android APK
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 5-TAB BOTTOM NAVIGATION BAR (Exact Hamro Patro Screenshots)       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <nav className="bg-white border-t border-slate-200 grid grid-cols-5 py-2 px-1 absolute bottom-0 inset-x-0 z-30 shadow-lg">
        
        {/* Tab 1: Home (होम) */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-extrabold">होम</span>
        </button>

        {/* Tab 2: Calendar (पात्रो) */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon size={20} />
          <span className="text-[10px] font-extrabold">पात्रो</span>
        </button>

        {/* Tab 3: Center Floating Red Circle Dial Button */}
        <button
          onClick={() => setActiveTab('tools')}
          className="flex flex-col items-center justify-center relative -top-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#e52521] text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-105 transition-transform">
            <PhoneCall size={20} />
          </div>
        </button>

        {/* Tab 4: News & Rashifal (समाचार) */}
        <button
          onClick={() => setActiveTab('news')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer relative ${
            activeTab === 'news' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Newspaper size={20} />
            <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#e52521] text-white text-[8px] font-bold rounded-full">9+</span>
          </div>
          <span className="text-[10px] font-extrabold">समाचार</span>
        </button>

        {/* Tab 5: For You (तपाईंको लागि) */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-extrabold">तपाईंको लागि</span>
        </button>

      </nav>

      {/* Mobile App Download Modal */}
      <MobileAppDownloadModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        appName="Nepali Calendar"
        appUrl="https://bishalcodes.com/widgets/calendar"
      />
    </div>
  );
}
