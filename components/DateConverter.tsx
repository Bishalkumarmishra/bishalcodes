import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Copy, Check, Download, Share2, ChevronLeft, ChevronRight, RotateCcw, ArrowRightLeft, Sparkles, HelpCircle, Code } from 'lucide-react';
import NepaliDate from 'nepali-date-converter';
import { useNavigation } from '../context/NavigationContext';
import { auth, db } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import DesktopDownloadModal from './DesktopDownloadModal';

// Date Constants
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

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_NE = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
const DAYS_NE_SHORT = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

const NE_MONTHS_EVENTS: Record<number, Record<number, { title: string; isHoliday: boolean }>> = {
  0: { // Baisakh
    1: { title: "नयाँ वर्ष (New Year's Day) / मे दिवस (May Day)", isHoliday: true },
    11: { title: "लोकतन्त्र दिवस (Loktantra Diwas)", isHoliday: true },
    30: { title: "मातातीर्थ औंसी (Mother's Day)", isHoliday: false }
  },
  1: { // Jestha
    15: { title: "गणतन्त्र दिवस (Republic Day)", isHoliday: true }
  },
  2: { // Ashadh
    1: { title: "अधिकमास समाप्ति / मिथुन संक्रान्ति / सोमबारे औंसी", isHoliday: false },
    2: { title: "अन्तर्राष्ट्रिय पारिवारिक रेमिट्यान्स दिवस", isHoliday: false },
    3: { title: "विश्व खडेरी विरुद्ध संघर्ष दिवस", isHoliday: false },
    5: { title: "द्वन्द्वमा यौन हिंसा उन्मूलनको लागि अन्तर्राष्ट्रिय दिवस", isHoliday: false },
    6: { title: "भोटो जात्रा (काठमाडौँ उपत्यका बिदा) / सिथि नखः / कुमारषष्ठी", isHoliday: true },
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
    29: { title: "भानु जयन्ती (Bhanu Jayanti)", isHoliday: false },
    31: { title: "विश्व युवा दक्षता दिवस", isHoliday: false }
  },
  3: { // Shrawan
    1: { title: "साउने संक्रान्ति / कर्कट संक्रान्ति / लुतो फाल्ने दिन", isHoliday: false },
    15: { title: "खीर खाने दिन (Kheer Khane Din)", isHoliday: false },
    27: { title: "जनै पूर्णिमा / रक्षा बन्धन (Raksha Bandhan)", isHoliday: true },
    28: { title: "गाईजात्रा (Gai Jatra - Valley Holiday)", isHoliday: true }
  },
  4: { // Bhadra
    3: { title: "कृष्ण जन्माष्टमी (Krishna Janmashtami)", isHoliday: true },
    4: { title: "गौरा पर्व (Gaura Parva)", isHoliday: true },
    5: { title: "दर खाने दिन", isHoliday: false },
    6: { title: "हरितालिका तीज (Teej Holiday for Women)", isHoliday: true },
    8: { title: "ऋषि पञ्चमी (Rishi Panchami)", isHoliday: false },
    14: { title: "इन्द्रजात्रा (Indra Jatra - Valley Holiday)", isHoliday: true }
  },
  5: { // Ashwin
    3: { title: "संविधान दिवस (Constitution Day)", isHoliday: true },
    10: { title: "घटस्थापना (Ghatasthapana - Dashain Begins)", isHoliday: true },
    17: { title: "फूलपाती (Phulpati)", isHoliday: true },
    18: { title: "महाअष्टमी (Maha Ashtami)", isHoliday: true },
    19: { title: "महानवमी (Maha Navami)", isHoliday: true },
    20: { title: "विजया दशमी (Vijaya Dashami - Main Dashain)", isHoliday: true },
    21: { title: "एकादशी (Dashain Papareshkusha)", isHoliday: true },
    24: { title: "कोजाग्रत पूर्णिमा (Kojagrat Purnima)", isHoliday: true }
  },
  6: { // Kartik
    12: { title: "काग तिहार (Kag Tihar)", isHoliday: false },
    13: { title: "कुकुर तिहार / लक्ष्मी पूजा (Tihar - Laxmi Puja)", isHoliday: true },
    14: { title: "गोवर्धन पूजा / म्ह पूजा", isHoliday: true },
    15: { title: "भाइटीका (Bhai Tika)", isHoliday: true },
    20: { title: "छठ पर्व (Chhath Parva)", isHoliday: true }
  },
  7: { // Mangsir
    18: { title: "उधौली पर्व / धान्य पूर्णिमा / योमरी पुन्हि", isHoliday: true }
  },
  8: { // Poush
    10: { title: "क्रिसमस डे (Christmas Day)", isHoliday: true },
    15: { title: "तमु ल्होसार (Tamu Lhosar)", isHoliday: true },
    27: { title: "राष्ट्रिय एकता दिवस / पृथ्वी जयन्ती", isHoliday: false }
  },
  9: { // Magh
    1: { title: "माघे संक्रान्ति / माघी (Maghe Sankranti)", isHoliday: true },
    16: { title: "शहीद दिवस (Martyrs Day)", isHoliday: false },
    20: { title: "सोनाम ल्होसार (Sonam Lhosar)", isHoliday: true }
  },
  10: { // Falgun
    7: { title: "राष्ट्रिय प्रजातन्त्र दिवस (Democracy Day)", isHoliday: true },
    15: { title: "महाशिवरात्रि (Maha Shivaratri)", isHoliday: true },
    24: { title: "नारी दिवस (International Women's Day)", isHoliday: true },
    27: { title: "फागु पूर्णिमा - होली पहाड (Holi - Hilly region)", isHoliday: true },
    28: { title: "फागु पूर्णिमा - होली तराई (Holi - Tarai region)", isHoliday: true }
  },
  11: { // Chaitra
    15: { title: "घोडेजात्रा (Ghore Jatra - Valley Holiday)", isHoliday: true },
    24: { title: "चैते दशमी (Chaite Dashain)", isHoliday: false },
    25: { title: "रामनवमी (Rama Navami)", isHoliday: true }
  }
};


type UserNotes = Record<string, { color: string; text: string }>;

