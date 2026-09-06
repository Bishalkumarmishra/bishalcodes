import React, { useState, useEffect, useRef } from 'react';
import NepaliDate from 'nepali-date-converter';
import { 
  ChevronLeft, ChevronRight, Smartphone, Calendar as CalendarIcon, 
  Home, Newspaper, Sparkles, User, Sun, Moon, Search, Menu, Bell,
  ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, Layers, ArrowUpRight,
  TrendingUp, Clock, MapPin, Heart, Share2, Compass, ChevronDown, Download,
  Grid, Radio, Bookmark, HelpCircle, Code, Cpu, Check, ExternalLink, X, Plus, Scan,
  ArrowLeftRight, Pencil, Trash2, MapPinIcon, BellRing, CloudOff, Cloud
} from 'lucide-react';
// @ts-ignore
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
// @ts-ignore
import { collection, doc, addDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
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
const DAYS_EN_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_NE_FULL = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const DAYS_EN_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const NE_MONTHS_EVENTS: Record<number, Record<number, { title: string; isHoliday: boolean; desc?: string }>> = {
  0: { 1: { title: "नयाँ वर्ष / मे दिवस", isHoliday: true }, 11: { title: "लोकतन्त्र दिवस", isHoliday: true } },
  1: { 15: { title: "गणतन्त्र दिवस", isHoliday: true } },
  2: { 1: { title: "मिथुन संक्रान्ति", isHoliday: false }, 6: { title: "भोटो जात्रा / सिथि नखः", isHoliday: true }, 29: { title: "भानु जयन्ती", isHoliday: false } },
  3: { 1: { title: "साउने संक्रान्ति", isHoliday: false }, 27: { title: "जनै पूर्णिमा / रक्षा बन्धन", isHoliday: true }, 28: { title: "गाईजात्रा", isHoliday: true } },
  4: { 3: { title: "कृष्ण जन्माष्टमी", isHoliday: true }, 4: { title: "गौरा पर्व / दर खाने दिन", isHoliday: true }, 5: { title: "हरितालिका तीज व्रत", isHoliday: true }, 21: { title: "मानव बेचबिखन विरुद्ध राष्ट्रिय दिवस", isHoliday: false }, 22: { title: "अजा एकादशी व्रत", isHoliday: false }, 24: { title: "जेनजी शहीद दिवस", isHoliday: false }, 25: { title: "World Suicide Prevention Day", isHoliday: false } },
  5: { 3: { title: "इन्द्रजात्रा (Yenya Punhi)", isHoliday: true }, 16: { title: "विश्व पर्यटन दिवस", isHoliday: false }, 28: { title: "घटस्थापना (Dashain Begins)", isHoliday: true } },
  6: { 4: { title: "फूलपाती", isHoliday: true }, 5: { title: "महा अष्टमी", isHoliday: true }, 6: { title: "महानवमी", isHoliday: true }, 7: { title: "विजया दशमी", isHoliday: true }, 28: { title: "लक्ष्मीपूजा", isHoliday: true }, 30: { title: "भाइटीका", isHoliday: true } },
  7: { 3: { title: "छठ पर्व", isHoliday: true }, 24: { title: "उधौली पर्व / धान्य पूर्णिमा", isHoliday: true } },
  8: { 10: { title: "क्रिसमस डे", isHoliday: true }, 15: { title: "तमु ल्होसार", isHoliday: true }, 29: { title: "पृथ्वी जयन्ती", isHoliday: false } },
  9: { 1: { title: "माघे संक्रान्ति", isHoliday: true }, 16: { title: "सहिद दिवस", isHoliday: false }, 21: { title: "सोनाम ल्होसार", isHoliday: true } },
  10: { 7: { title: "सरस्वती पूजा / वसन्त पञ्चमी", isHoliday: true }, 19: { title: "प्रजातन्त्र दिवस", isHoliday: true }, 24: { title: "महाशिवरात्रि", isHoliday: true } },
  11: { 1: { title: "फागु पूर्णिमा (Holi)", isHoliday: true }, 25: { title: "रामनवमी", isHoliday: true } }
};

const ZODIAC_SIGNS = [
  { id: 'mesh', name: 'मेष', icon: '♈', desc: 'आज कार्यक्षेत्रमा नयाँ अवसरहरू मिल्नेछन्। मनमा प्रसन्नता छाउनेछ।' },
  { id: 'vrish', name: 'वृष', icon: '♉', desc: 'आर्थिक लाभको योग छ। परिवारको सहयोग पाइनेछ।' },
  { id: 'mithun', name: 'मिथुन', icon: '♊', desc: 'बोलीको प्रभाव बढ्नेछ। रोकिएका कामहरू सुचारु हुनेछन्।' },
  { id: 'karka', name: 'कर्कट', icon: '♋', desc: 'स्वास्थ्यमा सामान्य ध्यान दिनुहोला। यात्राको सम्भावना छ।' },
  { id: 'simha', name: 'सिंह', icon: '♌', desc: 'प्रतिष्ठा वृद्धि हुनेछ। सामाजिक कार्यमा रुचि बढ्नेछ।' },
  { id: 'kanya', name: 'कन्या', icon: '♍', desc: 'व्यवसायमा लाभ हुनेछ। नयाँ मित्रहरूसँग भेटघाट हुनेछ।' },
  { id: 'tula', name: 'तुला', icon: '♎', desc: 'आध्यात्मिक सोच बढ्नेछ। वैदेशिक कार्यमा सफलता मिल्नेछ।' },
  { id: 'vrischika', name: 'वृश्चिक', icon: '♏', desc: 'परिश्रमको फल प्राप्त हुनेछ। व्यापारमा प्रगति हुनेछ।' },
  { id: 'dhanu', name: 'धनु', icon: '♐', desc: 'पारिवारिक सुख मिल्नेछ। पठनपाठनमा प्रगति हुनेछ।' },
  { id: 'makar', name: 'मकर', icon: '♑', desc: 'शत्रुहरू परास्त हुनेछन्। आरोग्यता प्राप्त हुनेछ।' },
  { id: 'kumbha', name: 'कुम्भ', icon: '♒', desc: 'बुद्धिको प्रयोगले काम बन्नेछन्। सन्तान तर्फबाट खुसी मिल्नेछ।' },
  { id: 'meen', name: 'मीन', icon: '♓', desc: 'सवारी साधन चलाउँदा सावधानी अपनाउनुहोला। धन संचय हुनेछ।' }
];

export default function WidgetCalendar() {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'tools' | 'news' | 'profile'>('home');
  const [isHamroDrawerOpen, setIsHamroDrawerOpen] = useState<boolean>(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Modals
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [notes, setNotes] = useState<{id:any;text:string;date:string}[]>([]);
  const [openedNewsItem, setOpenedNewsItem] = useState<any>(null);
  const [hasPromptedPerms, setHasPromptedPerms] = useState<boolean>(false);
  const [showPermPrompt, setShowPermPrompt] = useState<boolean>(false);
  const [notesSource, setNotesSource] = useState<'local'|'firestore'>('local');

  // Today Date State initialized from real system date
  const [todayBs, setTodayBs] = useState<{ year: number; month: number; day: number }>(() => {
    try {
      const np = new NepaliDate();
      return { year: np.getYear(), month: np.getMonth(), day: np.getDate() };
    } catch (_) {
      return { year: 2083, month: 4, day: 21 };
    }
  });

  const [calYear, setCalYear] = useState<number>(todayBs.year);
  const [calMonth, setCalMonth] = useState<number>(todayBs.month);
  const [selectedDay, setSelectedDay] = useState<number>(todayBs.day);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [selectedZodiac, setSelectedZodiac] = useState<any>(ZODIAC_SIGNS[0]);

  // Real-time ticking clock, weather & news
  const [liveTimeStr, setLiveTimeStr] = useState<string>('08:24 am');
  const [liveAdDateStr, setLiveAdDateStr] = useState<string>('Sep 6, 2026');
  const [liveTemperature, setLiveTemperature] = useState<number>(28);
  const [liveNews, setLiveNews] = useState<any[]>([]);

  // Converter state
  const [convMode, setConvMode] = useState<'BS_TO_AD' | 'AD_TO_BS'>('BS_TO_AD');
  const [convYear, setConvYear] = useState<number>(todayBs.year);
  const [convMonth, setConvMonth] = useState<number>(todayBs.month);
  const [convDay, setConvDay] = useState<number>(todayBs.day);
  const [convResult, setConvResult] = useState<string>('');

  // Nepali news sources (real)
  const NEPALI_NEWS_SOURCES = [
    { name: 'Kantipur', domain: 'ekantipur.com' },
    { name: 'Setopati', domain: 'setopati.com' },
    { name: 'Online Khabar', domain: 'onlinekhabar.com' },
    { name: 'Ratopati', domain: 'ratopati.com' },
    { name: 'Nagarik', domain: 'nagariknews.com' },
    { name: 'Nepal Khabar', domain: 'nepalkhabar.com' },
  ];

  const toNepaliDigits = (num: number | string): string => {
    const map: Record<string, string> = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
    return num.toString().split('').map(c => map[c] || c).join('');
  };

  // Auth state listener — also loads Firestore notes on login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserPhoto(user.photoURL);
        setUserName(user.displayName);
        // Load notes from Firestore for this user
        try {
          const q = query(
            collection(db, `users/${user.uid}/notes`),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          const firestoreNotes = snap.docs.map((d: any) => ({
            id: d.id,
            text: d.data().text,
            date: d.data().date,
          }));
          setNotes(firestoreNotes);
          setNotesSource('firestore');
        } catch (e) {
          // fallback to localStorage
          const saved = localStorage.getItem('mp_notes');
          if (saved) setNotes(JSON.parse(saved));
          setNotesSource('local');
        }
      } else {
        setUserPhoto(null);
        setUserName(null);
        // Load from localStorage for guests
        const saved = localStorage.getItem('mp_notes');
        if (saved) setNotes(JSON.parse(saved));
        setNotesSource('local');
      }
    });
    return () => unsub();
  }, []);

  // First-visit permission prompt
  useEffect(() => {
    const prompted = localStorage.getItem('mp_perms_prompted');
    if (!prompted) {
      const timer = setTimeout(() => setShowPermPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePermissions = async () => {
    localStorage.setItem('mp_perms_prompted', '1');
    setShowPermPrompt(false);
    // Request notifications
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
    // Request location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`/api/v1/weather?lat=${latitude}&lon=${longitude}`)
            .then(r => r.json())
            .then(d => { if (d?.temp_celsius) setLiveTemperature(d.temp_celsius); })
            .catch(() => {});
        },
        () => {}
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUserPhoto(result.user.photoURL);
        setUserName(result.user.displayName);
      }
    } catch (err: any) {
      console.error('Google login failed:', err.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const user = auth.currentUser;

    if (user) {
      // Save to Firestore
      try {
        const ref = await addDoc(collection(db, `users/${user.uid}/notes`), {
          text: noteText.trim(),
          date: dateStr,
          createdAt: serverTimestamp(),
        });
        setNotes(prev => [{ id: ref.id, text: noteText.trim(), date: dateStr }, ...prev]);
        setNotesSource('firestore');
      } catch (e) {
        console.error('Firestore save failed:', e);
      }
    } else {
      // Save to localStorage
      const newNote = { id: Date.now(), text: noteText.trim(), date: dateStr };
      const updated = [newNote, ...notes];
      setNotes(updated);
      localStorage.setItem('mp_notes', JSON.stringify(updated));
      setNotesSource('local');
    }
    setNoteText('');
  };

  const handleDeleteNote = async (id: any) => {
    const user = auth.currentUser;
    if (user && notesSource === 'firestore') {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/notes`, id));
      } catch (e) { console.error(e); }
    } else {
      const updated = notes.filter(n => n.id !== id);
      localStorage.setItem('mp_notes', JSON.stringify(updated));
    }
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Search features list
  const FEATURES = [
    { label: 'Date Converter', tab: 'tools' as const, icon: '🔄' },
    { label: 'Calendar', tab: 'calendar' as const, icon: '📅' },
    { label: 'Nepal News', tab: 'news' as const, icon: '📰' },
    { label: 'Horoscope / Rashifal', tab: 'profile' as const, icon: '♈' },
    { label: 'Notes', tab: 'home' as const, icon: '📝' },
    { label: 'Holidays', tab: 'calendar' as const, icon: '🎉' },
    { label: 'Weather', tab: 'home' as const, icon: '🌤️' },
  ];
  const filteredFeatures = searchQuery.trim()
    ? FEATURES.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : FEATURES;

  // Real-time Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      
      const nepFormatted = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
      setLiveTimeStr(nepFormatted);

      const adFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setLiveAdDateStr(adFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Weather & News
  useEffect(() => {
    fetch('/api/v1/weather?city=Bharatpur')
      .then(res => res.json())
      .then(data => {
        if (data && data.temp_celsius) setLiveTemperature(data.temp_celsius);
      })
      .catch(() => {});

    fetch('/api/v1/news')
      .then(res => res.json())
      .then(data => {
        if (data && data.news) setLiveNews(data.news);
      })
      .catch(() => {});
  }, []);

  const getDaysInMonth = (year: number, monthIndex: number): number => {
    try {
      const test = new NepaliDate(year, monthIndex, 1);
      let maxDays = 29;
      for (let d = 29; d <= 32; d++) {
        try {
          test.setDate(d);
          if (test.getMonth() === monthIndex) maxDays = d;
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
      setConvResult(`${toNepaliDigits(convYear)} ${NEPALI_MONTHS_NE[convMonth]} ${toNepaliDigits(convDay)} गते (BS)`);
    }
  };

  useEffect(() => {
    handleConvert();
  }, [convYear, convMonth, convDay, convMode]);

  const monthDaysCount = getDaysInMonth(calYear, calMonth);
  const startDayOfWeek = getFirstDayOfWeek(calYear, calMonth);
  const monthEvents = NE_MONTHS_EVENTS[calMonth] || {};

  return (
    <div className="fixed inset-0 z-30 flex flex-col w-full h-full bg-[#f8f9fa] text-slate-900 font-sans overflow-hidden select-none sm:relative sm:inset-auto sm:z-auto sm:max-w-xl sm:mx-auto sm:h-[880px] sm:rounded-3xl sm:border border-slate-300 sm:shadow-2xl">
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* APP TOP BAR (Exact Matching Reference Screenshots 1, 2, 3, 4, 5) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <header className="px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHamroDrawerOpen(true)}
            className="p-1 text-slate-700 hover:text-[#e52521] transition-colors cursor-pointer"
            title="Hamro Services Menu"
          >
            <Menu size={22} />
          </button>
          
          {/* Official Mero Patro Logo (real PNG) */}
          <div className="flex items-center gap-2">
            <img 
              src="/mero-patro-app-icon-3d.png" 
              alt="Mero Patro" 
              className="w-9 h-9 rounded-lg object-contain shadow-sm hover:scale-105 transition-transform" 
            />
            <h1 className="text-base font-black text-slate-900 tracking-tight font-sans">
              MERO PATRO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHamroDrawerOpen(true)}
            className="p-1 text-slate-600 hover:text-[#e52521] transition-colors cursor-pointer"
            title="Scan QR"
          >
            <Scan size={20} />
          </button>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-1 text-slate-600 hover:text-[#e52521] transition-colors cursor-pointer"
            title="Search"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={() => handleGoogleLogin()}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 hover:border-[#e52521] hover:text-[#e52521] transition-colors overflow-hidden cursor-pointer"
            title="Profile"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} />
            )}
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MAIN VIEW CONTROLLER (Scrollable View)                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-6 custom-scrollbar bg-[#f8f9fa]">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 1: HOME (Exact Screenshot 1)                                */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Weather & Scenic Hero Landscape Card (Exact Screenshot 1) */}
            <div className="relative rounded-3xl overflow-hidden shadow-md text-white min-h-[160px] flex flex-col justify-between p-4 bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 z-10" />
              <div className="relative z-20 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Good Morning</p>
                  <h2 className="text-xl font-black text-white flex items-center gap-1.5 mt-0.5">
                    <Sun size={20} className="text-amber-300" /> {liveTemperature}° C | Bharatpur
                  </h2>
                </div>
              </div>

              <div className="relative z-20 flex justify-end">
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-1.5 bg-white/90 hover:bg-white text-slate-900 text-xs font-extrabold rounded-full shadow-md transition-all backdrop-blur-md"
                >
                  See More
                </button>
              </div>
            </div>

            {/* Date Summary Card with Right Mini Calendar Grid (Exact Screenshot 1) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 space-y-1 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
                <h2 className="text-2xl font-black text-slate-900">
                  {todayBs.day} {NEPALI_MONTHS_EN[todayBs.month]}
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  {DAYS_NE_FULL[new Date().getDay()]}, {toNepaliDigits(todayBs.year)}
                </p>
                <p className="text-xs text-slate-500 font-semibold">{liveAdDateStr}</p>
                
                <div className="pt-1.5 space-y-0.5 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">{NEPALI_MONTHS_NE[todayBs.month]} कृष्ण दशमी</p>
                  <p className="text-slate-500 text-[11px]">ने.सं. ११४६ गुंलागा दशमी</p>
                  <p className="text-[#e52521] text-xs font-extrabold font-mono pt-1">{liveTimeStr}</p>
                </div>
              </div>

              {/* Right Mini Month Calendar Grid with Highlighted Red 21 Circle (Exact Screenshot 1) */}
              <div className="w-full sm:w-52 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-600 pb-1.5 border-b border-slate-200">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className={i === 6 ? 'text-[#e52521]' : ''}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 pt-1.5 text-center text-xs">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`m-blank-${i}`} />
                  ))}
                  {Array.from({ length: monthDaysCount }).map((_, i) => {
                    const d = i + 1;
                    const isToday = d === todayBs.day;
                    const isSaturday = (startDayOfWeek + i) % 7 === 6;
                    return (
                      <span 
                        key={`m-${d}`} 
                        onClick={() => setSelectedDay(d)}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all ${
                          isToday
                            ? 'bg-[#e52521] text-white shadow-md'
                            : isSaturday
                            ? 'text-[#e52521] hover:bg-slate-200'
                            : 'text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Upcoming Events Carousel Section (Exact Screenshot 1) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Upcoming Events</h3>
                <button onClick={() => setActiveTab('calendar')} className="text-xs font-extrabold text-[#e52521] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Event Card 1 (Lord Vishnu Image) */}
                <div className="shrink-0 w-44 h-52 rounded-3xl relative overflow-hidden bg-slate-900 text-white p-3.5 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white font-extrabold text-[9px]">Tomorrow</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-xl font-black text-white">22 <span className="text-xs font-normal">Bhadra</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">Aja Ekadashi Vrata</h4>
                    <p className="text-[10px] text-slate-300">Mon +1</p>
                  </div>
                </div>

                {/* Event Card 2 (Gen-Z Sahid Diwas) */}
                <div className="shrink-0 w-44 h-52 rounded-3xl relative overflow-hidden bg-slate-950 text-white p-3.5 flex flex-col justify-between shadow-md border border-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-black z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">In 2 days</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-xl font-black text-amber-400">23 <span className="text-xs font-normal text-white">Bhadra</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">Gen-Z Sahid Diwas</h4>
                    <p className="text-[10px] text-slate-400">Tue +3</p>
                  </div>
                </div>

                {/* Event Card 3 (World Suicide Prevention Day) */}
                <div className="shrink-0 w-44 h-52 rounded-3xl relative overflow-hidden bg-slate-900 text-white p-3.5 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white font-extrabold text-[9px]">In 4 days</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <p className="text-xl font-black text-white">25 <span className="text-xs font-normal">Bhadra</span></p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">World Suicide Prevention Day</h4>
                    <p className="text-[10px] text-slate-300">Thu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Pill Buttons (Exact Screenshot 1) */}
            <div className="grid grid-cols-3 gap-2.5">
              <button onClick={() => setIsNotesOpen(true)} className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 transition-colors cursor-pointer">
                <span>📝</span> Notes
              </button>
              <button onClick={() => setActiveTab('calendar')} className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 transition-colors">
                <span>📅</span> Holidays
              </button>
              <button onClick={() => setActiveTab('profile')} className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-extrabold text-slate-800 transition-colors">
                <span>⭐</span> Sahits
              </button>
            </div>

            {/* Add Notes Action Bar */}
            <div className="flex items-center justify-end pt-1 border-t border-slate-200">
              <button onClick={() => setIsNotesOpen(true)} className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 hover:text-[#e52521]">
                <Plus size={16} className="p-0.5 rounded-full bg-slate-900 text-white" /> Add Notes
              </button>
            </div>

            {/* Astrology Banner (Exact Screenshot 1) */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                  🔮
                </div>
                <div>
                  <p className="text-[10px] text-amber-800 font-bold">प्रेम • करियर • धन • सम्बन्ध</p>
                  <h4 className="text-xs font-extrabold text-amber-950">आफ्नो प्रश्नको ज्योतिषीय उत्तर खोज्नुहोस्।</h4>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('news')}
                className="px-3 py-1.5 bg-[#e52521] text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-[#d01f1c]"
              >
                हेर्नुहोस्
              </button>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 2: CALENDAR (Exact Screenshot 2)                            */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Month Controller Bar (Exact Screenshot 2) */}
            <div className="bg-white p-3 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <h2 className="text-base font-black text-slate-900">{NEPALI_MONTHS_NE[calMonth]} {toNepaliDigits(calYear)}</h2>
                  <ChevronDown size={16} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Aug/Sep 2026</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCalYear(todayBs.year); setCalMonth(todayBs.month); setSelectedDay(todayBs.day); }}
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-slate-800"
                >
                  Today
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(prev => prev - 1); }
                    else { setCalMonth(prev => prev - 1); }
                  }}
                  className="w-7 h-7 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center hover:bg-slate-200"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(prev => prev + 1); }
                    else { setCalMonth(prev => prev + 1); }
                  }}
                  className="w-7 h-7 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center hover:bg-slate-200"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 7-Column Calendar Grid with Dual Dates (Exact Screenshot 2) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-1 shadow-sm">
              <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-200 pb-2">
                {DAYS_EN_SHORT.map((d, idx) => (
                  <span key={d} className={`text-xs font-extrabold ${idx === 6 ? 'text-[#e52521]' : 'text-slate-800'}`}>
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 pt-1">
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-12 rounded-lg bg-transparent" />
                ))}

                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const day = idx + 1;
                  const dayOfWeek = (startDayOfWeek + idx) % 7;
                  const isSaturday = dayOfWeek === 6;
                  const isSelected = selectedDay === day;
                  const isToday = calYear === todayBs.year && calMonth === todayBs.month && day === todayBs.day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-12 sm:h-14 rounded-lg flex flex-col justify-between p-1.5 relative transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-[#24592a] text-white border-[#24592a] shadow-md z-10' 
                          : isToday
                          ? 'bg-slate-50 text-slate-900 border-[#e52521] ring-2 ring-[#e52521]/30'
                          : isSaturday
                          ? 'bg-white text-[#e52521] border-slate-200 hover:bg-slate-50'
                          : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-sm font-extrabold ${isSelected ? 'text-white' : isSaturday ? 'text-[#e52521]' : 'text-slate-900'}`}>
                        {toNepaliDigits(day)}
                      </span>
                      <span className={`text-[10px] font-semibold text-right ${isSelected ? 'text-white/80' : isSaturday ? 'text-[#e52521]' : 'text-slate-400'}`}>
                        {day}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details Panel (Exact Screenshot 2) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-4 shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-3xl font-black text-[#e52521]">{selectedDay}</span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {NEPALI_MONTHS_EN[calMonth]} {calYear}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">{DAYS_EN_FULL[(startDayOfWeek + selectedDay - 1) % 7]}</p>
                  <p className="text-xs text-slate-400 font-medium">{liveAdDateStr}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <span className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-extrabold">Today</span>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>
                  <button onClick={() => setIsNotesOpen(true)} className="px-3 py-1.5 bg-[#24592a] hover:bg-[#1b4320] text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer transition-colors">
                    <Plus size={14} /> Add Notes
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-800 font-bold">
                  {NEPALI_MONTHS_NE[calMonth]} कृष्ण दशमी (०७ : ५१ : १४ PM बजे सम्म)
                </p>
                <p className="text-xs text-slate-500">NS 1146 गुंलागा दशमी</p>

                <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Moon size={18} className="text-slate-600" />
                    <span className="text-xs font-semibold text-slate-600">Waxing Gibbous</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span>🌅 05:44</span>
                    <span>🌇 06:18</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 3: NEWS (Exact Screenshots 3 & 4)                           */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Header Banner (Exact Screenshot 3) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center space-y-1.5">
              <h2 className="text-2xl font-black text-[#e52521]">Stay Ahead - Stay Informed</h2>
              <p className="text-xs text-slate-600 font-medium">
                Explore trusted news coverage, insightful stories, and local perspectives—all in one place.
              </p>
            </div>

            {/* News Story Horizontal Cards */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">News Story</h3>
                <span className="text-xs font-bold text-slate-600 cursor-pointer">थप समाचार पढ्नुहोस्</span>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Story 1 */}
                <div className="shrink-0 w-48 h-60 rounded-3xl relative overflow-hidden bg-slate-900 text-white p-3.5 flex flex-col justify-end shadow-md">
                  <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-3 leading-snug">
                      फिदिम स्पोर्टिङ क्लब ताप्लेजुङ गोल्डकपको सेमिफाइनलमा
                    </h4>
                  </div>
                </div>

                {/* Story 2 */}
                <div className="shrink-0 w-48 h-60 rounded-3xl relative overflow-hidden bg-slate-950 text-white p-3.5 flex flex-col justify-end shadow-md border border-slate-800">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-3 leading-snug">
                      कस्तो रहला तपाईंको दिन ? हेर्नुहोस् आजका राशिफल
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular News Feed Vertical Stream (Exact Screenshot 4) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">Popular News</h3>
                <span className="text-xs font-bold text-slate-600 cursor-pointer">View All</span>
              </div>

              <div className="space-y-2.5">
                {liveNews.length > 0 ? (
                  liveNews.map((item, idx) => {
                    const source = NEPALI_NEWS_SOURCES[idx % NEPALI_NEWS_SOURCES.length];
                    return (
                      <button
                        key={item.id || idx}
                        onClick={() => setOpenedNewsItem(item)}
                        className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:border-[#e52521] transition-all group text-left w-full"
                      >
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          <img src={`https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80`} alt="News" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#e52521] leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-[#e52521]">{source.name}</span>
                            <span>{source.domain}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    समाचार लोड हुँदैछ...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 4: FOR YOU (Exact Screenshot 5)                             */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Hero Update Banner (Exact Screenshot 5) */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80')` }}>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                  <h3 className="text-xl font-black text-white text-center drop-shadow-md">
                    भोटेकोशी बाढी UPDATE
                  </h3>
                </div>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-rose-50/50">
                <div>
                  <p className="text-xs font-bold text-slate-900">Click here to view more</p>
                  <p className="text-[10px] text-slate-500">app.hamropatro.com</p>
                </div>
                <button className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-900 font-extrabold text-xs rounded-xl hover:bg-slate-50 shadow-sm">
                  See More
                </button>
              </div>
            </div>

            {/* Health Article Infographic Card (Exact Screenshot 5) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
              <div>
                <h3 className="text-base font-black text-slate-900">How to reduce excessive anxiety</h3>
                <p className="text-xs text-slate-500">Simple steps for mental well-being. · 6 min ago</p>
              </div>

              <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 text-center space-y-3">
                <h4 className="text-sm font-black text-purple-950">How To Reduce Excessive Anxiety</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-purple-900">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-100">साँस फेर्नुहोस्</div>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-100">व्यायाम गर्नुहोस्</div>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-100">कुरा गर्नुहोस्</div>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-100">सल्लाह लिनुहोस्</div>
                </div>
              </div>
            </div>

            {/* Daily Rashifal Selector */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-[#e52521]">♈</span> आजको दैनिक राशिफल (Horoscope)
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {ZODIAC_SIGNS.slice(0, 12).map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZodiac(z)}
                    className={`p-2 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
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

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold text-slate-900">{selectedZodiac.name} राशि ({selectedZodiac.icon})</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedZodiac.desc}</p>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 5: DATE CONVERTER (Exact Requirement & Design)              */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-[#d01f1c] to-[#e52521] rounded-3xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">नेपाली मिति रूपान्तरण</span>
                  <h2 className="text-2xl font-black mt-0.5">Date Converter</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                  🔄
                </div>
              </div>
              <p className="text-xs text-white/90 mt-2 font-medium">
                BS बाट AD र AD बाट BS मिति तुरुन्तै रूपान्तरण गर्नुहोस्
              </p>
            </div>

            {/* Conversion Mode Switcher */}
            <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1">
              <button
                onClick={() => setConvMode('BS_TO_AD')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  convMode === 'BS_TO_AD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BS ➔ AD (वि.सं. बाट ई.सं.)
              </button>
              <button
                onClick={() => setConvMode('AD_TO_BS')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  convMode === 'AD_TO_BS'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AD ➔ BS (ई.सं. बाट वि.सं.)
              </button>
            </div>

            {/* Input Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>📅</span> {convMode === 'BS_TO_AD' ? 'नेपाली मिति छान्नुहोस् (BS)' : 'English Date (AD)'}
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Year */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Year</label>
                  <select
                    value={convYear}
                    onChange={(e) => setConvYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#e52521]"
                  >
                    {convMode === 'BS_TO_AD'
                      ? Array.from({ length: 90 }, (_, i) => 2000 + i).map(y => (
                          <option key={y} value={y}>{y} ({toNepaliDigits(y)})</option>
                        ))
                      : Array.from({ length: 90 }, (_, i) => 1943 + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))
                    }
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Month</label>
                  <select
                    value={convMonth}
                    onChange={(e) => setConvMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#e52521]"
                  >
                    {convMode === 'BS_TO_AD'
                      ? NEPALI_MONTHS_EN.map((m, i) => (
                          <option key={m} value={i}>{m} ({NEPALI_MONTHS_NE[i]})</option>
                        ))
                      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                          <option key={m} value={i}>{m}</option>
                        ))
                    }
                  </select>
                </div>

                {/* Day */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Day</label>
                  <select
                    value={convDay}
                    onChange={(e) => setConvDay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#e52521]"
                  >
                    {Array.from({ length: 32 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d} {convMode === 'BS_TO_AD' ? `(${toNepaliDigits(d)})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white text-center space-y-1 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Converted Date (नतिजा)</span>
                <p className="text-lg font-black text-white">{convResult || 'रूपान्तरण हुँदैछ...'}</p>
                <p className="text-[11px] text-amber-300 font-semibold">
                  {convMode === 'BS_TO_AD' ? 'Converted from Bikram Sambat' : 'Converted to Bikram Sambat'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConvYear(todayBs.year);
                    setConvMonth(todayBs.month);
                    setConvDay(todayBs.day);
                    setConvMode('BS_TO_AD');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Reset to Today
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="flex-1 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  View in Calendar
                </button>
              </div>
            </div>

            {/* Quick Tools Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-xl">🎂</span>
                <h4 className="text-xs font-black text-slate-900">उमेर क्याल्कुलेटर</h4>
                <p className="text-[11px] text-slate-500">तपाईंको सही उमेर र अर्को जन्मदिन</p>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                <span className="text-xl">⏳</span>
                <h4 className="text-xs font-black text-slate-900">दिन गणना</h4>
                <p className="text-[11px] text-slate-500">दुई मिति बीचको फरक दिनहरू</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 5-TAB BOTTOM NAVIGATION BAR (Exact Screenshots 1-5)               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <nav className="bg-white border-t border-slate-200 grid grid-cols-5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,8px))] px-1 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-extrabold">Home</span>
        </button>

        {/* Tab 2: Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon size={20} />
          <span className="text-[10px] font-extrabold">Calendar</span>
        </button>

        {/* Tab 3: Center – Date Converter (red circle) */}
        <button
          onClick={() => setActiveTab('tools')}
          className="flex flex-col items-center justify-center relative -top-3 cursor-pointer"
          title="Date Converter"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d01f1c] via-[#e52521] to-[#f82c28] text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-105 transition-transform">
            <ArrowLeftRight size={20} />
          </div>
          <span className="text-[9px] font-extrabold text-slate-500 mt-0.5">Convert</span>
        </button>

        {/* Tab 4: News */}
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
          <span className="text-[10px] font-extrabold">News</span>
        </button>

        {/* Tab 5: For You */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-[#e52521]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-extrabold">For You</span>
        </button>

      </nav>

      {/* Mobile App Download Modal */}
      <MobileAppDownloadModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        appName="Nepali Calendar"
        appUrl="https://bishalcodes.com/widgets/calendar"
      />

      {/* ─── PERMISSION PROMPT (First Visit) ─── */}
      {showPermPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <img src="/mero-patro-app-icon-3d.png" alt="Mero Patro" className="w-12 h-12 rounded-xl" />
              <div>
                <h2 className="text-base font-black text-slate-900">Mero Patro को अनुमति</h2>
                <p className="text-xs text-slate-500">राम्रो अनुभवको लागि अनुमति दिनुहोस्</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <MapPinIcon size={18} className="text-[#e52521] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">स्थान पहुँच (Location)</p>
                  <p className="text-[11px] text-slate-500">तपाईंको शहरको मौसम देखाउन</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <BellRing size={18} className="text-[#e52521] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">सूचना (Notifications)</p>
                  <p className="text-[11px] text-slate-500">पर्व र तिथिको रिमाइन्डर पाउन</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { localStorage.setItem('mp_perms_prompted','1'); setShowPermPrompt(false); }}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-sm rounded-2xl"
              >पछि</button>
              <button
                onClick={handlePermissions}
                className="flex-1 py-2.5 bg-[#e52521] text-white font-black text-sm rounded-2xl"
              >अनुमति दिनुहोस्</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IN-APP NATIVE NEWS READER MODAL (Never Blank!) ─── */}
      {openedNewsItem && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-lg mx-auto h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setOpenedNewsItem(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <X size={20} />
                </button>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-[#e52521] uppercase tracking-wider">
                    {openedNewsItem.category || 'Mero Patro News'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate">नेपाली ताजा समाचार</p>
                </div>
              </div>
              <a
                href={openedNewsItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#e52521] text-white text-xs font-extrabold rounded-xl hover:bg-[#d01f1c] transition-colors flex items-center gap-1 shrink-0"
              >
                <span>ब्राउजरमा खोल्नुहोस्</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Article Content Body (Scrollable, Clean native typography) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {openedNewsItem.title}
              </h1>

              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-700">✍️ मेरो पात्रो न्युज डेस्क</span>
                <span>{openedNewsItem.pubDate ? new Date(openedNewsItem.pubDate).toLocaleDateString('ne-NP') : 'अहिले भर्खरै'}</span>
              </div>

              {/* Cover Image */}
              <div className="w-full h-52 rounded-2xl overflow-hidden shadow-sm bg-slate-100 border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80"
                  alt="News Banner"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Story Excerpt / Full Body */}
              <div className="text-sm text-slate-800 leading-relaxed space-y-3 font-normal">
                <p className="font-semibold text-slate-900">
                  {openedNewsItem.title} सम्बन्धी ताजा विवरण प्राप्त भएको छ।
                </p>
                <p>
                  नेपाल तथा विश्वभरिका प्रमुख समसामयिक घटनाहरू, राजनीतिक, आर्थिक, सामाजिक तथा खेलकुद सम्बन्धी महत्वपूर्ण समाचार र विश्लेषणहरू तपाईंले मेरो पात्रो एपमार्फत सिधै पढ्न सक्नुहुन्छ।
                </p>
                <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  📰 यो समाचार स्रोतबाट सिधै संकलन गरिएको हो। आधिकारिक पूर्ण विवरणका लागि तलको बटन थिचेर मूल स्रोत हेर्न सक्नुहुन्छ।
                </p>
              </div>

              {/* Bottom Call to Action */}
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                <a
                  href={openedNewsItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold text-xs text-center rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span>मूल समाचार पत्रिकामा पढ्नुहोस्</span>
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => setOpenedNewsItem(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center rounded-2xl transition-colors"
                >
                  बन्द गर्नुहोस् (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SEARCH MODAL ─── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col p-4 pt-16">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search features... (e.g. Calendar, News, Convert)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 text-sm outline-none text-slate-900 font-medium"
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {filteredFeatures.map((f, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveTab(f.tab); setIsSearchOpen(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 text-left"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm font-bold text-slate-900">{f.label}</span>
                  <ArrowRight size={14} className="ml-auto text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTES MODAL ─── */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">📝 मेरा नोट्स</h3>
              <button onClick={() => setIsNotesOpen(false)}><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <textarea
                placeholder="यहाँ नोट लेख्नुहोस्..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={2}
                className="flex-1 text-sm outline-none border border-slate-200 rounded-2xl p-3 resize-none text-slate-900"
              />
              <button
                onClick={handleAddNote}
                className="px-4 bg-[#e52521] text-white rounded-2xl font-black text-sm"
              >Save</button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {notes.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">अहिलेसम्म कुनै नोट छैन। माथि लेख्नुहोस्।</p>
              )}
              {notes.map(n => (
                <div key={n.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                  </div>
                  <button onClick={() => handleDeleteNote(n.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MERO SERVICES DRAWER MODAL */}
      {isHamroDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base font-black text-slate-900">Mero Services</h2>
              <button 
                onClick={() => setIsHamroDrawerOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5 flex-1">
              <div className="bg-red-400 text-white rounded-2xl p-4 space-y-2 shadow-sm">
                <h3 className="text-sm font-black">Join Mero Patro Membership</h3>
                <p className="text-xs text-white/90 leading-snug">
                  Get discounts on services along with an ad-free experience.
                </p>
                <button 
                  onClick={() => { setIsHamroDrawerOpen(false); handleGoogleLogin(); }}
                  className="mt-2 px-4 py-2 bg-white text-red-600 font-black text-xs rounded-xl shadow hover:bg-slate-100 transition-colors"
                >
                  Subscribe Now
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700">Search Features</span>
                <div 
                  onClick={() => { setIsHamroDrawerOpen(false); window.dispatchEvent(new CustomEvent('open_global_search')); }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-pointer hover:border-[#e52521]"
                >
                  <Search size={16} className="text-slate-400" />
                  <span>Search Features...</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-1">फिचर्ड</h4>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('tools'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">💳</span>
                    <span className="font-bold text-slate-800 text-[11px]">MeroPay</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('news'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">🪐</span>
                    <span className="font-bold text-slate-800 text-[11px]">Jyotish</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setIsNotesOpen(true); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer">
                    <span className="text-xl">📋</span>
                    <span className="font-bold text-slate-800 text-[11px]">Notes / Events</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('profile'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">🩺</span>
                    <span className="font-bold text-slate-800 text-[11px]">Health</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('news'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">📈</span>
                    <span className="font-bold text-slate-800 text-[11px]">Share Market</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('tools'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">📹</span>
                    <span className="font-bold text-slate-800 text-[11px]">Chautari Meet</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-1">जीवनशैली</h4>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('calendar'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">📅</span>
                    <span className="font-bold text-emerald-700 text-[11px]">Calendar</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('profile'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">⭐</span>
                    <span className="font-bold text-slate-800 text-[11px]">Saait</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('news'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">💌</span>
                    <span className="font-bold text-slate-800 text-[11px]">E-cards</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('tools'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">🔄</span>
                    <span className="font-bold text-slate-800 text-[11px]">Date Converter</span>
                  </button>
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('calendar'); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <span className="text-xl">🗓️</span>
                    <span className="font-bold text-slate-800 text-[11px]">Holidays</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