const NOTE_COLORS: Record<string, { bg: string; dot: string; text: string; border: string; previewBg: string }> = {
  default: {
    bg: 'bg-slate-50/70 dark:bg-slate-800/20',
    dot: 'bg-slate-400 dark:bg-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    previewBg: 'bg-slate-50 dark:bg-slate-800/40'
  },
  red: {
    bg: 'bg-rose-50/70 dark:bg-rose-950/20',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-900/30',
    previewBg: 'bg-rose-100 dark:bg-rose-900/20'
  },
  blue: {
    bg: 'bg-red-50/70 dark:bg-blue-950/20',
    dot: 'bg-red-500',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-red-200 dark:border-blue-900/30',
    previewBg: 'bg-blue-100 dark:bg-blue-900/20'
  },
  green: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900/30',
    previewBg: 'bg-emerald-100 dark:bg-emerald-900/20'
  },
  yellow: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/20',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/30',
    previewBg: 'bg-amber-100 dark:bg-amber-900/20'
  },
  purple: {
    bg: 'bg-red-50/70 dark:bg-purple-950/20',
    dot: 'bg-red-500',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900/30',
    previewBg: 'bg-red-100 dark:bg-purple-900/20'
  }
};

export const DateConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [user] = useAuthState(auth);
  
  // Custom Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'adToBs' | 'bsToAd'>('adToBs');

  // Input states
  // AD Inputs
  const [adYear, setAdYear] = useState<number>(new Date().getFullYear());
  const [adMonth, setAdMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [adDay, setAdDay] = useState<number>(new Date().getDate());

  // BS Inputs
  const [bsYear, setBsYear] = useState<number>(2083);
  const [bsMonth, setBsMonth] = useState<number>(2); // 0-indexed (Ashadh)
  const [bsDay, setBsDay] = useState<number>(7);

  // Conversion result states
  const [convertedResult, setConvertedResult] = useState<{
    adDate: Date;
    bsYear: number;
    bsMonth: number;
    bsDay: number;
    dayOfWeek: number; // 0-6
    bsFormattedEN: string;
    bsFormattedNE: string;
    adFormattedEN: string;
    error: string | null;
  } | null>(null);

  // Interactive Calendar view month/year
  const [calViewType, setCalViewType] = useState<'AD' | 'BS'>('BS');
  const [calYear, setCalYear] = useState<number>(2083);
  const [calMonth, setCalMonth] = useState<number>(2); // 0-indexed

  // UI status
  const [copied, setCopied] = useState<boolean>(false);
  const [liveNptClock, setLiveNptClock] = useState<string>('');
  const [todayDetails, setTodayDetails] = useState<{ ad: string; bs: string } | null>(null);

  // User Notes States
  const [notes, setNotes] = useState<UserNotes>({});
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [noteColor, setNoteColor] = useState<string>('default');

  const [emailInput, setEmailInput] = useState<string>('');
  const [sendEmailCopy, setSendEmailCopy] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.email) {
      setEmailInput(user.email);
      setSendEmailCopy(true);
    }
  }, [user]);


  // Range configurations
  const minBsYear = 2000;
  const maxBsYear = 2095;
  const minAdYear = 1944;
  const maxAdYear = 2038;

  // Conversion core functions
  const performConversion = useCallback((
    type: 'AD_TO_BS' | 'BS_TO_AD',
    y: number,
    m: number,
    d: number
  ) => {
    try {
      let adDate: Date;
      let npDate: NepaliDate;

      if (type === 'AD_TO_BS') {
        // Validate Gregorian date inputs
        adDate = new Date(y, m, d);
        if (adDate.getFullYear() !== y || adDate.getMonth() !== m || adDate.getDate() !== d) {
          throw new Error("Invalid Gregorian (AD) Date");
        }
        if (y < minAdYear || y > maxAdYear) {
          throw new Error(`AD Year must be between ${minAdYear} and ${maxAdYear}`);
        }
        npDate = new NepaliDate(adDate);
      } else {
        // Validate Nepali date inputs
        if (y < minBsYear || y > maxBsYear) {
          throw new Error(`BS Year must be between ${minBsYear} and ${maxBsYear}`);
        }
        npDate = new NepaliDate(y, m, d);
        adDate = npDate.toJsDate();
      }

      const by = npDate.getYear();
      const bm = npDate.getMonth();
      const bd = npDate.getDate();
      const dow = npDate.getDay(); // Sunday=0 ... Saturday=6

      // Format strings
      const nepaliDigits = (num: number) => {
        const digMap = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return num.toString().split('').map(c => digMap[parseInt(c, 10)] || c).join('');
      };

      const bsFormattedEN = `${NEPALI_MONTHS_EN[bm]} ${bd}, ${by}`;
      const bsFormattedNE = `${DAYS_NE[dow]}, ${nepaliDigits(bd)} ${NEPALI_MONTHS_NE[bm]} ${nepaliDigits(by)}`;
      
      const adFormattedEN = `${DAYS_EN[adDate.getDay()]}, ${GREGORIAN_MONTHS_EN[adDate.getMonth()]} ${adDate.getDate()}, ${adDate.getFullYear()}`;

      setConvertedResult({
        adDate,
        bsYear: by,
        bsMonth: bm,
        bsDay: bd,
        dayOfWeek: dow,
        bsFormattedEN,
        bsFormattedNE,
        adFormattedEN,
        error: null
      });

      // Synchronize input fields
      if (type === 'AD_TO_BS') {
        setBsYear(by);
        setBsMonth(bm);
        setBsDay(bd);
      } else {
        setAdYear(adDate.getFullYear());
        setAdMonth(adDate.getMonth());
        setAdDay(adDate.getDate());
      }
    } catch (err: any) {
      setConvertedResult({
        adDate: new Date(),
        bsYear: 2083,
        bsMonth: 0,
        bsDay: 1,
        dayOfWeek: 0,
        bsFormattedEN: '',
        bsFormattedNE: '',
        adFormattedEN: '',
        error: err.message || "An unexpected error occurred during conversion."
      });
    }
  }, []);

  // Update calendar view when conversion occurs
  useEffect(() => {
    if (convertedResult && !convertedResult.error) {
      if (calViewType === 'BS') {
        setCalYear(convertedResult.bsYear);
        setCalMonth(convertedResult.bsMonth);
      } else {
        setCalYear(convertedResult.adDate.getFullYear());
        setCalMonth(convertedResult.adDate.getMonth());
      }
    }
  }, [convertedResult, calViewType]);

  // Handle Tab changes
  const handleTabChange = (tab: 'adToBs' | 'bsToAd') => {
    setActiveTab(tab);
    setCalViewType(tab === 'adToBs' ? 'BS' : 'AD');
  };

  // Convert on trigger inputs change
  const handleConvertTrigger = () => {
    if (activeTab === 'adToBs') {
      performConversion('AD_TO_BS', adYear, adMonth, adDay);
    } else {
      performConversion('BS_TO_AD', bsYear, bsMonth, bsDay);
    }
  };

  // Set inputs to Today's date
  const setToday = () => {
    const today = new Date();
    setAdYear(today.getFullYear());
    setAdMonth(today.getMonth());
    setAdDay(today.getDate());

    const npToday = new NepaliDate(today);
    setBsYear(npToday.getYear());
    setBsMonth(npToday.getMonth());
    setBsDay(npToday.getDate());

    if (activeTab === 'adToBs') {
      performConversion('AD_TO_BS', today.getFullYear(), today.getMonth(), today.getDate());
    } else {
      performConversion('BS_TO_AD', npToday.getYear(), npToday.getMonth(), npToday.getDate());
    }
  };

  // Load initial settings and clocks
  useEffect(() => {
    // Load local storage notes
    try {
      const stored = localStorage.getItem('bishalcodes_calendar_notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load notes", e);
    }

    // Live clock in NPT (GMT +5:45)
    const updateNptClock = () => {
      const d = new Date();
      // Calculate NPT timezone offset (+5:45)
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const nptDate = new Date(utc + (3600000 * 5.75));
      const formattedTime = nptDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLiveNptClock(formattedTime);
    };

    updateNptClock();
    const interval = setInterval(updateNptClock, 1000);

    // Initial today's values
    const today = new Date();
    const npToday = new NepaliDate(today);
    const npDig = (num: number) => {
      const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      return num.toString().split('').map(c => map[parseInt(c, 10)] || c).join('');
    };

    setTodayDetails({
      ad: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      bs: `${DAYS_NE[npToday.getDay()]}, ${npDig(npToday.getDate())} ${NEPALI_MONTHS_NE[npToday.getMonth()]} ${npDig(npToday.getYear())}`
    });

    // Default conversion on load
    performConversion('AD_TO_BS', today.getFullYear(), today.getMonth(), today.getDate());

    return () => clearInterval(interval);
  }, [performConversion]);

  // Copy results to clipboard
  const handleCopy = () => {
    if (!convertedResult) return;
    const textToCopy = `BS: ${convertedResult.bsFormattedNE} (${convertedResult.bsFormattedEN}) | AD: ${convertedResult.adFormattedEN} - Converted via bishalcodes.com`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadDesktopApp = async (e: React.MouseEvent) => {
    // Open the modal
    setIsDownloadModalOpen(true);

    // Track the download
    try {
      const metricRef = doc(db, 'desktop_app_metrics', 'downloads');
      await updateDoc(metricRef, {
        count: increment(1)
      }).catch(async (err) => {
        if (err.code === 'not-found') {
          await setDoc(metricRef, { count: 1 });
        }
      });
    } catch (err) {
      console.error("Error tracking download", err);
    }
  };

  // Share converted date
  const handleShare = () => {
    if (!convertedResult) return;
    const shareData = {
      title: 'Nepali Date Conversion Result',
      text: `Converted Date:\nBikram Sambat: ${convertedResult.bsFormattedNE}\nGregorian: ${convertedResult.adFormattedEN}\n`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Export to calendar (.ics)
  const handleExportToCalendar = () => {
    if (!convertedResult) return;
    const adDate = convertedResult.adDate;
    const yyyy = adDate.getFullYear();
    const mm = String(adDate.getMonth() + 1).padStart(2, '0');
    const dd = String(adDate.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}${mm}${dd}`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bishal Codes//Nepali Date Converter//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${Date.now()}@bishalcodes.com
DTSTAMP:${formattedDate}T090000Z
DTSTART;VALUE=DATE:${formattedDate}
DTEND;VALUE=DATE:${formattedDate}
SUMMARY:Nepali Date: ${convertedResult.bsYear}-${convertedResult.bsMonth + 1}-${convertedResult.bsDay}
DESCRIPTION:Conversion Details:\\nBikram Sambat (Nepali): ${convertedResult.bsFormattedNE}\\nGregorian (AD): ${convertedResult.adFormattedEN}\\nGenerated via Bishal Codes Date Service.
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nepali-date-conversion-${convertedResult.bsYear}-${convertedResult.bsMonth + 1}-${convertedResult.bsDay}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Calendar Engine Helper
  const getDaysInMonth = (type: 'AD' | 'BS', year: number, monthIndex: number): number => {
    if (type === 'AD') {
      return new Date(year, monthIndex + 1, 0).getDate();
    } else {
      // Create NepaliDate instance and get days count
      try {
        const testNp = new NepaliDate(year, monthIndex, 1);
        // Find total days by checking maximum valid day count (iterative check)
        // Standard NepaliDate library handles this dynamically internally when doing dates logic,
        // let's discover the limit using standard Date operations
        let maxDays = 29;
        for (let checkDay = 29; checkDay <= 32; checkDay++) {
          try {
            const checkDate = new NepaliDate(year, monthIndex, checkDay);
            if (checkDate.getMonth() === monthIndex) {
              maxDays = checkDay;
            }
          } catch (_) {
            break;
          }
        }
        return maxDays;
      } catch (_) {
        return 30; // safety fallback
      }
    }
  };

  const getFirstDayOfWeek = (type: 'AD' | 'BS', year: number, monthIndex: number): number => {
    if (type === 'AD') {
      return new Date(year, monthIndex, 1).getDay();
    } else {
      try {
        const testNp = new NepaliDate(year, monthIndex, 1);
        return testNp.toJsDate().getDay();
      } catch (_) {
        return 0; // Sunday
      }
    }
  };

  const getEventForCell = useCallback((day: number) => {
    if (calViewType === 'BS') {
      return NE_MONTHS_EVENTS[calMonth]?.[day] || null;
    } else {
      try {
        // Convert Gregorian to Nepali Date
        const npDate = new NepaliDate(new Date(calYear, calMonth, day));
        const bm = npDate.getMonth();
        const bd = npDate.getDate();
        return NE_MONTHS_EVENTS[bm]?.[bd] || null;
      } catch (_) {
        return null;
      }
    }
  }, [calViewType, calYear, calMonth]);

  const getAdMonthEvents = useCallback((year: number, monthIndex: number) => {
    const events: Record<number, { title: string; isHoliday: boolean }> = {};
    const daysCount = new Date(year, monthIndex + 1, 0).getDate();
    for (let d = 1; d <= daysCount; d++) {
      try {
        const npDate = new NepaliDate(new Date(year, monthIndex, d));
        const bm = npDate.getMonth();
        const bd = npDate.getDate();
        const ev = NE_MONTHS_EVENTS[bm]?.[bd];
        if (ev) {
          events[d] = ev;
        }
      } catch (_) {}
    }
    return events;
  }, []);

  const getSecondaryDay = useCallback((day: number) => {
    try {
      if (calViewType === 'BS') {
        const npDate = new NepaliDate(calYear, calMonth, day);
        return npDate.toJsDate().getDate().toString();
      } else {
        const npDate = new NepaliDate(new Date(calYear, calMonth, day));
        return toNepaliStr(npDate.getDate());
      }
    } catch (_) {
      return '';
    }
  }, [calViewType, calYear, calMonth]);

  const saveNote = (key: string, text: string, color: string) => {
    const updated = { ...notes };
    if (!text.trim()) {
      delete updated[key];
    } else {
      updated[key] = { text: text.trim(), color };
    }
    setNotes(updated);
    try {
      localStorage.setItem('bishalcodes_calendar_notes', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save calendar notes", e);
    }

    // Trigger email notification if requested
    if (sendEmailCopy && emailInput.trim() && text.trim()) {
      fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'calendar-note',
          data: {
            email: emailInput.trim(),
            dateStr: convertedResult ? `${convertedResult.bsFormattedNE} (${convertedResult.adFormattedEN})` : key,
            noteText: text.trim(),
            noteColor: color
          }
        })
      }).then(res => res.json())
        .then(data => {
          if (!data.success) {
            console.error("Failed to send email note copy:", data.error);
          }
        }).catch(err => {
          console.error("Error sending email note copy:", err);
        });
    }

    setIsEditingNote(false);
  };

  const deleteNote = (key: string) => {
    const updated = { ...notes };
    delete updated[key];
    setNotes(updated);
    try {
      localStorage.setItem('bishalcodes_calendar_notes', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete calendar notes", e);
    }
    setIsEditingNote(false);
    setNoteText('');
  };

  const getNoteForCell = useCallback((day: number) => {
    try {
      if (calViewType === 'BS') {
        const key = `BS-${calYear}-${calMonth}-${day}`;
        return notes[key] || null;
      } else {
        const npDate = new NepaliDate(new Date(calYear, calMonth, day));
        const key = `BS-${npDate.getYear()}-${npDate.getMonth()}-${npDate.getDate()}`;
        return notes[key] || null;
      }
    } catch (_) {
      return null;
    }
  }, [calViewType, calYear, calMonth, notes]);

  const [hoveredDate, setHoveredDate] = useState<{
    day: number;
    bsDateStr: string;
    adDateStr: string;
    event: { title: string; isHoliday: boolean } | null;
    note: { text: string; color: string } | null;
    noteKey: string;
    x: number;
    y: number;
    colIndex: number;
  } | null>(null);

  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCellMouseEnter = (day: number, colIndex: number, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Calculate coordinates relative to the calendar container
    const rect = e.currentTarget.getBoundingClientRect();
    const parentContainer = document.getElementById('calendar-container-col');
    if (!parentContainer) return;
    const parentRect = parentContainer.getBoundingClientRect();
    
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top;
    
    try {
      let adDate: Date;
      let by: number;
      let bm: number;
      let bd: number;
      let dow: number;
      
      if (calViewType === 'BS') {
        const npDate = new NepaliDate(calYear, calMonth, day);
        adDate = npDate.toJsDate();
        by = calYear;
        bm = calMonth;
        bd = day;
        dow = npDate.getDay();
      } else {
        adDate = new Date(calYear, calMonth, day);
        const npDate = new NepaliDate(adDate);
        by = npDate.getYear();
        bm = npDate.getMonth();
        bd = npDate.getDate();
        dow = adDate.getDay();
      }
      
      const nepaliDigits = (num: number) => {
        const digMap = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return num.toString().split('').map(c => digMap[parseInt(c, 10)] || c).join('');
      };

      const bsDateStr = `${nepaliDigits(bd)} ${NEPALI_MONTHS_NE[bm]} ${nepaliDigits(by)}, ${DAYS_NE[dow]}`;
      const adDateStr = adDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const event = NE_MONTHS_EVENTS[bm]?.[bd] || null;
      const noteKey = `BS-${by}-${bm}-${bd}`;
      const note = notes[noteKey] || null;
      
      setHoveredDate({
        day,
        bsDateStr,
        adDateStr,
        event,
        note,
        noteKey,
        x,
        y,
        colIndex
      });
    } catch (_) {}
  };

  const handleCellMouseLeave = () => {
    // Debounce popover close
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDate(null);
    }, 200);
  };

  const keepPopoverOpen = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleAddNoteClickFromHover = (day: number) => {
    handleCalendarCellClick(day);
    setIsEditingNote(true);
    setHoveredDate(null);
  };

  // Generate calendar grid array
  const generateCalendarCells = () => {
    const daysCount = getDaysInMonth(calViewType, calYear, calMonth);
    const startWeekday = getFirstDayOfWeek(calViewType, calYear, calMonth);
    
    const cells = [];
    
    // Empty cells for alignment
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ day: null, isActive: false });
    }
    
    // Day cells
    const isMatchingSelectedDate = (day: number) => {
      if (!convertedResult) return false;
      if (calViewType === 'BS') {
        return convertedResult.bsYear === calYear && 
               convertedResult.bsMonth === calMonth && 
               convertedResult.bsDay === day;
      } else {
        return convertedResult.adDate.getFullYear() === calYear && 
               convertedResult.adDate.getMonth() === calMonth && 
               convertedResult.adDate.getDate() === day;
      }
    };

    for (let d = 1; d <= daysCount; d++) {
      cells.push({
        day: d,
        isActive: isMatchingSelectedDate(d)
      });
    }

    return cells;
  };

  const handleCalendarCellClick = (day: number) => {
    if (calViewType === 'BS') {
      setBsYear(calYear);
      setBsMonth(calMonth);
      setBsDay(day);
      performConversion('BS_TO_AD', calYear, calMonth, day);
    } else {
      setAdYear(calYear);
      setAdMonth(calMonth);
      setAdDay(day);
      performConversion('AD_TO_BS', calYear, calMonth, day);
    }
  };

  const shiftCalMonth = (direction: 'PREV' | 'NEXT') => {
    let nextMonth = calMonth;
    let nextYear = calYear;

    if (direction === 'PREV') {
      nextMonth = calMonth - 1;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear = calYear - 1;
      }
    } else {
      nextMonth = calMonth + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = calYear + 1;
      }
    }

    // Range checks
    if (calViewType === 'BS') {
      if (nextYear < minBsYear || nextYear > maxBsYear) return;
    } else {
      if (nextYear < minAdYear || nextYear > maxAdYear) return;
    }

    setCalMonth(nextMonth);
    setCalYear(nextYear);
  };

  const isLeapYear = (type: 'AD' | 'BS', year: number): boolean => {
    if (type === 'AD') {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    } else {
      // In Bikram Sambat, there are certain patterns, but we can compute it if Falgun month has 30 days (leap year equivalent)
      const falgunDays = getDaysInMonth('BS', year, 10);
      return falgunDays === 30;
    }
  };

  // Convert numbers to Nepali Unicode characters
  const toNepaliStr = (num: number): string => {
    const mapping = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(char => mapping[parseInt(char, 10)] || char).join('');
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Dynamic Upper Hero Deck */}
      <div className="w-full bg-gradient-to-br from-[#9c3e1b] via-[#7d2f12] to-[#5c2009] dark:from-[#521c0a] dark:via-[#3b1204] dark:to-[#210900] border-b border-[#7d2f12]/20 dark:border-[#210900]/40 pt-20 pb-8 md:pt-24 md:pb-12">
        <div className="w-full px-[5vw] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              <button 
                onClick={() => navigate('services')}
                className="inline-flex items-center gap-1.5 text-[#f5e5dd]/80 hover:text-white text-xs font-bold uppercase tracking-wider mb-2 cursor-pointer transition-colors border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm"
              >
                &larr; Back to Services
              </button>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-heading">
                Nepali Date Converter
              </h1>
              <p className="text-[#f5e5dd] dark:text-[#ebd6cc] text-sm md:text-base font-normal leading-relaxed">
                Convert dates between English (AD) and Nepali Bikram Sambat (BS) calendars. Pick any date, see today's Nepali date, and copy results in seconds.
              </p>
            </div>
            
            {/* Live Clock / Today Display Deck */}
            {todayDetails && (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 shadow-lg rounded-2xl p-6 min-w-[280px] w-full md:w-auto relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#e52521]/10 dark:bg-[#e52521]/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2 text-[#e52521] dark:text-[#d01f1c]">
                    <Clock size={16} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Nepal Time (NPT)</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {liveNptClock}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-bold">Today in BS</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{todayDetails.bs}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-bold">Today in AD</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{todayDetails.ad}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Converter Core Area */}
      <div className="w-full px-[5vw] mx-auto pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block - Controls & Conversion Engine: 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <div className="converter-card-white border shadow-md rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-2 gap-2">
                <button
                  onClick={() => handleTabChange('adToBs')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'adToBs'
                      ? 'converter-btn-primary shadow-sm border'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <ArrowRightLeft size={14} /> AD to BS (English to Nepali)
                </button>
                <button
                  onClick={() => handleTabChange('bsToAd')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'bsToAd'
                      ? 'converter-btn-primary shadow-sm border'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <ArrowRightLeft size={14} /> BS to AD (Nepali to English)
                </button>
              </div>

              {/* Converter Controls Form */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {activeTab === 'adToBs' ? (
                  /* AD TO BS FORM */
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select English Date (AD)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Year Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Year</span>
                        <select
                          value={adYear}
                          onChange={(e) => { setAdYear(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors"
                        >
                          {Array.from({ length: maxAdYear - minAdYear + 1 }, (_, i) => minAdYear + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      {/* Month Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Month</span>
                        <select
                          value={adMonth}
                          onChange={(e) => { setAdMonth(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors"
                        >
                          {GREGORIAN_MONTHS_EN.map((name, index) => (
                            <option key={index} value={index}>{name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Day Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Day</span>
                        <select
                          value={adDay}
                          onChange={(e) => { setAdDay(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors"
                        >
                          {Array.from({ length: getDaysInMonth('AD', adYear, adMonth) }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Native Datepicker picker */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <span className="text-xs text-slate-400 font-semibold">Or use standard picker:</span>
                        <input
                          type="date"
                          value={`${adYear}-${String(adMonth + 1).padStart(2, '0')}-${String(adDay).padStart(2, '0')}`}
                          min={`${minAdYear}-01-01`}
                          max={`${maxAdYear}-12-31`}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const d = new Date(e.target.value);
                            setAdYear(d.getFullYear());
                            setAdMonth(d.getMonth());
                            setAdDay(d.getDate());
                          }}
                          className="px-3 py-1.5 rounded-lg converter-input border text-xs font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BS TO AD FORM */
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Select Nepali Date (BS)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Year Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Year (साल)</span>
                        <select
                          value={bsYear}
                          onChange={(e) => { setBsYear(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors"
                        >
                          {Array.from({ length: maxBsYear - minBsYear + 1 }, (_, i) => minBsYear + i).map(year => (
                            <option key={year} value={year}>{year} ({toNepaliStr(year)})</option>
                          ))}
                        </select>
                      </div>

                      {/* Month Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Month (महिना)</span>
                        <select
                          value={bsMonth}
                          onChange={(e) => { setBsMonth(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors"
                        >
                          {NEPALI_MONTHS_NE.map((name, index) => (
                            <option key={index} value={index}>{name} ({NEPALI_MONTHS_EN[index]})</option>
                          ))}
                        </select>
                      </div>

                      {/* Day Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Day (गते)</span>
                        <select
                          value={bsDay}
                          onChange={(e) => { setBsDay(Number(e.target.value)); }}
                          className="w-full px-3 py-2.5 rounded-xl converter-input border text-sm font-semibold outline-none focus:border-[#9c3e1b] focus:ring-1 focus:ring-[#9c3e1b] transition-colors"
                        >
                          {Array.from({ length: getDaysInMonth('BS', bsYear, bsMonth) }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day} ({toNepaliStr(day)})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleConvertTrigger}
                    className="flex-grow-[2] bg-[#9c3e1b] hover:bg-[#7d2f12] text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-300 shadow-md hover:shadow-[#5c2009]/20 active:scale-98 animate-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowRightLeft size={16} /> Convert Date
                  </button>
                  <button
                    onClick={setToday}
                    className="flex-grow-[1] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold py-3 px-5 rounded-xl text-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300"
                    title="Jump to Today's Date"
                  >
                    <RotateCcw size={16} /> Today
                  </button>
                </div>

                {/* Output Conversion Card */}
                {convertedResult && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
                    {convertedResult.error ? (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                        {convertedResult.error}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="converter-result-box border rounded-2xl p-5 relative overflow-hidden group">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Bikram Sambat Section */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-[#9c3e1b] dark:text-[#ebd6cc] uppercase tracking-widest font-extrabold block">Bikram Sambat (Nepali)</span>
                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {convertedResult.bsFormattedNE}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {convertedResult.bsFormattedEN} ({toNepaliStr(convertedResult.bsYear)}-{toNepaliStr(convertedResult.bsMonth + 1).padStart(2, '०')}-{toNepaliStr(convertedResult.bsDay).padStart(2, '०')})
                              </div>
                            </div>
                            
                            {/* Gregorian Section */}
                            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                              <span className="text-[10px] text-[#9c3e1b] dark:text-[#ebd6cc] uppercase tracking-widest font-extrabold block">Gregorian (English)</span>
                              <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {convertedResult.adFormattedEN}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {convertedResult.adDate.getFullYear()}-{String(convertedResult.adDate.getMonth() + 1).padStart(2, '0')}-{String(convertedResult.adDate.getDate()).padStart(2, '0')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Event Details Card */}
                        {(() => {
                          const event = NE_MONTHS_EVENTS[convertedResult.bsMonth]?.[convertedResult.bsDay];
                          if (!event) return null;
                          return (
                            <div className={`p-4 rounded-xl border text-left ${
                              event.isHoliday 
                                ? 'bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300' 
                                : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-70">
                                  {event.isHoliday ? 'Government Holiday (सार्वजनिक बिदा)' : 'Cultural / Special Event'}
                                </span>
                                <span className="text-sm font-semibold leading-snug">
                                  {event.title}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* User Personal Notes Section */}
                        {(() => {
                          const noteKey = `BS-${convertedResult.bsYear}-${convertedResult.bsMonth}-${convertedResult.bsDay}`;
                          const activeNote = notes[noteKey];
                          
                          if (isEditingNote) {
                            return (
                              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 text-left shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                    {activeNote ? 'Edit Note' : 'Add Personal Note'}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                    {convertedResult.bsFormattedEN}
                                  </span>
                                </div>
                                
                                {/* Color Picker */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Select Highlight Color</span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {Object.keys(NOTE_COLORS).map(colorName => {
                                      const col = NOTE_COLORS[colorName];
                                      return (
                                        <button
                                          key={colorName}
                                          onClick={() => setNoteColor(colorName)}
                                          className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${col.dot} ${
                                            noteColor === colorName ? 'border-slate-900 dark:border-white scale-110 shadow-sm' : 'border-transparent'
                                          }`}
                                          title={colorName}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Text Editor */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Note Description</span>
                                  <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value.substring(0, 500))}
                                    placeholder="Add meetings, birthdays, reminders, lists..."
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors placeholder-slate-400"
                                  />
                                  <div className="text-[10px] text-slate-400 font-medium text-right font-mono">
                                    {noteText.length}/500 chars
                                  </div>
                                </div>

                                {/* Email copy settings */}
                                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={sendEmailCopy}
                                      onChange={(e) => setSendEmailCopy(e.target.checked)}
                                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-[#e52521] focus:ring-[#e52521] cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      Email me a copy of this note (ईमेल पठाउनुहोस्)
                                    </span>
                                  </label>

                                  {sendEmailCopy && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Email Address</span>
                                      <input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium outline-none focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] transition-colors placeholder-slate-400"
                                        required
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => saveNote(noteKey, noteText, noteColor)}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-650 dark:hover:bg-[#d01f1c] text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                                  >
                                    Save Note
                                  </button>
                                  {activeNote && (
                                    <button
                                      onClick={() => deleteNote(noteKey)}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-2 px-4 rounded-xl text-xs border border-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 dark:border-rose-900/40 transition-colors cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setIsEditingNote(false);
                                      setNoteText('');
                                    }}
                                    className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-3.5 shadow-sm">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>My Notes (मेरो नोट)</span>
                                </h4>
                                {!activeNote && (
                                  <button
                                    onClick={() => {
                                      setIsEditingNote(true);
                                      setNoteText('');
                                      setNoteColor('default');
                                    }}
                                    className="text-xs font-bold text-[#e52521] dark:text-[#d01f1c] hover:text-indigo-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                                  >
                                    + Add Note
                                  </button>
                                )}
                              </div>

                              {activeNote ? (
                                <div className={`p-4 rounded-xl border space-y-3 ${NOTE_COLORS[activeNote.color]?.previewBg || NOTE_COLORS.default.previewBg} ${NOTE_COLORS[activeNote.color]?.border || NOTE_COLORS.default.border}`}>
                                  <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                                    {activeNote.text}
                                  </p>
                                  <div className="flex items-center gap-2 border-t border-black/5 dark:border-white/5 pt-2.5">
                                    <button
                                      onClick={() => {
                                        setIsEditingNote(true);
                                        setNoteText(activeNote.text);
                                        setNoteColor(activeNote.color);
                                      }}
                                      className="text-[10px] font-bold text-[#e52521] dark:text-[#d01f1c] hover:text-indigo-700 transition-colors cursor-pointer"
                                    >
                                      Edit Note
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
                                    <button
                                      onClick={() => deleteNote(noteKey)}
                                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-4 text-center space-y-1">
                                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                    You don't have notes on this day.
                                  </p>
                                  <p className="text-[10px] text-slate-400 leading-tight max-w-[85%] mx-auto">
                                    Take notes on birthdays, meetings, bills to pay, or reminders to stay organized.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Conversion Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            <span>{copied ? 'Copied!' : 'Copy Info'}</span>
                          </button>
                          
                          <button
                            onClick={handleExportToCalendar}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <Download size={14} />
                            <span>Add to Calendar</span>
                          </button>

                          <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <Share2 size={14} />
                            <span>Share</span>
                          </button>

                          <button
                            onClick={() => navigate('widgets')}
                            className="inline-flex items-center gap-1.5 bg-[#9c3e1b]/10 hover:bg-[#9c3e1b]/20 text-[#9c3e1b] dark:bg-[#ebd6cc]/10 dark:text-[#ebd6cc] text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <Code size={14} />
                            <span>Embed Widget &lt;/&gt;</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
            
            {/* Calendar details widgets */}
            {convertedResult && !convertedResult.error && (
              <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Leap Year Status</div>
                  <div className="text-sm font-semibold">
                    {calViewType === 'BS' ? (
                      isLeapYear('BS', convertedResult.bsYear) ? 'BS Leap Year (अधिक वर्ष)' : 'BS Regular Year'
                    ) : (
                      isLeapYear('AD', convertedResult.adDate.getFullYear()) ? 'AD Leap Year' : 'AD Regular Year'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {calViewType === 'BS' 
                      ? 'Based on transit cycle of solar months in Bikram Sambat.' 
                      : 'Every 4 years (divisible by 4, except century years not divisible by 400).'}
                  </p>
                </div>
                
                <div className="space-y-1 sm:border-l border-slate-200 dark:border-slate-800/80 sm:pl-6">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Month Length</div>
                  <div className="text-sm font-semibold">
                    {getDaysInMonth(calViewType, calYear, calMonth)} Days
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {calViewType === 'BS' 
                      ? `Total days in ${NEPALI_MONTHS_EN[calMonth]} of BS ${calYear}.`
                      : `Total days in ${GREGORIAN_MONTHS_EN[calMonth]} of AD ${calYear}.`}
                  </p>
                </div>

                <div className="space-y-1 sm:border-l border-slate-200 dark:border-slate-800/80 sm:pl-6">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Epoch Information</div>
                  <div className="text-sm font-semibold">
                    BS ≈ AD + 56.7 Years
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Bikram Sambat is approximately 56 years 8 months ahead of the Gregorian calendar.
                  </p>
                </div>
              </div>
            )}



          </div>

          {/* Right Block - Interactive Calendar Widget: 5 cols */}
          <div id="calendar-container-col" className="lg:col-span-5 converter-card-white border shadow-md rounded-2xl backdrop-blur-sm relative">
            
            {/* Calendar Widget Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between rounded-t-2xl">
              
              {/* Type Switch Button */}
              <button
                onClick={() => setCalViewType(calViewType === 'BS' ? 'AD' : 'BS')}
                className="inline-flex items-center gap-1 select-red-brown border text-xs font-bold px-3 py-1.5 rounded-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <CalendarIcon size={12} />
                <span>Show {calViewType === 'BS' ? 'English (AD)' : 'Nepali (BS)'}</span>
              </button>

              {/* Month/Year selector navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftCalMonth('PREV')}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none text-center min-w-[100px]">
                  {calViewType === 'BS' 
                    ? `${NEPALI_MONTHS_NE[calMonth]} ${toNepaliStr(calYear)}`
                    : `${GREGORIAN_MONTHS_EN[calMonth].substring(0, 3)} ${calYear}`}
                </span>
                <button
                  onClick={() => shiftCalMonth('NEXT')}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="p-5">
              
              {/* Calendar Info bar */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-center mb-4">
                {calViewType === 'BS' ? 'Bikram Sambat Calendar Grid' : 'Gregorian Calendar Grid'}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-t border-l border-black/25 dark:border-white/10 text-center text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/10">
                {calViewType === 'BS' ? (
                  DAYS_NE_SHORT.map((day, i) => (
                    <div key={i} className="py-2.5 border-r border-b border-black/25 dark:border-white/10">{day}</div>
                  ))
                ) : (
                  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                    <div key={i} className="py-2.5 border-r border-b border-black/25 dark:border-white/10">{day}</div>
                  ))
                )}
              </div>

              {/* Calendar Cells */}
              <div className="grid grid-cols-7 border-l border-black/25 dark:border-white/10">
                {generateCalendarCells().map((cell, index) => {
                  if (cell.day === null) {
                    return <div key={index} className="aspect-square border-r border-b border-black/25 dark:border-white/10 bg-slate-50/20 dark:bg-slate-900/5" />;
                  }

                  const isSaturday = index % 7 === 6;
                  const event = getEventForCell(cell.day);
                  const isHoliday = event?.isHoliday || isSaturday;
                  const secondaryDay = getSecondaryDay(cell.day);
                  const note = getNoteForCell(cell.day);

                  return (
                    <button
                      key={index}
                      onClick={() => handleCalendarCellClick(cell.day!)}
                      onMouseEnter={(e) => handleCellMouseEnter(cell.day!, index % 7, e)}
                      onMouseLeave={handleCellMouseLeave}
                      title={event ? event.title : undefined}
                      className={`aspect-square border-r border-b border-black/25 dark:border-white/10 text-xs font-semibold flex flex-col items-center justify-between p-1 md:p-1.5 transition-all cursor-pointer relative ${
                        cell.isActive
                          ? 'bg-[#7d2f12] text-white font-bold scale-100'
                          : note
                          ? `${NOTE_COLORS[note.color]?.bg || NOTE_COLORS.default.bg} ${isHoliday ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'} hover:bg-slate-100/50 dark:hover:bg-slate-800/40`
                          : isHoliday
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {/* Main Day number (Top Left) */}
                      <span className="text-xs sm:text-sm font-bold mt-0.5 self-start ml-0.5">
                        {calViewType === 'BS' ? toNepaliStr(cell.day) : cell.day}
                      </span>
                      
                      {/* Secondary Day number (Top Right) */}
                      <span className={`absolute top-1 right-1.5 text-[8px] md:text-[9.5px] font-bold ${
                        cell.isActive ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {secondaryDay}
                      </span>

                      {/* Event short text (Bottom) */}
                      {event ? (
                        <span className={`text-[7.5px] md:text-[8.5px] leading-tight font-bold truncate max-w-[92%] mb-0.5 ${
                          cell.isActive
                            ? 'text-white/95'
                            : event.isHoliday
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-500'
                        }`}>
                          {event.title.split('/')[0].split('(')[0].trim()}
                        </span>
                      ) : (
                        <span className="h-3" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-end text-[11px] text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <span>{calViewType === 'BS' ? `${NEPALI_MONTHS_EN[calMonth]} (${NEPALI_MONTHS_NE[calMonth]})` : GREGORIAN_MONTHS_EN[calMonth]}</span>
              </div>

            </div>

            {/* Monthly Events List */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/10 dark:bg-slate-900/5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                Events & Holidays in {calViewType === 'BS' ? NEPALI_MONTHS_EN[calMonth] : GREGORIAN_MONTHS_EN[calMonth]}
              </h4>
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                {Object.keys(calViewType === 'BS' 
                  ? (NE_MONTHS_EVENTS[calMonth] || {}) 
                  : getAdMonthEvents(calYear, calMonth)
                ).length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 italic">No major holidays or events recorded for this month.</p>
                ) : (
                  Object.entries(calViewType === 'BS'
                    ? (NE_MONTHS_EVENTS[calMonth] || {})
                    : getAdMonthEvents(calYear, calMonth)
                  ).map(([d, ev]) => (
                    <div key={d} className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        ev.isHoliday 
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {calViewType === 'BS' ? `${toNepaliStr(Number(d))} गते` : `Day ${d}`}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-left">
                        {ev.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Embed widgets & Desktop App discoverability promo banner */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col sm:flex-row gap-3 items-center justify-around">
              <button
                onClick={() => navigate('widgets')}
                className="text-[11px] font-bold text-[#9c3e1b] hover:text-[#7d2f12] dark:text-[#ebd6cc] dark:hover:text-[#f3e6e0] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Code size={13} />
                <span>Get Free Widgets &lt;/&gt;</span>
              </button>
              <div className="hidden sm:block text-slate-300 dark:text-slate-700 text-xs">|</div>
              <div className="flex flex-col items-center gap-0.5">
                <a
                  href="https://apps.microsoft.com/detail/9PJVV2J32KNP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#e52521] hover:text-indigo-800 dark:text-[#d01f1c] dark:hover:text-indigo-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span className="text-sm">🛍️</span>
                  <span>Get Nepali Calendar on Microsoft Store</span>
                </a>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Safe background updates & easy installation</span>
              </div>
            </div>

            {/* Popover Hover Card */}
            {hoveredDate && (
              <div 
                className="absolute z-[150] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 w-[290px] grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 text-left pointer-events-auto transition-all"
                style={{
                  left: `${hoveredDate.x}px`,
                  top: `${hoveredDate.y}px`,
                  transform: hoveredDate.y < 120 
                    ? (hoveredDate.colIndex === 0 || hoveredDate.colIndex === 1 ? 'translate(-15%, 15px)' : hoveredDate.colIndex === 5 || hoveredDate.colIndex === 6 ? 'translate(-85%, 15px)' : 'translate(-50%, 15px)')
                    : (hoveredDate.colIndex === 0 || hoveredDate.colIndex === 1 ? 'translate(-15%, -105%)' : hoveredDate.colIndex === 5 || hoveredDate.colIndex === 6 ? 'translate(-85%, -105%)' : 'translate(-50%, -105%)')
                }}
                onMouseEnter={keepPopoverOpen}
                onMouseLeave={handleCellMouseLeave}
              >
                {/* Left Panel: Date & Event */}
                <div className="pr-2.5 flex flex-col justify-between min-h-[90px]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">
                      {hoveredDate.bsDateStr}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 block">
                      {hoveredDate.adDateStr}
                    </span>
                  </div>
                  
                  {hoveredDate.event ? (
                    <div className={`mt-2 p-1.5 rounded text-[8.5px] font-bold leading-tight ${
                      hoveredDate.event.isHoliday 
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                        : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                    }`}>
                      {hoveredDate.event.title.split('/')[0].trim()}
                    </div>
                  ) : (
                    <span className="h-4" />
                  )}
                </div>

                {/* Right Panel: Notes */}
                <div className="pl-2.5 flex flex-col justify-between min-h-[90px] text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                      My Note (मेरो नोट)
                    </span>
                    {hoveredDate.note ? (
                      <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {hoveredDate.note.text}
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 italic">No notes on this day.</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleAddNoteClickFromHover(hoveredDate.day)}
                    className="mt-2 w-full text-center py-1 bg-slate-900 dark:bg-indigo-650 hover:bg-slate-800 text-white rounded text-[9px] font-bold transition-colors cursor-pointer"
                  >
                    {hoveredDate.note ? 'Edit Note >' : 'Add Note >'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
      
      <DesktopDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />
    </div>
  );
};

export default DateConverter;
