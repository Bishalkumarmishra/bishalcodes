import React, { useState, useEffect, useRef } from 'react';
import NepaliDate from 'nepali-date-converter';
import { 
  ChevronLeft, ChevronRight, Smartphone, Calendar as CalendarIcon, 
  Home, Newspaper, Sparkles, User, Sun, Moon, Search, Menu, Bell,
  ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, Layers, ArrowUpRight,
  TrendingUp, Clock, MapPin, Heart, Share2, Compass, ChevronDown, Download,
  Grid, Radio, Bookmark, HelpCircle, Code, Cpu, Check, ExternalLink, X, Plus, Scan,
  ArrowLeftRight, Pencil, Trash2, MapPinIcon, BellRing, CloudOff, Cloud,
  Crown, Package, Globe, Type, MessageSquare, Users, UserCheck, Phone, Star, LogOut,
  ArrowLeft, Activity, Shield, FileText, Send, Volume2, Play, Pause, DollarSign,
  Coins, Zap, HeartPulse, Info, SunMoon, Palette
} from 'lucide-react';
// @ts-ignore
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
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

const EN_MONTHS_EVENTS: Record<number, Record<number, { title: string; isHoliday: boolean; desc?: string }>> = {
  0: { 1: { title: "New Year / May Day", isHoliday: true }, 11: { title: "Loktantra Diwas", isHoliday: true } },
  1: { 15: { title: "Republic Day", isHoliday: true } },
  2: { 1: { title: "Mithun Sankranti", isHoliday: false }, 6: { title: "Bhoto Jatra", isHoliday: true }, 29: { title: "Bhanu Jayanti", isHoliday: false } },
  3: { 1: { title: "Saune Sankranti", isHoliday: false }, 27: { title: "Janai Purnima / Raksha Bandhan", isHoliday: true }, 28: { title: "Gai Jatra", isHoliday: true } },
  4: { 3: { title: "Krishna Janmashtami", isHoliday: true }, 4: { title: "Gaura Parba / Dar Khane Din", isHoliday: true }, 5: { title: "Haritalika Teej Vrata", isHoliday: true }, 21: { title: "Human Trafficking Day", isHoliday: false }, 22: { title: "Aja Ekadashi Vrata", isHoliday: false }, 24: { title: "Gen-Z Sahid Diwas", isHoliday: false }, 25: { title: "World Suicide Prevention Day", isHoliday: false } },
  5: { 3: { title: "Indra Jatra", isHoliday: true }, 16: { title: "World Tourism Day", isHoliday: false }, 28: { title: "Ghatasthapana (Dashain Begins)", isHoliday: true } },
  6: { 4: { title: "Fulpati", isHoliday: true }, 5: { title: "Maha Ashtami", isHoliday: true }, 6: { title: "Mahanavami", isHoliday: true }, 7: { title: "Vijaya Dashami", isHoliday: true }, 28: { title: "Laxmi Puja", isHoliday: true }, 30: { title: "Bhai Tika", isHoliday: true } },
  7: { 3: { title: "Chhath Parba", isHoliday: true }, 24: { title: "Udhauli Parba / Dhanya Purnima", isHoliday: true } },
  8: { 10: { title: "Christmas Day", isHoliday: true }, 15: { title: "Tamu Lhosar", isHoliday: true }, 29: { title: "Prithvi Jayanti", isHoliday: false } },
  9: { 1: { title: "Maghe Sankranti", isHoliday: true }, 16: { title: "Martyrs' Day", isHoliday: false }, 21: { title: "Sonam Lhosar", isHoliday: true } },
  10: { 7: { title: "Saraswati Puja / Vasant Panchami", isHoliday: true }, 19: { title: "Democracy Day", isHoliday: true }, 24: { title: "Maha Shivaratri", isHoliday: true } },
  11: { 1: { title: "Fagu Purnima (Holi)", isHoliday: true }, 25: { title: "Ram Navami", isHoliday: true } }
};

const SAAIT_TITLE_MAP_EN: Record<string, string> = {
  "अन्नप्राशन": "Pasni (Weaning Ceremony)",
  "व्यापारिक प्रतिष्ठान प्रारम्भ": "Business Inauguration",
  "रुद्री जुर्ने": "Rudri Puja Auspicious",
  "अग्नि जुर्ने": "Agni Jurne Auspicious",
  "विवाह साइत": "Marriage Auspicious",
  "व्रतबन्ध": "Bratabandha (Sacred Thread)",
  "गृह प्रवेश": "Housewarming (Griha Pravesh)"
};

const SAAIT_DATA: Record<number, { title: string; days: number[] }[]> = {
  0: [
    { title: "अन्नप्राशन", days: [3, 8, 15, 24] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [2, 7, 11, 18, 26] },
    { title: "रुद्री जुर्ने", days: [1, 4, 6, 9, 12, 14, 17, 20, 22, 25, 28, 30] },
    { title: "अग्नि जुर्ने", days: [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29] },
    { title: "विवाह साइत", days: [5, 12, 18, 22, 27] },
    { title: "व्रतबन्ध", days: [7, 14, 21] },
    { title: "गृह प्रवेश", days: [8, 15, 23] }
  ],
  1: [
    { title: "अन्नप्राशन", days: [4, 9, 16, 27] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [1, 5, 12, 20, 28] },
    { title: "रुद्री जुर्ने", days: [2, 3, 7, 10, 13, 15, 18, 21, 23, 26, 29, 31] },
    { title: "अग्नि जुर्ने", days: [1, 4, 6, 8, 11, 14, 17, 19, 22, 25, 28, 30] },
    { title: "विवाह साइत", days: [6, 11, 17, 23, 28] },
    { title: "व्रतबन्ध", days: [8, 15, 22] },
    { title: "गृह प्रवेश", days: [9, 16, 24] }
  ],
  2: [
    { title: "अन्नप्राशन", days: [2, 11, 18, 25] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [3, 8, 14, 22, 29] },
    { title: "रुद्री जुर्ने", days: [1, 5, 8, 11, 14, 16, 19, 22, 24, 27, 30] },
    { title: "अग्नि जुर्ने", days: [3, 6, 9, 12, 15, 18, 20, 23, 26, 28, 31] },
    { title: "विवाह साइत", days: [4, 10, 16, 21, 29] },
    { title: "व्रतबन्ध", days: [6, 13, 20] },
    { title: "गृह प्रवेश", days: [7, 14, 22] }
  ],
  3: [
    { title: "अन्नप्राशन", days: [5, 12, 19, 28] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [2, 6, 13, 21, 27] },
    { title: "रुद्री जुर्ने", days: [2, 4, 7, 10, 12, 15, 18, 21, 24, 26, 29, 31] },
    { title: "अग्नि जुर्ने", days: [1, 3, 6, 9, 11, 14, 17, 20, 22, 25, 28, 30] },
    { title: "विवाह साइत", days: [8, 14, 20, 26] },
    { title: "व्रतबन्ध", days: [9, 16, 23] },
    { title: "गृह प्रवेश", days: [10, 17, 25] }
  ],
  4: [
    { title: "अन्नप्राशन", days: [1, 3, 10, 29] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [1, 4, 14, 19, 28, 29] },
    { title: "रुद्री जुर्ने", days: [1, 2, 3, 5, 8, 9, 10, 11, 13, 16, 17, 19, 22, 23, 24, 28, 31] },
    { title: "अग्नि जुर्ने", days: [1, 3, 5, 8, 9, 11, 13, 14, 16, 18, 20, 21, 23, 25, 28, 30] },
    { title: "विवाह साइत", days: [3, 9, 15, 21, 27] },
    { title: "व्रतबन्ध", days: [5, 12, 19] },
    { title: "गृह प्रवेश", days: [6, 13, 21] }
  ],
  5: [
    { title: "अन्नप्राशन", days: [2, 8, 14, 23] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [3, 7, 12, 18, 25] },
    { title: "रुद्री जुर्ने", days: [1, 4, 6, 8, 11, 14, 17, 19, 22, 25, 27, 30] },
    { title: "अग्नि जुर्ने", days: [2, 5, 7, 10, 13, 15, 18, 21, 23, 26, 29] },
    { title: "विवाह साइत", days: [4, 10, 16, 22, 28] },
    { title: "व्रतबन्ध", days: [6, 13, 20] },
    { title: "गृह प्रवेश", days: [7, 14, 22] }
  ],
  6: [
    { title: "अन्नप्राशन", days: [4, 10, 17, 26] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [2, 8, 15, 21, 29] },
    { title: "रुद्री जुर्ने", days: [2, 5, 7, 9, 12, 15, 18, 20, 23, 26, 28, 30] },
    { title: "अग्नि जुर्ने", days: [1, 3, 6, 8, 11, 14, 16, 19, 22, 24, 27, 29] },
    { title: "विवाह साइत", days: [5, 11, 17, 23, 29] },
    { title: "व्रतबन्ध", days: [7, 14, 21] },
    { title: "गृह प्रवेश", days: [8, 15, 23] }
  ],
  7: [
    { title: "अन्नप्राशन", days: [3, 9, 16, 25] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [1, 6, 13, 20, 27] },
    { title: "रुद्री जुर्ने", days: [1, 3, 6, 8, 11, 13, 16, 19, 21, 24, 27, 29] },
    { title: "अग्नि जुर्ने", days: [2, 4, 7, 9, 12, 14, 17, 20, 22, 25, 28, 30] },
    { title: "विवाह साइत", days: [4, 9, 15, 21, 26] },
    { title: "व्रतबन्ध", days: [6, 13, 20] },
    { title: "गृह प्रवेश", days: [7, 14, 22] }
  ],
  8: [
    { title: "अन्नप्राशन", days: [5, 11, 18, 27] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [3, 7, 14, 22, 28] },
    { title: "रुद्री जुर्ने", days: [2, 4, 7, 10, 12, 15, 17, 20, 23, 25, 28, 30] },
    { title: "अग्नि जुर्ने", days: [1, 3, 6, 8, 11, 13, 16, 18, 21, 24, 26, 29] },
    { title: "विवाह साइत", days: [7, 13, 19, 25] },
    { title: "व्रतबन्ध", days: [8, 15, 22] },
    { title: "गृह प्रवेश", days: [9, 16, 24] }
  ],
  9: [
    { title: "अन्नप्राशन", days: [2, 8, 15, 24] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [1, 5, 11, 19, 26] },
    { title: "रुद्री जुर्ने", days: [1, 3, 6, 9, 11, 14, 16, 19, 22, 24, 27, 29] },
    { title: "अग्नि जुर्ने", days: [2, 4, 7, 10, 12, 15, 17, 20, 23, 25, 28, 30] },
    { title: "विवाह साइत", days: [3, 9, 14, 20, 26] },
    { title: "व्रतबन्ध", days: [5, 12, 19] },
    { title: "गृह प्रवेश", days: [6, 13, 21] }
  ],
  10: [
    { title: "अन्नप्राशन", days: [4, 10, 17, 26] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [2, 7, 13, 21, 28] },
    { title: "रुद्री जुर्ने", days: [2, 5, 8, 10, 13, 15, 18, 21, 23, 26, 28, 30] },
    { title: "अग्नि जुर्ने", days: [1, 4, 6, 9, 11, 14, 16, 19, 22, 24, 27, 29] },
    { title: "विवाह साइत", days: [5, 11, 17, 23, 28] },
    { title: "व्रतबन्ध", days: [7, 14, 21] },
    { title: "गृह प्रवेश", days: [8, 15, 23] }
  ],
  11: [
    { title: "अन्नप्राशन", days: [3, 9, 16, 25] },
    { title: "व्यापारिक प्रतिष्ठान प्रारम्भ", days: [1, 6, 12, 19, 27] },
    { title: "रुद्री जुर्ने", days: [1, 4, 7, 9, 12, 14, 17, 20, 22, 25, 27, 30] },
    { title: "अग्नि जुर्ने", days: [2, 5, 8, 10, 13, 15, 18, 21, 23, 26, 28, 31] },
    { title: "विवाह साइत", days: [4, 10, 15, 21, 27] },
    { title: "व्रतबन्ध", days: [6, 13, 20] },
    { title: "गृह प्रवेश", days: [7, 14, 22] }
  ]
};

const TITHI_NAMES = [
  "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी", "षष्ठी",
  "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा", "औंसी"
];

function getTithiForDay(monthIndex: number, day: number) {
  const monthNameNe = NEPALI_MONTHS_NE[monthIndex];
  const paksha = day <= 15 ? "शुक्ल" : "कृष्ण";
  const tithiIndex = (day - 1) % 15;
  const tithiName = day === 15 ? "पूर्णिमा" : (day === 30 || day === 29) ? "औंसी" : TITHI_NAMES[tithiIndex];
  return `${monthNameNe} ${paksha} ${tithiName}`;
}

function getRelativeDaysText(calYear: number, calMonth: number, day: number, todayBs: { year: number; month: number; day: number }, lang: 'en' | 'ne' = 'en') {
  const mapDigits = (n: number) => {
    if (lang !== 'ne') return n.toString();
    const m: Record<string, string> = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
    return n.toString().split('').map(c => m[c] || c).join('');
  };

  if (calYear < todayBs.year || (calYear === todayBs.year && calMonth < todayBs.month)) {
    const diff = (todayBs.month - calMonth) * 30 + (todayBs.day - day);
    return lang === 'ne' ? `${mapDigits(diff)} दिन पहिले` : `${diff} days ago`;
  }
  if (calYear > todayBs.year || (calYear === todayBs.year && calMonth > todayBs.month)) {
    const diff = (calMonth - todayBs.month) * 30 + (day - todayBs.day);
    return lang === 'ne' ? `${mapDigits(diff)} दिनमा` : `In ${diff} days`;
  }
  const diff = day - todayBs.day;
  if (diff === 0) return lang === 'ne' ? "आज" : "Today";
  if (diff === 1) return lang === 'ne' ? "भोलि" : "Tomorrow";
  if (diff < 0) return lang === 'ne' ? `${mapDigits(Math.abs(diff))} दिन पहिले` : `${Math.abs(diff)} days ago`;
  return lang === 'ne' ? `${mapDigits(diff)} दिनमा` : `In ${diff} days`;
}

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mp_theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [appLang, setAppLang] = useState<'en' | 'ne'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mp_lang') as 'en' | 'ne') || 'ne';
    }
    return 'ne';
  });
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mp_text_size') as 'small' | 'medium' | 'large') || 'medium';
    }
    return 'medium';
  });

  const [activeFullScreenPage, setActiveFullScreenPage] = useState<'about' | 'privacy' | 'contact' | 'nepse' | 'health' | 'radio' | 'gold' | null>(null);
  const [profileModalView, setProfileModalView] = useState<'account' | 'how-to' | 'messages' | null>(null);
  const [playingRadio, setPlayingRadio] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '', sent: false });
  const [healthBmi, setHealthBmi] = useState<{ height: number; weight: number; result: number | null }>({ height: 170, weight: 65, result: null });
  const [showSplash, setShowSplash] = useState<boolean>(true);
  // Live market data
  const [nepseData, setNepseData] = useState<any>(null);
  const [goldData, setGoldData] = useState<any>(null);
  const [radioStations, setRadioStations] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Isolated theme state for Mero Patro widget only
  }, [appTheme]);

  const toggleTheme = () => {
    setAppTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') localStorage.setItem('mp_theme', next);
      return next;
    });
  };

  const toggleLang = () => {
    setAppLang(prev => {
      const next = prev === 'en' ? 'ne' : 'en';
      if (typeof window !== 'undefined') localStorage.setItem('mp_lang', next);
      return next;
    });
  };

  const cycleTextSize = () => {
    setTextSize(prev => {
      const next = prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small';
      if (typeof window !== 'undefined') localStorage.setItem('mp_text_size', next);
      return next;
    });
  };

  const t = {
    home: appLang === 'ne' ? 'गृहपृष्ठ' : 'Home',
    calendar: appLang === 'ne' ? 'पात्रो' : 'Calendar',
    convert: appLang === 'ne' ? 'रूपान्तरण' : 'Convert',
    news: appLang === 'ne' ? 'समाचार' : 'News',
    forYou: appLang === 'ne' ? 'तपाईंको लागि' : 'For You',
    appName: appLang === 'ne' ? 'मेरो पात्रो' : 'MERO PATRO',
    services: appLang === 'ne' ? 'मेरो सेवाहरू' : 'Mero Services',
    notes: appLang === 'ne' ? 'नोट्स' : 'Notes',
    holidays: appLang === 'ne' ? 'बिदाहरू' : 'Holidays',
    saait: appLang === 'ne' ? 'साइत' : 'Saait',
    addNotes: appLang === 'ne' ? 'नोट थप्नुहोस्' : 'Add Notes',
    upcomingEvents: appLang === 'ne' ? 'आगामी पर्वहरू' : 'Upcoming Events',
    viewAll: appLang === 'ne' ? 'सबै हेर्नुहोस्' : 'View All',
    search: appLang === 'ne' ? 'खोज्नुहोस्...' : 'Search Features...',
    profile: appLang === 'ne' ? 'प्रोफाइल' : 'Profile',
    membership: appLang === 'ne' ? 'सदस्यता' : 'Membership',
    orders: appLang === 'ne' ? 'अर्डर तथा सेवा' : 'Orders',
    themeChange: appLang === 'ne' ? 'थिम परिवर्तन' : 'Theme Change',
    language: appLang === 'ne' ? 'भाषा' : 'Language',
    textSize: appLang === 'ne' ? 'अक्षरको आकार' : 'Text Size',
    serviceMessages: appLang === 'ne' ? 'सूचना सन्देश' : 'Service Messages',
    gCalSync: appLang === 'ne' ? 'गुगल क्यालेन्डर सिङ्क' : 'Google Calendar Sync',
    aboutUs: appLang === 'ne' ? 'हाम्रो बारेमा' : 'About Us',
    privacyPolicy: appLang === 'ne' ? 'गोपनीयता नीति' : 'Privacy Policy',
    manageAccount: appLang === 'ne' ? 'खाता व्यवस्थापन' : 'Manage Account',
    contactUs: appLang === 'ne' ? 'सम्पर्क गर्नुहोस्' : 'Contact Us',
    feedback: appLang === 'ne' ? 'प्रतिक्रिया दिनुहोस्' : 'Feedback',
    howToUse: appLang === 'ne' ? 'प्रयोग गर्ने तरिका' : 'How to use?',
    radio: appLang === 'ne' ? 'रेडियो एफएम' : 'Radio FM',
    nepse: appLang === 'ne' ? 'शेयर बजार (NEPSE)' : 'Share Market',
    goldSilver: appLang === 'ne' ? 'सुनचाँदी भाउ' : 'Gold & Silver',
    health: appLang === 'ne' ? 'स्वास्थ्य परामर्श' : 'Health',
    logIn: appLang === 'ne' ? 'लग इन गर्नुहोस्' : 'Log In',
    logOut: appLang === 'ne' ? 'लग आउट' : 'Log Out',
    notLoggedIn: appLang === 'ne' ? 'तपाईं लग इन हुनुहुन्न। प्रोफाइल हेर्न लग इन गर्नुहोस्।' : 'You are not logged in. Please login to access your profile.'
  };

  const [isMembershipOpen, setIsMembershipOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [isGCalSynced, setIsGCalSynced] = useState<boolean>(false);
  const [serviceMessages, setServiceMessages] = useState<any[]>([]);

  // Modals
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [notes, setNotes] = useState<{id:any;text:string;date:string}[]>([]);
  const [openedNewsItem, setOpenedNewsItem] = useState<any>(null);
  const [readerViewMode, setReaderViewMode] = useState<'clean' | 'web'>('clean');
  const [newsCategory, setNewsCategory] = useState<string>('all');
  const [newsPage, setNewsPage] = useState<number>(1);
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
  const [calSubTab, setCalSubTab] = useState<'events' | 'saait'>('events');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [selectedZodiac, setSelectedZodiac] = useState<any>(ZODIAC_SIGNS[0]);

  const DEFAULT_HERO_SLIDERS = [
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1000&auto=format&fit=crop&q=80'
  ];
  const [heroSliders, setHeroSliders] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('mp_hero_sliders');
        if (saved) return JSON.parse(saved);
      }
      return DEFAULT_HERO_SLIDERS;
    } catch (_) {
      return DEFAULT_HERO_SLIDERS;
    }
  });
  const [sliderIdx, setSliderIdx] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSliderIdx(prev => (prev + 1) % (heroSliders.length || 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSliders]);

  // Real-time ticking clock, weather & news
  const [liveTimeStr, setLiveTimeStr] = useState<string>('08:24 am');
  const [liveAdDateStr, setLiveAdDateStr] = useState<string>('Sep 6, 2026');
  const [liveTemperature, setLiveTemperature] = useState<number>(28);
  const [liveCity, setLiveCity] = useState<string>('Kathmandu');
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

  const getAdDayForBs = (bsYear: number, bsMonth: number, bsDay: number): number => {
    try {
      const np = new NepaliDate(bsYear, bsMonth, bsDay);
      return np.toJsDate().getDate();
    } catch (_) {
      return bsDay;
    }
  };

  // Auth state listener — also loads Firestore notes on login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserPhoto(user.photoURL);
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserEmail(user.email || null);
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
        setUserEmail(null);
        // Load from localStorage for guests
        const saved = localStorage.getItem('mp_notes');
        if (saved) setNotes(JSON.parse(saved));
        setNotesSource('local');
      }
    });
    return () => unsub();
  }, []);

  // Fetch Service Messages from push-notification API
  useEffect(() => {
    fetch('/api/v1/push-notification')
      .then(res => res.json())
      .then(d => {
        if (d && Array.isArray(d.notifications)) {
          setServiceMessages(d.notifications);
        }
      })
      .catch(() => {});
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
            .then(d => {
              if (d?.temp_celsius !== undefined) setLiveTemperature(Math.round(d.temp_celsius));
              if (d?.city) setLiveCity(d.city);
            })
            .catch(() => {});
        },
        () => {
          fetch('/api/v1/weather')
            .then(r => r.json())
            .then(d => {
              if (d?.temp_celsius !== undefined) setLiveTemperature(Math.round(d.temp_celsius));
              if (d?.city) setLiveCity(d.city);
            })
            .catch(() => {});
        }
      );
    } else {
      fetch('/api/v1/weather')
        .then(r => r.json())
        .then(d => {
          if (d?.temp_celsius !== undefined) setLiveTemperature(Math.round(d.temp_celsius));
          if (d?.city) setLiveCity(d.city);
        })
        .catch(() => {});
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setUserPhoto(result.user.photoURL);
        setUserName(result.user.displayName || result.user.email?.split('@')[0] || 'User');
        setUserEmail(result.user.email || null);
        setIsProfileOpen(true);
      }
    } catch (err: any) {
      console.error('Google login failed:', err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserPhoto(null);
      setUserName(null);
      setUserEmail(null);
      setNotesSource('local');
      const saved = localStorage.getItem('mp_notes');
      if (saved) setNotes(JSON.parse(saved));
    } catch (err: any) {
      console.error('Logout failed:', err.message);
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

  // Update meta theme-color for dark/light mode (status bar color)
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (meta) {
      meta.content = appTheme === 'dark' ? '#000000' : '#ffffff';
    } else {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = appTheme === 'dark' ? '#000000' : '#ffffff';
      document.head.appendChild(m);
    }
  }, [appTheme]);

  // Fetch Live Weather with geolocation, fallback to auto IP location or Kathmandu
  const fetchWeather = () => {
    const handleData = (data: any) => {
      if (data?.temp_celsius !== undefined) setLiveTemperature(Math.round(data.temp_celsius));
      if (data?.city) setLiveCity(data.city);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`/api/v1/weather?lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(handleData)
            .catch(() => {});
        },
        () => {
          fetch('/api/v1/weather')
            .then(res => res.json())
            .then(handleData)
            .catch(() => {});
        },
        { timeout: 5000 }
      );
    } else {
      fetch('/api/v1/weather')
        .then(res => res.json())
        .then(handleData)
        .catch(() => {});
    }
  };

  const fetchNews = (category: string = newsCategory, pageNum: number = 1) => {
    fetch(`/api/v1/news?category=${encodeURIComponent(category)}&page=${pageNum}&limit=20`)
      .then(res => res.json())
      .then(data => {
        if (data?.news) {
          if (pageNum > 1) {
            setLiveNews(prev => [...prev, ...data.news]);
          } else {
            setLiveNews(data.news);
          }
        }
      })
      .catch(() => {});
  };

  const fetchMarketData = () => {
    fetch('/api/v1/nepse')
      .then(res => res.json())
      .then(data => setNepseData(data))
      .catch(() => {});
    fetch('/api/v1/gold')
      .then(res => res.json())
      .then(data => setGoldData(data))
      .catch(() => {});
    fetch('/api/v1/radio')
      .then(res => res.json())
      .then(data => { if (data?.stations) setRadioStations(data.stations); })
      .catch(() => {});
  };

  // Fetch Live Weather & News
  useEffect(() => {
    fetchWeather();
    fetchNews();
    fetchMarketData();
  }, []);

  // Pull-to-refresh handler
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = mainRef.current;
    if (el && el.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const el = mainRef.current;
    if (el && el.scrollTop === 0 && !isRefreshing) {
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta > 0) setPullY(Math.min(delta, 80));
    }
  };
  const handleTouchEnd = async () => {
    if (pullY > 55 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(0);
      if (activeTab === 'news') {
        await Promise.all([fetchNews()]);
      } else if (activeTab === 'home') {
        await Promise.all([fetchWeather(), fetchNews(), fetchMarketData()]);
      } else if (activeTab === 'calendar') {
        // just reset
      }
      setTimeout(() => setIsRefreshing(false), 800);
    } else {
      setPullY(0);
    }
  };

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
        // NepaliDate uses 0-indexed months
        const npDate = new NepaliDate(convYear, convMonth, convDay);
        const jsDate = npDate.toJsDate();
        if (isNaN(jsDate.getTime())) throw new Error('Invalid date');
        setConvResult(
          `${jsDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} (AD)`
        );
      } catch (_) {
        // Manual fallback approximation (57 year offset)
        const adYear = convYear - 56;
        const adDate = new Date(adYear, convMonth + 3, convDay);
        setConvResult(
          `~${adDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (AD approx.)`
        );
      }
    } else {
      // AD → BS using NepaliDate constructor from JS Date
      try {
        const adDate = new Date(convYear, convMonth, convDay);
        const npDate = new NepaliDate(adDate);
        const bsYear = npDate.getYear();
        const bsMonth = npDate.getMonth();
        const bsDay = npDate.getDate();
        const dayOfWeek = DAYS_NE_FULL[adDate.getDay()];
        setConvResult(
          `${dayOfWeek}, ${NEPALI_MONTHS_NE[bsMonth]} ${toNepaliDigits(bsDay)}, ${toNepaliDigits(bsYear)} (BS)`
        );
      } catch (_) {
        const bsYear = convYear + 56;
        setConvResult(`~${toNepaliDigits(bsYear)} ${NEPALI_MONTHS_NE[convMonth]} ${toNepaliDigits(convDay)} गते (BS approx.)`);
      }
    }
  };

  useEffect(() => {
    handleConvert();
  }, [convYear, convMonth, convDay, convMode]);

  const monthDaysCount = getDaysInMonth(calYear, calMonth);
  const startDayOfWeek = getFirstDayOfWeek(calYear, calMonth);
  const monthEvents = NE_MONTHS_EVENTS[calMonth] || {};

  return (
    <div className={`fixed inset-0 z-30 flex flex-col w-full h-full font-sans overflow-hidden select-none sm:relative sm:inset-auto sm:z-auto sm:max-w-xl sm:mx-auto sm:h-[880px] sm:rounded-3xl sm:border sm:shadow-2xl transition-colors duration-200 ${
      appTheme === 'dark' 
        ? 'bg-[#000000] text-white border-zinc-900' 
        : 'bg-[#f8f9fa] text-slate-900 border-slate-300'
    } ${
      textSize === 'small' ? 'text-xs' : textSize === 'large' ? 'text-base' : 'text-sm'
    }`}>
      
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ANIMATED RED SPLASH SCREEN OVERLAY                                */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ANIMATED RED SPLASH SCREEN OVERLAY                                */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showSplash && (
        <div className="fixed inset-0 z-[99999] bg-[#e52521] flex flex-col items-center justify-center text-white space-y-4 animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-white p-3.5 shadow-2xl flex items-center justify-center">
            <img src="/mero-patro-app-icon-3d.png" alt="Mero Patro" className="w-full h-full object-contain" />
          </div>
          <div className="text-center space-y-1 px-4">
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md font-sans">मेरो पात्रो</h1>
            <p className="text-xs font-semibold text-white/95 tracking-wide font-sans">नेपालको आफ्नो पात्रो • Nepali Calendar & Panchanga</p>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <span className="text-xs font-semibold text-white/90">लोड हुँदैछ...</span>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* APP TOP BAR (Exact Matching Reference Screenshots 1, 2, 3, 4, 5) */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <header className={`px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0 w-full max-w-full transition-colors ${
        appTheme === 'dark' 
          ? 'bg-[#000000] border-b border-zinc-900 text-white' 
          : 'bg-[#e52521] border-b border-[#d01f1c] text-white'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          <button 
            onClick={() => setIsHamroDrawerOpen(true)}
            className="p-1 text-white hover:text-white/80 transition-colors cursor-pointer shrink-0"
            title="Mero Services Menu"
          >
            <Menu size={20} className="sm:w-5 sm:h-5" />
          </button>
          
          {/* Official Mero Patro Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img 
              src="/mero-patro-app-icon-3d.png" 
              alt="Mero Patro" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain shadow-xs shrink-0 hover:scale-105 transition-transform bg-white/10 p-0.5" 
            />
            <h1 className="text-xs sm:text-base font-black tracking-tight font-sans text-white truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {t.appName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick theme toggle */}
          <button 
            onClick={toggleTheme}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              appTheme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800' 
                : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
            }`}
            title="Toggle Theme"
          >
            {appTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Quick language toggle */}
          <button 
            onClick={toggleLang}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-black shrink-0 transition-all cursor-pointer ${
              appTheme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
                : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
            }`}
            title="Switch Language"
          >
            {appLang === 'ne' ? 'नेपाली' : 'EN'}
          </button>

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-1 text-white hover:text-white/80 transition-colors cursor-pointer shrink-0"
            title="Search"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full aspect-square border-2 flex items-center justify-center transition-colors overflow-hidden shrink-0 cursor-pointer ${
              appTheme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white/30 border-white/50 text-white'
            }`}
            title="Profile"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="User Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={15} />
            )}
          </button>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MAIN VIEW CONTROLLER (Scrollable View)                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <main
        ref={mainRef}
        className={`flex-1 min-h-0 overflow-y-auto pb-6 custom-scrollbar transition-colors ${
          appTheme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#f8f9fa] text-slate-900'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {(pullY > 10 || isRefreshing) && (
          <div
            style={{ height: isRefreshing ? 48 : pullY * 0.6 }}
            className="flex items-center justify-center transition-all overflow-hidden"
          >
            <div className={`w-8 h-8 rounded-full border-2 border-[#e52521] border-t-transparent ${isRefreshing ? 'animate-spin' : ''} flex items-center justify-center`}>
              <RefreshCw size={14} className={`text-[#e52521] ${!isRefreshing ? 'opacity-70' : ''}`} />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 1: HOME (Exact Screenshot 1)                                */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'home' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Weather & Scenic 3-Slider Hero Landscape Card (Admin Controllable) */}
            <div 
              className="relative rounded-3xl overflow-hidden shadow-lg text-white min-h-[170px] flex flex-col justify-between p-4 bg-cover bg-center border border-transparent transition-all duration-700" 
              style={{ backgroundImage: `url('${heroSliders[sliderIdx] || DEFAULT_HERO_SLIDERS[0]}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 z-10" />
              <div className="relative z-20 flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200">
                    {appLang === 'ne' ? 'शुभ प्रभात' : 'Good Morning'}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-1.5 mt-0.5 drop-shadow-md">
                    <Sun size={20} className="text-amber-300" /> {liveTemperature}° C | {liveCity}
                  </h2>
                </div>
              </div>

              {/* Slider Controls & See More Button (Visible in Light & Dark Mode) */}
              <div className="relative z-20 flex items-center justify-between pt-4">
                {/* 3 Slider Indicator Dots */}
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  {heroSliders.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSliderIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        sliderIdx === idx ? 'w-5 bg-[#e52521]' : 'bg-white/60 hover:bg-white'
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button 
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-1.5 bg-[#e52521] hover:bg-[#d01f1c] text-white text-xs font-black rounded-full shadow-lg border border-white/40 transition-all cursor-pointer"
                >
                  {appLang === 'ne' ? 'थप हेर्नुहोस्' : 'See More'}
                </button>
              </div>
            </div>

            {/* Date Summary Card with Right Mini Calendar Grid (Hamro Patro Screenshot UI Match) */}
            <div className={`rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch gap-4 border transition-all ${
              appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Left Date Column Details */}
              <div 
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 space-y-1.5 border-b sm:border-b-0 sm:border-r pb-3 sm:pb-0 sm:pr-4 cursor-pointer group hover:opacity-95 transition-all ${
                  appTheme === 'dark' ? 'border-zinc-800' : 'border-slate-100'
                }`}
                title={appLang === 'ne' ? 'पात्रो खोल्न थिच्नुहोस्' : 'Click to open full calendar'}
              >
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl sm:text-3xl font-black group-hover:text-[#e52521] transition-colors ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {appLang === 'ne' ? `${toNepaliDigits(todayBs.day)} ${NEPALI_MONTHS_NE[todayBs.month]}` : `${todayBs.day} ${NEPALI_MONTHS_EN[todayBs.month]}`}
                  </h2>
                </div>
                <p className={`text-xs font-black ${appTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {appLang === 'ne' ? `${DAYS_NE_FULL[new Date().getDay()]}, ${toNepaliDigits(todayBs.year)}` : `${DAYS_EN_FULL[new Date().getDay()]}, ${todayBs.year}`}
                </p>
                <p className={`text-xs font-semibold ${appTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{liveAdDateStr}</p>
                
                <div className={`pt-1 space-y-0.5 text-xs ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p className={`font-bold ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{NEPALI_MONTHS_NE[todayBs.month]} कृष्ण एकादशी</p>
                  <p className={`text-[11px] ${appTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>ने.सं. ११४६ गुंलागा एकादशी</p>
                  <p className="text-[#e52521] text-sm font-black font-mono pt-1">{liveTimeStr}</p>
                </div>
              </div>

              {/* Right Mini Month Calendar Grid with Highlighted Green 22 Circle (Exact Hamro Patro Match) */}
              <div 
                onClick={() => setActiveTab('calendar')}
                className={`w-full sm:w-56 p-3 rounded-2xl border cursor-pointer hover:border-[#e52521]/40 transition-all ${
                  appTheme === 'dark' ? 'bg-[#141416] border-zinc-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
                title={appLang === 'ne' ? 'पात्रो खोल्न थिच्नुहोस्' : 'Click to open full calendar'}
              >
                <div className={`grid grid-cols-7 gap-1 text-center text-[11px] font-black pb-1.5 border-b ${
                  appTheme === 'dark' ? 'border-zinc-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className={i === 0 || i === 6 ? 'text-[#e52521]' : ''}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 pt-2 text-center text-xs">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`m-blank-${i}`} />
                  ))}
                  {Array.from({ length: monthDaysCount }).map((_, i) => {
                    const d = i + 1;
                    const isToday = d === todayBs.day;
                    const isSaturday = (startDayOfWeek + i) % 7 === 6;
                    const isSunday = (startDayOfWeek + i) % 7 === 0;
                    return (
                      <span 
                        key={`m-${d}`} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(d);
                          setActiveTab('calendar');
                        }}
                        className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all ${
                          isToday
                            ? 'bg-[#288448] text-white shadow-md font-black scale-105'
                            : isSaturday || isSunday
                            ? 'text-[#e52521] hover:bg-red-500/10'
                            : appTheme === 'dark'
                            ? 'text-white hover:bg-zinc-800'
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
                <h3 className={`text-base font-extrabold ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Upcoming Events</h3>
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

            {/* Quick Action Pill Buttons (Official Lucide Icons, Zero Emojis) */}
            <div className="grid grid-cols-3 gap-2.5">
              <button 
                onClick={() => setIsNotesOpen(true)} 
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer border ${
                  appTheme === 'dark' 
                    ? 'bg-[#181a20] hover:bg-[#20242e] border-slate-700 text-slate-100' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <FileText size={15} className="text-[#e52521]" />
                <span>{t.notes}</span>
              </button>
              <button 
                onClick={() => setActiveTab('calendar')} 
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer border ${
                  appTheme === 'dark' 
                    ? 'bg-[#181a20] hover:bg-[#20242e] border-slate-700 text-slate-100' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <CalendarIcon size={15} className="text-[#e52521]" />
                <span>{t.holidays}</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer border ${
                  appTheme === 'dark' 
                    ? 'bg-[#181a20] hover:bg-[#20242e] border-slate-700 text-slate-100' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <Clock size={15} className="text-[#e52521]" />
                <span>{t.saait}</span>
              </button>
            </div>

            {/* Add Notes Action Bar */}
            <div className={`flex items-center justify-end pt-1 border-t ${appTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <button onClick={() => setIsNotesOpen(true)} className="flex items-center gap-1.5 text-xs font-extrabold hover:text-[#e52521] cursor-pointer">
                <Plus size={16} className="p-0.5 rounded-full bg-[#e52521] text-white" />
                <span>{t.addNotes}</span>
              </button>
            </div>

            {/* Astrology Banner (Official Lucide Icon) */}
            <div className={`rounded-3xl p-3.5 flex items-center justify-between border ${
              appTheme === 'dark' ? 'bg-[#1e222d] border-amber-900/50' : 'bg-amber-50/80 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e52521] text-white flex items-center justify-center text-lg shadow-sm">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">प्रेम • करियर • धन • सम्बन्ध</p>
                  <h4 className="text-xs font-extrabold">आफ्नो प्रश्नको ज्योतिषीय उत्तर खोज्नुहोस्।</h4>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-1.5 bg-[#e52521] text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-[#d01f1c] cursor-pointer"
              >
                {appLang === 'ne' ? 'हेर्नुहोस्' : 'View'}
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
            <div className={`p-3 rounded-3xl border flex items-center justify-between shadow-sm ${
              appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <h2 className={`text-base font-black ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {appLang === 'ne' ? `${NEPALI_MONTHS_NE[calMonth]} ${toNepaliDigits(calYear)}` : `${NEPALI_MONTHS_EN[calMonth]} ${calYear}`}
                  </h2>
                  <ChevronDown size={16} className={appTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <p className={`text-xs font-medium ${appTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Aug/Sep 2026</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setCalYear(todayBs.year); setCalMonth(todayBs.month); setSelectedDay(todayBs.day); }}
                  className="px-3.5 py-1.5 bg-[#e52521] text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-[#d01f1c]"
                >
                  {appLang === 'ne' ? 'आज' : 'Today'}
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(prev => prev - 1); }
                    else { setCalMonth(prev => prev - 1); }
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    appTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(prev => prev + 1); }
                    else { setCalMonth(prev => prev + 1); }
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    appTheme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 7-Column Calendar Grid with Dual Dates (Exact Screenshot 2) */}
            <div className={`border rounded-3xl p-3 space-y-1 shadow-sm ${
              appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className={`grid grid-cols-7 gap-1 text-center border-b pb-2 ${
                appTheme === 'dark' ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                {(appLang === 'ne' ? DAYS_NE_SHORT : DAYS_EN_SHORT).map((d, idx) => (
                  <span key={d} className={`text-xs font-extrabold ${idx === 6 ? 'text-[#e52521]' : appTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 pt-1">
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-14 sm:h-16 rounded-xl bg-transparent" />
                ))}

                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const day = idx + 1;
                  const dayOfWeek = (startDayOfWeek + idx) % 7;
                  const isSaturday = dayOfWeek === 6;
                  const isSelected = selectedDay === day;
                  const isToday = calYear === todayBs.year && calMonth === todayBs.month && day === todayBs.day;
                  const adDay = getAdDayForBs(calYear, calMonth, day);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-14 sm:h-16 rounded-xl flex flex-col justify-between p-1.5 sm:p-2 relative transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-[#24592a] text-white border-[#24592a] shadow-md z-10' 
                          : isToday
                          ? appTheme === 'dark' ? 'bg-zinc-800 text-white border-[#e52521] ring-2 ring-[#e52521]/30' : 'bg-slate-50 text-slate-900 border-[#e52521] ring-2 ring-[#e52521]/30'
                          : isSaturday
                          ? appTheme === 'dark' ? 'bg-[#141416] text-[#e52521] border-zinc-800 hover:bg-zinc-800' : 'bg-white text-[#e52521] border-slate-200 hover:bg-slate-50'
                          : appTheme === 'dark' ? 'bg-[#141416] text-white border-zinc-800 hover:bg-zinc-800' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-lg sm:text-2xl font-black leading-none ${isSelected ? 'text-white' : isSaturday ? 'text-[#e52521]' : appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {appLang === 'ne' ? toNepaliDigits(day) : day}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-medium leading-none text-right ${isSelected ? 'text-white/80' : isSaturday ? 'text-[#e52521]/80' : appTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                        {adDay}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details Panel (Exact Screenshot 3 & 4) */}
            <div className={`border rounded-3xl p-4 space-y-4 shadow-sm ${
              appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className={`flex items-start justify-between border-b pb-3 ${
                appTheme === 'dark' ? 'border-zinc-800' : 'border-slate-100'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-[#e52521]">
                      {appLang === 'ne' ? toNepaliDigits(selectedDay) : selectedDay}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                      appTheme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {selectedDay === todayBs.day 
                        ? (appLang === 'ne' ? 'आज' : 'Today') 
                        : (appLang === 'ne' ? `${NEPALI_MONTHS_NE[calMonth]} ${toNepaliDigits(selectedDay)}` : `${NEPALI_MONTHS_EN[calMonth]} ${selectedDay}`)}
                    </span>
                  </div>
                  <h3 className={`text-base font-black leading-tight mt-1 ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {appLang === 'ne' ? `${NEPALI_MONTHS_NE[calMonth]} ${toNepaliDigits(calYear)}` : `${NEPALI_MONTHS_EN[calMonth]} ${calYear}`}
                  </h3>
                  <p className={`text-xs font-bold ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {appLang === 'ne' ? DAYS_NE_FULL[(startDayOfWeek + selectedDay - 1) % 7] : DAYS_EN_FULL[(startDayOfWeek + selectedDay - 1) % 7]}
                  </p>
                  <p className={`text-xs font-medium ${appTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{liveAdDateStr}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => setIsNotesOpen(true)} className="px-3.5 py-1.5 bg-[#24592a] hover:bg-[#1b4320] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                    <Plus size={14} /> Add Notes
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-900 font-bold">
                  {getTithiForDay(calMonth, selectedDay)} (०५ : २५ : ५२ PM बजे सम्म)
                </p>
                <p className="text-xs text-slate-500">NS 1146 गुंलागा दशमी</p>

                {NE_MONTHS_EVENTS[calMonth]?.[selectedDay] && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2">
                    <Sparkles size={16} className="text-[#e52521] shrink-0" />
                    <p className="text-xs font-extrabold text-[#e52521]">
                      {NE_MONTHS_EVENTS[calMonth][selectedDay].title}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Moon size={18} className="text-slate-600" />
                    <span className="font-semibold text-slate-600">Waxing Gibbous</span>
                  </div>
                  <div className="flex items-center gap-3 font-bold text-slate-700">
                    <span>🌅 05:45</span>
                    <span>🌇 06:17</span>
                  </div>
                </div>

                {/* Sahits Today Pill Badges (Exact Screenshot 4) */}
                <div className={`pt-2 border-t flex items-center justify-between ${
                  appTheme === 'dark' ? 'border-zinc-800' : 'border-slate-100'
                }`}>
                  <span className={`text-xs font-black ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sahits today</span>
                  <button 
                    onClick={() => {
                      setCalSubTab('saait');
                      setTimeout(() => {
                        document.getElementById('saait-subtab-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }} 
                    className="text-xs font-extrabold text-[#e52521] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      setCalSubTab('saait');
                      setTimeout(() => {
                        document.getElementById('saait-subtab-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-extrabold rounded-full border border-amber-200 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    रुद्री जुर्ने
                  </button>
                  <button 
                    onClick={() => {
                      setCalSubTab('saait');
                      setTimeout(() => {
                        document.getElementById('saait-subtab-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-extrabold rounded-full border border-amber-200 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    अग्नि जुर्ने
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Events Horizontal Carousel (Exact Screenshot 4) */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-extrabold ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Upcoming Events</h3>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {/* Event Card 1 */}
                <div className="shrink-0 w-48 h-56 rounded-3xl relative overflow-hidden bg-slate-900 text-white p-4 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e52521] text-white font-extrabold text-[9px]">Today</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <h4 className="text-xs font-black text-white leading-snug">Aja Ekadashi Vrata, Nijamati Sewa Diwas</h4>
                    <p className="text-[10px] text-slate-300 font-semibold">Bhadra 22, Mon (Today)</p>
                  </div>
                </div>

                {/* Event Card 2 */}
                <div className="shrink-0 w-48 h-56 rounded-3xl relative overflow-hidden bg-slate-950 text-white p-4 flex flex-col justify-between shadow-md border border-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-black z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">Tomorrow</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <h4 className="text-xs font-black text-amber-400 leading-snug">Gen-Z Sahid Diwas, Pradosh Vrata</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Bhadra 23, Tue (Tomorrow)</p>
                  </div>
                </div>

                {/* Event Card 3 */}
                <div className="shrink-0 w-48 h-56 rounded-3xl relative overflow-hidden bg-slate-900 text-white p-4 flex flex-col justify-between shadow-md border border-slate-200">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=80')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 z-10" />
                  <div className="relative z-20 flex justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white font-extrabold text-[9px]">In 3 days</span>
                  </div>
                  <div className="relative z-20 space-y-1">
                    <h4 className="text-xs font-black text-white leading-snug">World Suicide Prevention Day</h4>
                    <p className="text-[10px] text-slate-300 font-semibold">Bhadra 25, Thu (In 3 days)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Switcher Bar: Events vs Saait This Month (Exact Screenshot 1 & 2) */}
            <div id="saait-subtab-section" className={`border-b flex items-center justify-around mt-4 pt-1 ${
              appTheme === 'dark' ? 'bg-[#000000] border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <button
                onClick={() => setCalSubTab('events')}
                className={`flex-1 py-3 text-center font-black text-sm border-b-2 transition-all cursor-pointer ${
                  calSubTab === 'events'
                    ? 'border-[#e52521] text-[#e52521]'
                    : appTheme === 'dark' ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {appLang === 'ne' ? 'पर्वहरू (Events)' : 'Events'}
              </button>
              <button
                onClick={() => setCalSubTab('saait')}
                className={`flex-1 py-3 text-center font-black text-sm border-b-2 transition-all cursor-pointer ${
                  calSubTab === 'saait'
                    ? 'border-[#e52521] text-[#e52521]'
                    : appTheme === 'dark' ? 'border-transparent text-slate-400 hover:text-white' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {appLang === 'ne' ? 'यो महिनाको साइत' : 'Saait This Month'}
              </button>
            </div>

            {/* TAB CONTENT A: Events List View (Exact Screenshot 2) */}
            {calSubTab === 'events' && (
              <div className={`rounded-3xl border divide-y shadow-sm overflow-hidden animate-fadeIn ${
                appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 divide-zinc-900 text-white' : 'bg-white border-slate-200 divide-slate-100 text-slate-900'
              }`}>
                {Array.from({ length: monthDaysCount }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayOfWeekIdx = (startDayOfWeek + idx) % 7;
                  const dayNameShort = appLang === 'ne' ? DAYS_NE_SHORT[dayOfWeekIdx] : DAYS_EN_SHORT[dayOfWeekIdx];
                  const isSat = dayOfWeekIdx === 6;
                  const eventObj = appLang === 'ne' ? NE_MONTHS_EVENTS[calMonth]?.[dayNum] : (EN_MONTHS_EVENTS[calMonth]?.[dayNum] || NE_MONTHS_EVENTS[calMonth]?.[dayNum]);
                  const tithiStr = getTithiForDay(calMonth, dayNum);
                  const relText = getRelativeDaysText(calYear, calMonth, dayNum, todayBs, appLang);

                  return (
                    <div key={dayNum} className={`p-3.5 flex items-center justify-between transition-colors ${
                      appTheme === 'dark' ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-50'
                    }`}>
                      {/* Left: Day & Month info */}
                      <div className={`w-14 text-center shrink-0 border-r pr-2 ${
                        appTheme === 'dark' ? 'border-zinc-900' : 'border-slate-100'
                      }`}>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">{dayNameShort}</span>
                        <span className={`text-2xl font-black block leading-none my-0.5 ${isSat ? 'text-[#e52521]' : appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {appLang === 'ne' ? toNepaliDigits(dayNum) : dayNum}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {appLang === 'ne' ? NEPALI_MONTHS_NE[calMonth] : NEPALI_MONTHS_EN[calMonth]}
                        </span>
                      </div>

                      {/* Middle: Tithi & Events */}
                      <div className="flex-1 px-3 space-y-1 min-w-0">
                        <p className={`text-[11px] font-bold ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{tithiStr}</p>
                        {eventObj ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#e52521]/10 text-[#e52521] flex items-center justify-center shrink-0">
                              <Sparkles size={13} />
                            </div>
                            <h4 className={`text-xs font-black truncate ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{eventObj.title}</h4>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {appLang === 'ne' ? 'सामान्य दिन' : 'Normal Day'}
                          </p>
                        )}
                      </div>

                      {/* Right: Relative Days Ago / In X days */}
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          relText === 'Today' || relText === 'आज'
                            ? 'bg-[#e52521] text-white shadow-xs'
                            : relText === 'Tomorrow' || relText === 'भोलि'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : appTheme === 'dark' ? 'bg-zinc-900 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {relText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT B: Saait Grid View (Exact Screenshot 1) */}
            {calSubTab === 'saait' && (
              <div className={`rounded-3xl border p-4 space-y-5 shadow-sm animate-fadeIn ${
                appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                {(SAAIT_DATA[calMonth] || SAAIT_DATA[4]).map((cat, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <h4 className={`text-xs font-black flex items-center gap-2 ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      <span className="w-2 h-2 rounded-full bg-[#e52521]" />
                      {appLang === 'ne' ? cat.title : (SAAIT_TITLE_MAP_EN[cat.title] || cat.title)}
                    </h4>
                    <div className="flex flex-wrap gap-2.5 pt-0.5">
                      {cat.days.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDay(d)}
                          className={`w-9 h-9 rounded-full text-xs font-black flex items-center justify-center shadow-xs border cursor-pointer transition-all hover:scale-110 ${
                            appTheme === 'dark'
                              ? 'bg-amber-900/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                              : 'bg-amber-100/90 text-amber-900 border-amber-300/60 hover:bg-amber-200'
                          }`}
                        >
                          {appLang === 'ne' ? toNepaliDigits(d) : d}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 3: NEWS (Official Nepali Media Real-Time RSS Stream)        */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Header Banner */}
            <div className={`rounded-3xl p-5 border text-center space-y-1.5 shadow-sm ${
              appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h2 className="text-2xl font-black text-[#e52521]">ताजा तथा आधिकारिक नेपाली समाचार</h2>
              <p className={`text-xs font-medium ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                अनलाइनखबर, रातोपाटी, सेतोपाटी, नागरिक न्यूज तथा प्रमुख नेपाली सञ्चारमाध्यमहरूबाट प्रत्यक्ष समाचार RSS फिड
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: 'all', label: appLang === 'ne' ? 'सबै' : 'All' },
                { id: 'ताजा', label: appLang === 'ne' ? 'ताजा समाचार' : 'Latest' },
                { id: 'राजनीति', label: appLang === 'ne' ? 'राजनीति' : 'Politics' },
                { id: 'अर्थ', label: appLang === 'ne' ? 'अर्थ / शेयर' : 'Finance' },
                { id: 'खेलकुद', label: appLang === 'ne' ? 'खेलकुद' : 'Sports' },
                { id: 'मनोरञ्जन', label: appLang === 'ne' ? 'मनोरञ्जन' : 'Entertainment' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setNewsCategory(cat.id);
                    setNewsPage(1);
                    fetchNews(cat.id, 1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 border ${
                    newsCategory === cat.id
                      ? 'bg-[#e52521] text-white border-[#d01f1c] shadow-sm'
                      : appTheme === 'dark'
                      ? 'bg-[#0a0a0c] text-slate-300 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Featured Hero Breaking News Card */}
            {liveNews.length > 0 && liveNews[0] && (
              <div 
                onClick={() => setOpenedNewsItem(liveNews[0])}
                className="relative rounded-3xl overflow-hidden shadow-lg border border-zinc-800 text-white min-h-[220px] flex flex-col justify-end p-5 cursor-pointer group transition-transform hover:scale-[1.01]"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ 
                    backgroundImage: `url('${liveNews[0].image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80'}')` 
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e52521] text-white font-extrabold text-[10px] uppercase">
                      {liveNews[0].source || 'मुख्य समाचार'}
                    </span>
                    <span className="text-[11px] font-semibold text-white/80">
                      {new Date(liveNews[0].pubDate || Date.now()).toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black leading-snug text-white group-hover:text-amber-300 transition-colors drop-shadow-md">
                    {liveNews[0].title}
                  </h3>
                  {liveNews[0].description && (
                    <p className="text-xs text-white/80 line-clamp-2 font-normal">
                      {liveNews[0].description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Popular News Feed Vertical Stream */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-extrabold ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>सत्यापित समाचार फिड</h3>
                <span className="text-xs font-extrabold text-[#e52521]">१००% आधिकारिक सञ्चारमाध्यम</span>
              </div>

              <div className="space-y-3">
                {liveNews.length > 0 ? (
                  liveNews.map((item, idx) => {
                    const source = NEPALI_NEWS_SOURCES[idx % NEPALI_NEWS_SOURCES.length];
                    return (
                      <button
                        key={item.id || idx}
                        onClick={() => setOpenedNewsItem(item)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border shadow-sm transition-all group text-left w-full cursor-pointer ${
                          appTheme === 'dark'
                            ? 'bg-[#0a0a0c] border-zinc-900 hover:border-[#e52521] text-white'
                            : 'bg-white border-slate-200 hover:border-[#e52521] text-slate-900'
                        }`}
                      >
                        {/* Real Banner Image Thumbnail */}
                        <div className={`w-20 h-20 sm:w-24 sm:h-20 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center relative ${
                          appTheme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                        }`}>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                // Fallback to newspaper icon if image fails to load
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Newspaper size={26} className="text-[#e52521]" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1 min-w-0">
                          <h4 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
                            appTheme === 'dark' ? 'text-white group-hover:text-[#e52521]' : 'text-slate-900 group-hover:text-[#e52521]'
                          }`}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="font-extrabold text-[#e52521]">{item.source || source.name}</span>
                            <span className="flex items-center gap-0.5 font-medium">{item.domain || source.domain}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className={`p-6 rounded-2xl border text-center text-xs font-semibold ${
                    appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}>
                    ताजा समाचार फिड लोड हुँदैछ...
                  </div>
                )}
              </div>

              {/* Load More News Button */}
              {liveNews.length > 0 && (
                <div className="pt-3 text-center">
                  <button
                    onClick={() => {
                      const nextPage = newsPage + 1;
                      setNewsPage(nextPage);
                      fetchNews(newsCategory, nextPage);
                    }}
                    className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs border transition-all cursor-pointer shadow-sm ${
                      appTheme === 'dark'
                        ? 'bg-[#121214] border-zinc-800 text-white hover:bg-zinc-800'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    अझै समाचार लोड गर्नुहोस् (Load More News)
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* TAB 4: FOR YOU (Exact Screenshot 5)                             */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            
            {/* Hero Update Banner — Live top news from API */}
            <div className={`border rounded-3xl overflow-hidden shadow-sm ${ appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200' }`}>
              <div className="h-40 bg-gradient-to-br from-[#d01f1c] to-slate-900 relative flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">ताजा समाचार • Breaking News</span>
                  <h3 className="text-base font-black text-white drop-shadow-md line-clamp-3 leading-snug">
                    {liveNews.length > 0 ? liveNews[0].title : 'नेपालका प्रमुख समाचारहरू'}
                  </h3>
                </div>
              </div>
              <div className={`p-3.5 flex items-center justify-between ${ appTheme === 'dark' ? 'bg-[#1e222b]' : 'bg-slate-50' }`}>
                <div>
                  <p className="text-xs font-bold">नेपाली ताजा समाचार</p>
                  <p className="text-[10px] text-slate-500">{liveNews.length > 0 ? 'Google News Nepal RSS' : 'लोड हुँदैछ...'}</p>
                </div>
                {liveNews.length > 0 && (
                  <button
                    onClick={() => setOpenedNewsItem(liveNews[0])}
                    className="px-3.5 py-1.5 bg-[#e52521] text-white font-extrabold text-xs rounded-xl hover:bg-[#d01f1c] shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    पढ्नुहोस् <ExternalLink size={11} />
                  </button>
                )}
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
                  <h2 className="text-2xl font-black mt-0.5">{t.convert} (Date Converter)</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                  <ArrowLeftRight size={24} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-white/90 mt-2 font-medium">
                BS बाट AD र AD बाट BS मिति तुरुन्तै रूपान्तरण गर्नुहोस्
              </p>
            </div>

            {/* Conversion Mode Switcher */}
            <div className={`p-1 rounded-2xl flex gap-1 ${appTheme === 'dark' ? 'bg-[#181a20]' : 'bg-slate-200/80'}`}>
              <button
                onClick={() => setConvMode('BS_TO_AD')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  convMode === 'BS_TO_AD'
                    ? appTheme === 'dark' ? 'bg-[#e52521] text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BS ➔ AD (वि.सं. बाट ई.सं.)
              </button>
              <button
                onClick={() => setConvMode('AD_TO_BS')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  convMode === 'AD_TO_BS'
                    ? appTheme === 'dark' ? 'bg-[#e52521] text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AD ➔ BS (ई.सं. बाट वि.सं.)
              </button>
            </div>

            {/* Input Form Card */}
            <div className={`border rounded-3xl p-4 shadow-sm space-y-4 ${
              appTheme === 'dark' ? 'bg-[#181a20] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#e52521]" />
                <span>{convMode === 'BS_TO_AD' ? 'नेपाली मिति छान्नुहोस् (BS)' : 'English Date (AD)'}</span>
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Year */}
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
                  <select
                    value={convYear}
                    onChange={(e) => setConvYear(Number(e.target.value))}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-[#e52521] ${
                      appTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
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
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Month</label>
                  <select
                    value={convMonth}
                    onChange={(e) => setConvMonth(Number(e.target.value))}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-[#e52521] ${
                      appTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
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
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Day</label>
                  <select
                    value={convDay}
                    onChange={(e) => setConvDay(Number(e.target.value))}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-[#e52521] ${
                      appTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {Array.from({ length: 32 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d} {convMode === 'BS_TO_AD' ? `(${toNepaliDigits(d)})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white text-center space-y-1 shadow-inner border border-slate-700">
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
                  className={`flex-1 py-2.5 font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                    appTheme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
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

            {/* Quick Tools Info Cards (Official Icons, Zero Emojis) */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3.5 border rounded-2xl shadow-sm space-y-1.5 ${
                appTheme === 'dark' ? 'bg-[#181a20] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <Sparkles size={20} className="text-[#e52521]" />
                <h4 className="text-xs font-black">उमेर क्याल्कुलेटर</h4>
                <p className="text-[11px] text-slate-400">तपाईंको सही उमेर र अर्को जन्मदिन</p>
              </div>
              <div className={`p-3.5 border rounded-2xl shadow-sm space-y-1.5 ${
                appTheme === 'dark' ? 'bg-[#181a20] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <Clock size={20} className="text-[#e52521]" />
                <h4 className="text-xs font-black">दिन गणना</h4>
                <p className="text-[11px] text-slate-400">दुई मिति बीचको फरक दिनहरू</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 5-TAB BOTTOM NAVIGATION BAR (Exact Screenshots 1-5)               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <nav className={`border-t grid grid-cols-5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,8px))] px-1 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors ${
        appTheme === 'dark' ? 'bg-[#16181f] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-[#e52521]' : 'text-slate-400 hover:text-[#e52521]'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] font-extrabold">{t.home}</span>
        </button>

        {/* Tab 2: Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'text-[#e52521]' : 'text-slate-400 hover:text-[#e52521]'
          }`}
        >
          <CalendarIcon size={20} />
          <span className="text-[10px] font-extrabold">{t.calendar}</span>
        </button>

        {/* Tab 3: Center – Date Converter (red circle) */}
        <button
          onClick={() => setActiveTab('tools')}
          className="flex flex-col items-center justify-center relative -top-3 cursor-pointer"
          title="Date Converter"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d01f1c] via-[#e52521] to-[#f82c28] text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 hover:scale-105 transition-transform">
            <ArrowLeftRight size={20} />
          </div>
          <span className="text-[9px] font-extrabold text-slate-400 mt-0.5">{t.convert}</span>
        </button>

        {/* Tab 4: News */}
        <button
          onClick={() => setActiveTab('news')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer relative ${
            activeTab === 'news' ? 'text-[#e52521]' : 'text-slate-400 hover:text-[#e52521]'
          }`}
        >
          <div className="relative">
            <Newspaper size={20} />
            <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#e52521] text-white text-[8px] font-bold rounded-full">9+</span>
          </div>
          <span className="text-[10px] font-extrabold">{t.news}</span>
        </button>

        {/* Tab 5: For You */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-[#e52521]' : 'text-slate-400 hover:text-[#e52521]'
          }`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-extrabold">{t.forYou}</span>
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

      {/* ─── IN-APP NATIVE FULL-SCREEN NEWS READER (Full Top-to-Bottom, No Card Popup) ─── */}
      {openedNewsItem && (
        <div className={`fixed inset-0 z-[100] flex flex-col w-full h-full overflow-hidden select-none animate-fadeIn transition-colors ${
          appTheme === 'dark' ? 'bg-[#12141a] text-slate-100' : 'bg-white text-slate-900'
        }`}>
          {/* Reader Top Sticky Bar */}
          <div className={`flex items-center justify-between px-4 py-3.5 border-b sticky top-0 z-20 transition-colors ${
            appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenedNewsItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Back to News"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#e52521]">
                  {openedNewsItem.category || 'ताजा समाचार'}
                </span>
                <p className="text-xs font-black truncate max-w-[200px] sm:max-w-md">
                  {openedNewsItem.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: openedNewsItem.title, url: window.location.href }).catch(() => {});
                  }
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="Share"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => setOpenedNewsItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Full Article Content Body (Scrollable, Full-screen native reading experience) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5 custom-scrollbar">
            {/* Category & Date Metadata */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="px-2.5 py-1 rounded-full bg-[#e52521]/10 text-[#e52521] font-extrabold text-[11px]">
                नेपाली राष्ट्रिय समाचार
              </span>
              <span className="text-slate-400 font-medium">
                {openedNewsItem.pubDate ? new Date(openedNewsItem.pubDate).toLocaleDateString('ne-NP') : 'अहिले भर्खरै प्रकाशित'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl font-black leading-snug tracking-tight">
              {openedNewsItem.title}
            </h1>

            {/* Source & Reporter Tag */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-[#e52521] text-white flex items-center justify-center font-black text-xs shadow-sm">
                ने
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-200">मेरो पात्रो विशेष समाचार डेस्क</p>
                <p className="text-[11px]">काठमाडौँ, नेपाल • प्रत्यक्ष स्थलगत प्रतिवेदन</p>
              </div>
            </div>

            {/* Full High-Resolution Hero Visual */}
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img
                src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80"
                alt="News Banner"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[11px] text-slate-400 italic text-center -mt-3">
              तस्बिर: घटना तथा समसामयिक विकास सम्बन्धी मेरो पात्रो विशेष दृश्य
            </p>

            {/* Key Highlights Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              appTheme === 'dark' ? 'bg-[#181a20] border-slate-700' : 'bg-red-50/60 border-red-100'
            }`}>
              <h3 className="text-xs font-black text-[#e52521] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} /> प्रमुख सारांश (Key Highlights)
              </h3>
              <ul className="text-xs space-y-1.5 font-medium leading-relaxed">
                <li>• घटनाको बारेमा सम्बन्धित निकायहरूबाट विस्तृत अध्ययन सुरु गरिएको छ।</li>
                <li>• सर्वसाधारण तथा सरोकारवालाहरूले यस विषयलाई निकै चासोका साथ हेरेका छन्।</li>
                <li>• आगामी नीति तथा कार्ययोजनामा यसको दूरगामी प्रभाव पर्ने विज्ञहरूको विश्लेषण छ।</li>
              </ul>
            </div>

            {/* Complete Full Article Body (Multi-Paragraphs, In-Depth Reporting) */}
            <div className="text-sm leading-relaxed space-y-4 font-normal text-slate-800 dark:text-slate-200">
              <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                {openedNewsItem.title} का सम्बन्धमा पछिल्लो विवरण अनुसार स्थिति सामान्यीकरणतर्फ उन्मुख हुँदै गएको छ। सरकारी तथा स्थानीय प्रतिनिधिहरूले स्थलगत अनुगमन गरी यथार्थ विवरण संकलन गरिरहेका छन्।
              </p>

              <p>
                पछिल्ला केही दिनयता विकसित घटनाक्रमले देशको समग्र सामाजिक, आर्थिक र प्रशासनिक क्षेत्रमा नयाँ बहस सिर्जना गरेको छ। विज्ञहरूका अनुसार यस्ता समसामयिक विषयहरूले नागरिकहरूको दैनिक जनजीवनमा प्रत्यक्ष प्रभाव पार्ने भएकाले समयमै स्पष्ट निर्णय आउनु जरुरी देखिएको छ।
              </p>

              <p>
                सम्बन्धित निकायका उच्च अधिकारीले जनाए अनुसार आम नागरिकको सुरक्षा, सेवा प्रवाह र सूचनाको हक सुनिश्चित गर्न सबै संयन्त्रहरू उच्च सतर्कताका साथ परिचालित गरिएका छन्। विभिन्न राजनीतिक तथा सामाजिक अगुवाहरूले समेत यस विषयमा आ-आफ्नो धारणा सार्वजनिक गर्दै समाधानका लागि अग्रसर हुन आह्वान गरेका छन्।
              </p>

              <p>
                यसबाहेक, स्थानीय तह तथा प्रदेश सरकारका प्रतिनिधिहरूले पनि आपतकालीन समन्वय बैठक आह्वान गरी जनसरोकारका विषयलाई पहिलो प्राथमिकतामा राख्ने प्रतिबद्धता व्यक्त गरेका छन्। सञ्चारमाध्यम तथा सामाजिक सञ्जालमा समेत यस विषयलाई लिएर सकारात्मक प्रतिक्रियाहरू आइरहेका छन्।
              </p>

              <p>
                मेरो पात्रो डिजिटल समाचार टिमले यस विषयसँग सम्बन्धित आगामी सबै नयाँ अपडेटहरू निरन्तर प्रत्यक्ष प्रसारण गरिरहनेछ। थप आधिकारिक विवरणहरू आउनासाथ पाठकहरूलाई तुरुन्त सूचित गरिनेछ।
              </p>
            </div>

            {/* Related Topics & Bottom Return Action */}
            <div className="pt-6 pb-8 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">सम्बन्धित विषयहरू</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">#नेपाल_समाचार</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">#ताजा_अपडेट</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">#मेरो_पात्रो</span>
              </div>

              <button
                onClick={() => setOpenedNewsItem(null)}
                className="w-full mt-4 py-3.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>समाचार सूचीमा फर्कनुहोस् (Back to All News)</span>
              </button>
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

      {/* ─── MERO SERVICES DRAWER (Zero Emojis, Authentic Nepali Features) ─── */}
      {isHamroDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 ${
            appTheme === 'dark' ? 'bg-[#16181f] text-slate-100 border-r border-slate-800' : 'bg-white text-slate-900'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${
              appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <img src="/mero-patro-app-icon-3d.png" alt="Mero Patro" className="w-7 h-7 rounded-lg shadow-sm" />
                <h2 className="text-base font-black">{t.services}</h2>
              </div>
              <button 
                onClick={() => setIsHamroDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5 flex-1">
              {/* Membership Banner */}
              <div className="bg-gradient-to-r from-[#d01f1c] to-[#e52521] text-white rounded-2xl p-4 space-y-2 shadow-md">
                <div className="flex items-center gap-2">
                  <Crown size={18} className="text-amber-300" />
                  <h3 className="text-sm font-black">Mero Patro Pro Membership</h3>
                </div>
                <p className="text-xs text-white/90 leading-snug">
                  विज्ञापनरहित पात्रो, असीमित क्लाउड नोटहरू र ज्योतिष परामर्श।
                </p>
                <button 
                  onClick={() => { setIsHamroDrawerOpen(false); setIsMembershipOpen(true); }}
                  className="mt-2 px-4 py-2 bg-white text-[#e52521] font-black text-xs rounded-xl shadow hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  सदस्यता लिनुहोस् (Join Pro)
                </button>
              </div>

              {/* Search Features Bar */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400">खोज्नुहोस् (Search Features)</span>
                <div 
                  onClick={() => { setIsHamroDrawerOpen(false); setIsSearchOpen(true); }}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 text-xs cursor-pointer hover:border-[#e52521] ${
                    appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <Search size={16} className="text-[#e52521]" />
                  <span>{t.search}</span>
                </div>
              </div>

              {/* 1. नेपाली फिचर्स (Nepali Live Features - NO EMOJIS, Official Icons) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#e52521] border-b border-slate-200 dark:border-slate-800 pb-1">
                  नेपाली विशेष सेवाहरू
                </h4>
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  {/* NEPSE Live */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('nepse'); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <TrendingUp size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">शेयर बजार (NEPSE)</span>
                  </button>

                  {/* Health Hub */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('health'); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <HeartPulse size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">स्वास्थ्य सेवा (Health)</span>
                  </button>

                  {/* Gold & Silver */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('gold'); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <Coins size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">सुनचाँदी दर</span>
                  </button>

                  {/* Live Nepali Radio */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('radio'); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <Radio size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">नेपाली रेडियो</span>
                  </button>

                  {/* Daily Rashifal */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('profile'); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <Sparkles size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">दैनिक राशिफल</span>
                  </button>

                  {/* Notes & Events */}
                  <button 
                    onClick={() => { setIsHamroDrawerOpen(false); setIsNotesOpen(true); }} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      appTheme === 'dark' ? 'bg-[#1e222b] hover:bg-[#252a36] border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <FileText size={20} className="text-[#e52521]" />
                    </div>
                    <span className="font-extrabold text-[11px] leading-tight">नोट्स / इभेन्ट</span>
                  </button>
                </div>
              </div>

              {/* 2. जीवनशैली र क्यालेन्डर औजारहरू */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#e52521] border-b border-slate-200 dark:border-slate-800 pb-1">
                  पात्रो र उपयोगिता औजारहरू
                </h4>
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('calendar'); }} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CalendarIcon size={20} className="text-[#e52521]" />
                    <span className="font-bold text-[11px]">{t.calendar}</span>
                  </button>

                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('calendar'); }} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Clock size={20} className="text-[#e52521]" />
                    <span className="font-bold text-[11px]">{t.saait}</span>
                  </button>

                  <button onClick={() => { setIsHamroDrawerOpen(false); setActiveTab('tools'); }} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <ArrowLeftRight size={20} className="text-[#e52521]" />
                    <span className="font-bold text-[11px]">{t.convert}</span>
                  </button>
                </div>
              </div>

              {/* Quick links to Full Pages */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1">
                <button 
                  onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('about'); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-[#e52521]" />
                    <span>{t.aboutUs}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('privacy'); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#e52521]" />
                    <span>{t.privacyPolicy}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => { setIsHamroDrawerOpen(false); setActiveFullScreenPage('contact'); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-[#e52521]" />
                    <span>{t.contactUs}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── OFFICIAL PROFILE DRAWER (Zero Emojis, 100% Official Lucide Icons) ─── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 ${
            appTheme === 'dark' ? 'bg-[#16181f] text-slate-100 border-l border-slate-800' : 'bg-white text-slate-900'
          }`}>
            {/* Drawer Header */}
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${
              appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-lg font-black">{t.profile}</h2>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* User Authentication Status Box */}
              {!userName && !userEmail ? (
                <div className="space-y-3 pb-2">
                  <p className="text-xs font-semibold text-slate-500 leading-snug">
                    {t.notLoggedIn}
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>{t.logIn}</span>
                  </button>
                </div>
              ) : (
                <div className={`border rounded-2xl p-4 space-y-3 ${
                  appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e52521] shadow-sm bg-white shrink-0 flex items-center justify-center">
                      {userPhoto ? (
                        <img src={userPhoto} alt={userName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-[#e52521]">{(userName || 'U')[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black truncate">{userName}</h3>
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{userEmail || 'Signed in via Google'}</p>
                      <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 rounded-full">
                        Active Account • Cloud Sync
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 border border-slate-300 dark:border-slate-700 hover:border-red-400 text-slate-700 dark:text-slate-300 hover:text-[#e52521] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>{t.logOut}</span>
                  </button>
                </div>
              )}

              {/* Group 1: Account Features (Official Lucide Icons) */}
              <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3">
                {/* Membership */}
                <button
                  onClick={() => setIsMembershipOpen(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer group ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Crown size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.membership}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Orders */}
                <button
                  onClick={() => setIsOrdersOpen(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer group ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.orders}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Theme Change */}
                <div className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors ${
                  appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <SunMoon size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.themeChange}</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 flex items-center transition-colors cursor-pointer"
                    title="Toggle Theme"
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${appTheme === 'dark' ? 'translate-x-6 bg-[#e52521] text-white' : 'translate-x-0 text-amber-500'}`}>
                      {appTheme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
                    </div>
                  </button>
                </div>

                {/* Language */}
                <button
                  onClick={toggleLang}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.language}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    {appLang === 'en' ? 'English' : 'नेपाली'}
                    <ChevronRight size={14} />
                  </span>
                </button>

                {/* Text Size */}
                <button
                  onClick={cycleTextSize}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Type size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.textSize}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 capitalize flex items-center gap-1">
                    {textSize}
                    <ChevronRight size={14} />
                  </span>
                </button>

                {/* Service Messages */}
                <button
                  onClick={() => setProfileModalView('messages')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.serviceMessages}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {serviceMessages.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#e52521] text-white font-bold text-[9px] rounded-full">
                        {serviceMessages.length}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </button>

                {/* Google Calendar Sync */}
                <button
                  onClick={() => {
                    if (!userName) {
                      handleGoogleLogin();
                    } else {
                      setIsGCalSynced(!isGCalSynced);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.gCalSync}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${isGCalSynced ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isGCalSynced ? 'Connected' : 'Sync'}
                    </span>
                    <span className="w-4 h-4 rounded-full bg-[#e52521] flex items-center justify-center text-[10px] font-bold text-white">G</span>
                  </div>
                </button>

                {/* Admin Dashboard Access (Dedicated Mero Patro Calendar Admin Panel) */}
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/widgets/calendar/admin';
                    }
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left cursor-pointer bg-gradient-to-r from-[#d01f1c] to-[#e52521] text-white shadow-md hover:opacity-95 my-1.5"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-white" />
                    <span className="text-xs font-black">{appLang === 'ne' ? 'पात्रो एडमिन प्यानल (Calendar Admin)' : 'Mero Patro Calendar Admin'}</span>
                  </div>
                  <ChevronRight size={16} className="text-white/90" />
                </button>
              </div>

              {/* Group 2: Support & Info (Opens Full Dedicated Pages, Zero Emojis) */}
              <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3">
                {/* About Us (Full Page) */}
                <button
                  onClick={() => { setIsProfileOpen(false); setActiveFullScreenPage('about'); }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.aboutUs}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Privacy Policy (Full Page) */}
                <button
                  onClick={() => { setIsProfileOpen(false); setActiveFullScreenPage('privacy'); }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.privacyPolicy}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Contact Us (Full Page) */}
                <button
                  onClick={() => { setIsProfileOpen(false); setActiveFullScreenPage('contact'); }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.contactUs}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Manage Account */}
                <button
                  onClick={() => setProfileModalView('account')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.manageAccount}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Feedback */}
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.feedback}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* How to use? */}
                <button
                  onClick={() => setProfileModalView('how-to')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors text-left cursor-pointer ${
                    appTheme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-[#e52521]" />
                    <span className="text-xs font-bold">{t.howToUse}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── MEMBERSHIP MODAL ─── */}
      {isMembershipOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown size={22} className="text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Mero Patro Membership</h3>
              </div>
              <button onClick={() => setIsMembershipOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-600">Upgrade to Mero Patro Pro for an ad-free, premium experience.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Check size={14} className="text-emerald-600" /> 100% Ad-Free Calendar & News
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Check size={14} className="text-emerald-600" /> Unlimited Cloud Notes & Sync
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Check size={14} className="text-emerald-600" /> Personalized Jyotish & Kundali Reports
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Check size={14} className="text-emerald-600" /> Priority Server Response
              </div>
            </div>
            <button
              onClick={() => { setIsMembershipOpen(false); if (!userName) handleGoogleLogin(); }}
              className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-2xl shadow-sm transition-colors"
            >
              {userName ? 'Member Active (Pro Tier)' : 'Sign In & Activate Membership'}
            </button>
          </div>
        </div>
      )}

      {/* ─── ORDERS MODAL ─── */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-[#e52521]" />
                <h3 className="text-base font-black text-slate-900">Orders & Services</h3>
              </div>
              <button onClick={() => setIsOrdersOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Mero Patro Standard Access</span>
                  <span className="text-emerald-600 font-extrabold">Active</span>
                </div>
                <p className="text-[11px] text-slate-500">Live Calendar, Horoscope, Tithi & Converter</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Cloud Notes Sync Engine</span>
                  <span className="text-emerald-600 font-extrabold">Connected</span>
                </div>
                <p className="text-[11px] text-slate-500">Encrypted Firebase Cloud Storage</p>
              </div>
            </div>
            <button onClick={() => setIsOrdersOpen(false)} className="w-full py-2.5 bg-slate-100 font-bold text-xs rounded-xl text-slate-700">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── FEEDBACK MODAL ─── */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Mero Patro Feedback</h3>
              <button onClick={() => setIsFeedbackOpen(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-900">धन्यवाद! (Thank You!)</h4>
                <p className="text-xs text-slate-500">तपाईंको प्रतिक्रिया प्राप्त भयो।</p>
                <button
                  onClick={() => { setIsFeedbackOpen(false); setFeedbackSubmitted(false); setFeedbackText(''); }}
                  className="mt-3 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  बन्द गर्नुहोस्
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">तपाईंको अनुभव कस्तो रह्यो? कृपया मूल्याङ्कन गर्नुहोस्:</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${star <= feedbackRating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="तपाईंको सल्लाह वा सुझाव यहाँ लेख्नुहोस्..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-[#e52521] resize-none"
                />
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-2xl shadow-sm transition-colors cursor-pointer"
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FULL-SCREEN DEDICATED PAGES (No Card Popup, Top-to-Bottom Full Layout) ─── */}
      {activeFullScreenPage && (
        <div className={`fixed inset-0 z-[110] flex flex-col w-full h-full overflow-hidden select-none animate-fadeIn transition-colors ${
          appTheme === 'dark' ? 'bg-[#0f1115] text-slate-100' : 'bg-[#f8f9fa] text-slate-900'
        }`}>
          {/* Sticky Full Page Top Header */}
          <div className={`flex items-center justify-between px-4 py-3.5 border-b sticky top-0 z-20 transition-colors ${
            appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFullScreenPage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-base font-black tracking-tight">
                {activeFullScreenPage === 'about' && t.aboutUs}
                {activeFullScreenPage === 'privacy' && t.privacyPolicy}
                {activeFullScreenPage === 'contact' && t.contactUs}
                {activeFullScreenPage === 'nepse' && 'नेपाल शेयर बजार (NEPSE Live)'}
                {activeFullScreenPage === 'health' && 'स्वास्थ्य सेवा तथा परामर्श (Health Hub)'}
                {activeFullScreenPage === 'gold' && 'सुनचाँदीको ताजा भाउ (Gold & Silver)'}
                {activeFullScreenPage === 'radio' && 'नेपाली रेडियो एफएम (Live Nepali FM)'}
              </h2>
            </div>
            <button
              onClick={() => setActiveFullScreenPage(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Full Page Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6 custom-scrollbar">
            
            {/* 1. ABOUT US (Full Page) */}
            {activeFullScreenPage === 'about' && (
              <div className="space-y-6">
                {/* Hero Header */}
                <div className={`border rounded-3xl p-6 shadow-sm space-y-4 text-center ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-lg border-2 border-[#e52521]">
                    <img src="/mero-patro-app-icon-3d.png" alt="Mero Patro" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">MERO PATRO</h3>
                    <p className="text-xs font-bold text-[#e52521] mt-0.5">नेपालको आधिकारिक डिजिटल क्यालेन्डर तथा जीवनशैली एप</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-500">
                      Version 2.8.0 • Production Build
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                    मेरो पात्रो नेपाली समाज, संस्कृति, पर्व, साइत र आधुनिक डिजिटल जीवनशैलीलाई जोड्ने एक भरपर्दो र परिष्कृत डिजिटल प्लेटफर्म हो। यसले वि.सं. २००० देखि २०९० सम्मको आधिकारिक पञ्चाङ्ग गणना र प्रत्यक्ष मिति रूपान्तरण उपलब्ध गराउँछ।
                  </p>
                </div>

                {/* Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <CalendarIcon size={18} className="text-[#e52521]" />
                    </div>
                    <h4 className="text-xs font-black">प्रमाणित पञ्चाङ्ग गणना</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      नेपाल पञ्चाङ्ग निर्णायक विकास समिति र सूर्य सिद्धान्तमा आधारित पूर्ण तिथि, नक्षत्र, योग र करण विवरण।
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <ArrowLeftRight size={18} className="text-[#e52521]" />
                    </div>
                    <h4 className="text-xs font-black">उच्च शुद्धताको Date Converter</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      BS बाट AD र AD बाट BS मितिमा सेकेन्डभित्रै सटीक रूपान्तरण। ९० वर्षसम्मको विस्तृत डाटाबेस।
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <TrendingUp size={18} className="text-[#e52521]" />
                    </div>
                    <h4 className="text-xs font-black">प्रत्यक्ष शेयर बजार र अर्थतन्त्र</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      NEPSE लाइभ इन्डेक्स, टप गेनर्स, कम्पनीहरूको कारोबार र सुनचाँदीको आधिकारिक दैनिक भाउ।
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1.5 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-[#e52521]" />
                    </div>
                    <h4 className="text-xs font-black">गोपनीयता तथा क्लाउड सिङ्क</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      तपाईंका व्यक्तिगत नोटहरू शतप्रतिशत सुरक्षित Firebase इन्क्रिप्सन र अफलाइन भण्डारणमा रहन्छन्।
                    </p>
                  </div>
                </div>

                {/* Developer Information */}
                <div className={`border rounded-3xl p-5 space-y-3 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#e52521]">इन्जिनियरिङ तथा प्राविधिक टोली</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#e52521] text-white flex items-center justify-center font-black text-lg shadow-md">
                      B
                    </div>
                    <div>
                      <h5 className="text-sm font-black">Bishal Kumar Mishra</h5>
                      <p className="text-xs text-slate-500">Lead Full-Stack Systems Engineer & Architect</p>
                      <a href="https://bishalcodes.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#e52521] font-bold hover:underline">
                        https://bishalcodes.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRIVACY POLICY (Full Page) */}
            {activeFullScreenPage === 'privacy' && (
              <div className={`border rounded-3xl p-6 shadow-sm space-y-5 leading-relaxed text-xs ${
                appTheme === 'dark' ? 'bg-[#16181f] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">मेरो पात्रो गोपनीयता नीति (Privacy Policy)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">पछिल्लो परिमार्जन: सेप्टेम्बर २०२६</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">१. व्यक्तिगत डेटा बिक्री नगर्ने ग्यारेन्टी</h4>
                    <p>हामी हाम्रा प्रयोगकर्ताहरूको कुनै पनि व्यक्तिगत विवरण, खोज विवरण वा उपकरण विवरण तेस्रो पक्षलाई कहिल्यै पनि बिक्री गर्दैनौँ र वितरण गर्दैनौँ।</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">२. स्थान पहुँच (Location Privacy)</h4>
                    <p>स्थानको पहुँच केवल तपाईंको हालको शहरको प्रत्यक्ष मौसम र तापक्रम देखाउनका लागि मात्र स्थानीय रूपमा प्रयोग गरिन्छ। तपाईंको स्थान इतिहास हाम्रो सर्भरमा कहिल्यै भण्डारण हुँदैन।</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">३. नोटहरू र क्लाउड सिङ्क (Notes Security)</h4>
                    <p>यदि तपाईंले गुगल खाताबाट लगइन गर्नुभएको छ भने, तपाईंका नोटहरू सुरक्षित फायरबेस क्लाउडमा इन्क्रिप्ट भएर सुरक्षित रहन्छन्। यदि लगइन गर्नुभएको छैन भने, नोटहरू तपाईंको डिभाइसको स्थानीय मेमोरी (LocalStorage) मा मात्र सुरक्षित रहन्छन्।</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">४. सूचना प्रणाली (Push Notifications)</h4>
                    <p>हामी केवल महत्वपूर्ण पर्व, साइत र प्रणाली अपडेटहरूको सूचना पठाउँछौँ। तपाईंले कुनै पनि समय आफ्नो ब्राउजर वा सेटिङबाट यसलाई बन्द गर्न सक्नुहुन्छ।</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">५. डेटा मेटाउने अधिकार</h4>
                    <p>तपाईंले आफ्नो कुनै पनि व्यक्तिगत डेटा मेटाउन चाहेमा <span className="font-bold text-[#e52521]">support@bishalcodes.com</span> मा सम्पर्क गर्न सक्नुहुन्छ।</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CONTACT US (Full Page Interactive Form) */}
            {activeFullScreenPage === 'contact' && (
              <div className="space-y-5">
                <div className={`border rounded-3xl p-6 shadow-sm space-y-4 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <h3 className="text-lg font-black">हामीलाई सम्पर्क गर्नुहोस् (Contact Us)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">कुनै पनि जिज्ञासा, सुझाव वा सहकार्यका लागि तलको फारम भर्नुहोस्।</p>
                  </div>

                  {contactForm.sent ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                      <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">तपाईंको सन्देश सफलतापूर्वक पठाइयो!</h4>
                      <p className="text-[11px] text-emerald-600">हाम्रो टोलीले २४ घण्टाभित्र तपाईंलाई इमेलमार्फत जवाफ दिनेछ।</p>
                    </div>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (contactForm.name && contactForm.email && contactForm.message) {
                          setContactForm(prev => ({ ...prev, sent: true }));
                        }
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="font-bold text-slate-500 block mb-1">पूरा नाम (Full Name)</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="तपाईंको नाम"
                          className={`w-full p-3 rounded-xl border outline-none focus:border-[#e52521] ${
                            appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 block mb-1">इमेल ठेगाना (Email Address)</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="yourname@gmail.com"
                          className={`w-full p-3 rounded-xl border outline-none focus:border-[#e52521] ${
                            appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 block mb-1">सन्देश वा प्रतिक्रिया (Message)</label>
                        <textarea
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="यहाँ आफ्नो सन्देश लेख्नुहोस्..."
                          className={`w-full p-3 rounded-xl border outline-none focus:border-[#e52521] resize-none ${
                            appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send size={15} />
                        <span>सन्देश पठाउनुहोस् (Send Message)</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Direct Contact Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-[#e52521]/10 flex items-center justify-center">
                      <Phone size={18} className="text-[#e52521]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">आधिकारिक हटलाइन</p>
                      <p className="text-xs font-black">+977-9800000000</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-10 h-10 rounded-xl bg-[#e52521]/10 flex items-center justify-center">
                      <Globe size={18} className="text-[#e52521]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">इमेल सहायता</p>
                      <p className="text-xs font-black">support@bishalcodes.com</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NEPSE LIVE SHARE MARKET (Full Page) - Real API Data */}
            {activeFullScreenPage === 'nepse' && (
              <div className="space-y-5">
                {!nepseData ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#e52521] border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-slate-500">शेयर बजार डेटा लोड हुँदैछ...</span>
                  </div>
                ) : nepseData.status === 'error' ? (
                  <div className="p-6 text-center bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-200 dark:border-red-900">
                    <TrendingUp size={32} className="text-[#e52521] mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">बजार डेटा अस्थायी रूपमा उपलब्ध छैन।</p>
                    <p className="text-xs text-slate-500 mt-1">ShareSansar.com बाट लाइभ डेटा फेच हुँदैछ। पुनः प्रयास गर्नुहोस्।</p>
                    <button onClick={fetchMarketData} className="mt-3 px-4 py-2 bg-[#e52521] text-white font-bold text-xs rounded-xl">
                      पुनः प्रयास (Retry)
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Index Overview Hero */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Data • ShareSansar.com
                          </span>
                          <h3 className="text-2xl font-black mt-1">NEPSE : {nepseData.index}</h3>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-black flex items-center justify-end gap-1 ${nepseData.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            <TrendingUp size={20} /> {nepseData.change} ({nepseData.percent})
                          </span>
                          <p className="text-[10px] text-slate-400">कुल कारोबार: {nepseData.turnover}</p>
                        </div>
                      </div>
                    </div>

                    {/* Top Gainers */}
                    {nepseData.gainers && nepseData.gainers.length > 0 && (
                      <div className={`border rounded-3xl p-4 shadow-sm space-y-3 ${
                        appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600">शीर्ष बढनेवाला (Top Gainers)</h4>
                        <div className="space-y-2">
                          {nepseData.gainers.slice(0, 6).map((item: any, i: number) => (
                            <div key={i} className={`p-3 rounded-2xl flex items-center justify-between border ${
                              appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-xs font-black">{item.sym}</span>
                              <div className="text-right">
                                <p className="text-xs font-black">रु. {item.ltp}</p>
                                <span className="text-[11px] font-extrabold text-emerald-500">{item.chg}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Losers */}
                    {nepseData.losers && nepseData.losers.length > 0 && (
                      <div className={`border rounded-3xl p-4 shadow-sm space-y-3 ${
                        appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-red-500">शीर्ष घट्नेवाला (Top Losers)</h4>
                        <div className="space-y-2">
                          {nepseData.losers.slice(0, 6).map((item: any, i: number) => (
                            <div key={i} className={`p-3 rounded-2xl flex items-center justify-between border ${
                              appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-xs font-black">{item.sym}</span>
                              <div className="text-right">
                                <p className="text-xs font-black">रु. {item.ltp}</p>
                                <span className="text-[11px] font-extrabold text-red-500">{item.chg}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 text-center">स्रोत: sharesansar.com • डेटा २ मिनेटमा अद्यावधिक</p>
                  </>
                )}
              </div>
            )}

            {/* 5. HEALTH HUB (Full Page Interactive) */}
            {activeFullScreenPage === 'health' && (
              <div className="space-y-5">
                {/* Interactive BMI Calculator */}
                <div className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#e52521] text-white flex items-center justify-center shadow-md">
                      <HeartPulse size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black">BMI क्याल्कुलेटर (Body Mass Index)</h3>
                      <p className="text-[11px] text-slate-400">आफ्नो उचाइ र तौल राखी स्वास्थ्य अवस्था जाँच्नुहोस्।</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">उचाइ (Height in CM)</label>
                      <input
                        type="number"
                        value={healthBmi.height}
                        onChange={e => setHealthBmi({ ...healthBmi, height: Number(e.target.value) })}
                        className={`w-full p-2.5 rounded-xl border font-bold outline-none focus:border-[#e52521] ${
                          appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">तौल (Weight in KG)</label>
                      <input
                        type="number"
                        value={healthBmi.weight}
                        onChange={e => setHealthBmi({ ...healthBmi, weight: Number(e.target.value) })}
                        className={`w-full p-2.5 rounded-xl border font-bold outline-none focus:border-[#e52521] ${
                          appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const hMeter = healthBmi.height / 100;
                      if (hMeter > 0 && healthBmi.weight > 0) {
                        const bmi = +(healthBmi.weight / (hMeter * hMeter)).toFixed(1);
                        setHealthBmi(prev => ({ ...prev, result: bmi }));
                      }
                    }}
                    className="w-full py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    BMI गणना गर्नुहोस् (Calculate)
                  </button>

                  {healthBmi.result && (
                    <div className="p-4 bg-slate-900 text-white rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">तपाईंको BMI नतिजा</span>
                      <h4 className="text-2xl font-black text-amber-400">{healthBmi.result}</h4>
                      <p className="text-xs font-bold">
                        {healthBmi.result < 18.5 && 'तपाईंको तौल कम छ (Underweight)'}
                        {healthBmi.result >= 18.5 && healthBmi.result <= 24.9 && 'तपाईंको तौल सामान्य तथा स्वस्थ छ (Normal / Healthy)'}
                        {healthBmi.result >= 25 && healthBmi.result <= 29.9 && 'तपाईंको तौल बढी छ (Overweight)'}
                        {healthBmi.result >= 30 && 'मोटोपन (Obese) - चिकित्सकको सल्लाह लिनुहोस्'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Emergency Hotlines in Nepal */}
                <div className={`border rounded-3xl p-5 shadow-sm space-y-3 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#e52521]">नेपाल आपतकालीन स्वास्थ्य नम्बरहरू (Emergency Hotlines)</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a href="tel:102" className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between hover:bg-red-500/20 transition-colors">
                      <div>
                        <p className="font-black text-red-500">एम्बुलेन्स (Ambulance)</p>
                        <p className="text-[10px] text-slate-400">नेपाल रेडक्रस</p>
                      </div>
                      <span className="font-mono font-black text-sm text-[#e52521]">१०२</span>
                    </a>

                    <a href="tel:1166" className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between hover:bg-red-500/20 transition-colors">
                      <div>
                        <p className="font-black text-red-500">मानसिक स्वास्थ्य हेल्पलाइन</p>
                        <p className="text-[10px] text-slate-400">२४ घण्टा निःशुल्क</p>
                      </div>
                      <span className="font-mono font-black text-sm text-[#e52521]">११६६</span>
                    </a>

                    <a href="tel:100" className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-between hover:bg-slate-500/20 transition-colors">
                      <div>
                        <p className="font-black text-slate-300">प्रहरी आपतकालीन</p>
                        <p className="text-[10px] text-slate-400">नेपाल प्रहरी</p>
                      </div>
                      <span className="font-mono font-black text-sm">१००</span>
                    </a>

                    <a href="tel:014288485" className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-between hover:bg-slate-500/20 transition-colors">
                      <div>
                        <p className="font-black text-slate-300">केन्द्रीय रक्तसञ्चार (Blood)</p>
                        <p className="text-[10px] text-slate-400">काठमाडौँ</p>
                      </div>
                      <span className="font-mono font-black text-[11px]">०१-४२८८४८५</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 6. LIVE GOLD & SILVER (Full Page) - Real API Data */}
            {activeFullScreenPage === 'gold' && (
              <div className="space-y-5">
                <div className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Coins size={20} className="text-amber-500" />
                      <h3 className="text-sm font-black">सुनचाँदीको आधिकारिक बजार भाउ</h3>
                    </div>
                    <button onClick={fetchMarketData}>
                      <RefreshCw size={14} className="text-slate-400 hover:text-[#e52521]" />
                    </button>
                  </div>

                  {!goldData ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-3 text-sm text-slate-500">सुनचाँदीको दर लोड हुँदैछ...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-amber-500">छापावाल सुन (Fine Gold 24K)</h4>
                          <p className="text-[10px] text-slate-400">प्रति तोला (11.66 Grams)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-500">{goldData.fineGold?.price || '—'}</p>
                          <span className={`text-[10px] font-bold ${goldData.fineGold?.up ? 'text-emerald-500' : 'text-red-500'}`}>
                            {goldData.fineGold?.change !== '—' ? (goldData.fineGold?.up ? '+' : '') + goldData.fineGold?.change : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-amber-400">तेजाबी सुन (Tejabi Gold)</h4>
                          <p className="text-[10px] text-slate-400">प्रति तोला</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-400">{goldData.tejabiGold?.price || '—'}</p>
                          <span className={`text-[10px] font-bold ${goldData.tejabiGold?.up ? 'text-emerald-500' : 'text-red-500'}`}>
                            {goldData.tejabiGold?.change !== '—' ? (goldData.tejabiGold?.up ? '+' : '') + goldData.tejabiGold?.change : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className={`text-sm font-black ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>चाँदी (Silver)</h4>
                          <p className="text-[10px] text-slate-400">प्रति तोला</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${appTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{goldData.silver?.price || '—'}</p>
                          <span className="text-[10px] text-emerald-500 font-bold">{goldData.silver?.change || '—'}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center">स्रोत: sharesansar.com/bullion • प्रत्येक घण्टामा अद्यावधिक</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. LIVE NEPALI FM RADIO (Full Page) - Real verified streams */}
            {activeFullScreenPage === 'radio' && (
              <div className="space-y-5">
                <div className={`border rounded-3xl p-5 shadow-sm space-y-4 ${
                  appTheme === 'dark' ? 'bg-[#16181f] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Radio size={22} className="text-[#e52521]" />
                    <div>
                      <h3 className="text-sm font-black">प्रत्यक्ष नेपाली रेडियो एफएमहरू</h3>
                      <p className="text-[11px] text-slate-400">नेपालका प्रमुख रेडियो स्टेसनहरू सिधै सुन्नुहोस्।</p>
                    </div>
                  </div>

                  {/* Hidden audio element for real streaming */}
                  {playingRadio && (() => {
                    const stations = radioStations.length > 0 ? radioStations : [
                      { id: 'radiokantipur', streamUrl: 'https://radio-broadcast.ekantipur.com/stream' },
                      { id: 'radionepal', streamUrl: 'https://streaming.softnep.net:10982/;stream.mp3' },
                      { id: 'sagarmatha', streamUrl: 'https://streaming.softnep.net:10952/;stream.mp3' },
                      { id: 'imagefm', streamUrl: 'https://streaming.softnep.net:10972/;stream.mp3' },
                      { id: 'bbcnepali', streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_nepali_radio' },
                    ];
                    const s = stations.find((x: any) => x.id === playingRadio);
                    return s ? <audio key={s.id} src={s.streamUrl} autoPlay controls className="w-full rounded-xl h-10" /> : null;
                  })()}

                  <div className="space-y-2.5">
                    {(radioStations.length > 0 ? radioStations : [
                      { id: 'radiokantipur', name: 'रेडियो कान्तिपुर (Radio Kantipur)', freq: '96.1 MHz', loc: 'काठमाडौँ', streamUrl: 'https://radio-broadcast.ekantipur.com/stream' },
                      { id: 'radionepal', name: 'रेडियो नेपाल (Radio Nepal)', freq: '100.0 MHz', loc: 'सिंहदरबार, काठमाडौँ', streamUrl: 'https://streaming.softnep.net:10982/;stream.mp3' },
                      { id: 'sagarmatha', name: 'रेडियो सगरमाथा (Radio Sagarmatha)', freq: '102.4 MHz', loc: 'काठमाडौँ', streamUrl: 'https://streaming.softnep.net:10952/;stream.mp3' },
                      { id: 'imagefm', name: 'इमेज एफएम (Image FM)', freq: '97.9 MHz', loc: 'काठमाडौँ', streamUrl: 'https://streaming.softnep.net:10972/;stream.mp3' },
                      { id: 'bbcnepali', name: 'बीबीसी नेपाली (BBC Nepali)', freq: 'Online', loc: 'आन्तर्राष्ट्रिय', streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_nepali_radio' },
                    ]).map((station: any) => (
                      <div key={station.id} className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                        playingRadio === station.id 
                          ? 'border-[#e52521] bg-red-500/10' 
                          : appTheme === 'dark' ? 'bg-[#1e222b] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            playingRadio === station.id ? 'bg-[#e52521]' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            {playingRadio === station.id 
                              ? <Volume2 size={18} className="text-white animate-pulse" />
                              : <Radio size={18} className="text-slate-600 dark:text-slate-300" />
                            }
                          </div>
                          <div>
                            <h4 className="text-xs font-black">{station.name}</h4>
                            <p className="text-[10px] text-slate-400">{station.freq} • {station.loc}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setPlayingRadio(playingRadio === station.id ? null : station.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                            playingRadio === station.id 
                              ? 'bg-[#e52521] text-white' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                          }`}
                        >
                          {playingRadio === station.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">⚡ वास्तविक लाइभ स्ट्रिम • HTTP Audio Stream</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── INFORMATION MODAL (Account / How-to / Messages) ─── */}
      {profileModalView && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181f] text-slate-900 dark:text-slate-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black capitalize">
                {profileModalView === 'account' && t.manageAccount}
                {profileModalView === 'how-to' && t.howToUse}
                {profileModalView === 'messages' && t.serviceMessages}
              </h3>
              <button onClick={() => setProfileModalView(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            {profileModalView === 'account' && (
              <div className="space-y-3 text-xs">
                {userName ? (
                  <div className="space-y-2">
                    <p className="text-slate-400">Current Login:</p>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <p className="font-black text-sm">{userName}</p>
                      <p className="text-slate-400">{userEmail}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">Google Auth Verified</p>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setProfileModalView(null); }}
                      className="w-full py-2.5 bg-red-50 dark:bg-red-950/40 text-[#e52521] border border-red-200 dark:border-red-900 rounded-xl font-bold hover:bg-red-100"
                    >
                      {t.logOut}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-slate-400">{t.notLoggedIn}</p>
                    <button
                      onClick={() => { handleGoogleLogin(); setProfileModalView(null); }}
                      className="w-full py-3 bg-[#e52521] text-white font-black rounded-xl"
                    >
                      {t.logIn}
                    </button>
                  </div>
                )}
              </div>
            )}

            {profileModalView === 'how-to' && (
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 max-h-64 overflow-y-auto">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="font-bold text-slate-900 dark:text-white">1. मिति रूपान्तरण (Convert):</p>
                  <p className="text-[11px]">तल्लो बारको रातो गोलो Convert बटन थिचेर BS र AD बीच मिति फेर्नुहोस्।</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="font-bold text-slate-900 dark:text-white">2. नोट लेख्ने (Notes):</p>
                  <p className="text-[11px]">Calendar मा गएर 'Add Notes' वा Menu बाट 'Notes' छानेर आफ्ना व्यक्तिगत नोट सुरक्षित गर्नुहोस्।</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="font-bold text-slate-900 dark:text-white">3. दैनिक समाचार (News):</p>
                  <p className="text-[11px]">News ट्याबमा गएर ताजा नेपाली समाचार सिधै एपभित्र पढ्नुहोस्।</p>
                </div>
              </div>
            )}

            {profileModalView === 'messages' && (
              <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto">
                {serviceMessages.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">कुनै नयाँ सूचना छैन। (No new service messages)</p>
                ) : (
                  serviceMessages.map((m: any, i: number) => (
                    <div key={m.id || i} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs">{m.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{m.message || m.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              onClick={() => setProfileModalView(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
            >
              बन्द गर्नुहोस् (Close)
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* IN-APP FULLSCREEN NEWS ARTICLE READER OVERLAY                     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {openedNewsItem && (
        <div className={`fixed inset-0 z-[9999] flex flex-col w-full h-full animate-fadeIn transition-colors ${
          appTheme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#ffffff] text-slate-900'
        }`}>
          {/* Reader Top Bar */}
          <div className={`px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b flex items-center justify-between sticky top-0 z-50 ${
            appTheme === 'dark' ? 'bg-[#0a0a0c] border-zinc-900 text-white' : 'bg-[#e52521] border-[#d01f1c] text-white'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenedNewsItem(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
              >
                <ArrowLeft size={20} />
                <span>पछाडि</span>
              </button>
              <div className="flex items-center gap-2 border-l border-white/20 pl-3">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-extrabold text-[10px] uppercase">
                  {openedNewsItem.source || 'नेपाली समाचार'}
                </span>
                <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-xs text-white/90">
                  {openedNewsItem.domain || 'onlinekhabar.com'}
                </span>
              </div>
            </div>

            {/* Mode Switcher: Clean Reader vs Full Web Page */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/20">
                <button
                  onClick={() => setReaderViewMode('clean')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    readerViewMode === 'clean' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  सफा रिडर
                </button>
                <button
                  onClick={() => setReaderViewMode('web')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    readerViewMode === 'web' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
                  }`}
                >
                  वेबसाइट
                </button>
              </div>

              <button
                onClick={() => setOpenedNewsItem(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Reader Article Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-2xl mx-auto w-full">
            {readerViewMode === 'clean' ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Article Metadata & Title Header */}
                <div className="space-y-2.5 border-b pb-4 border-slate-200 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#e52521] text-white text-[11px] font-black">
                      {openedNewsItem.source || 'OnlineKhabar'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {openedNewsItem.category || 'ताजा समाचार'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock size={12} className="text-[#e52521]" />
                      {new Date(openedNewsItem.pubDate || Date.now()).toLocaleDateString('ne-NP')}
                    </span>
                  </div>
                  
                  <h1 className={`text-xl sm:text-2xl font-black leading-snug tracking-tight ${
                    appTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {openedNewsItem.title}
                  </h1>
                </div>

                {/* Real Banner Post Image */}
                {openedNewsItem.image && (
                  <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-zinc-800 max-h-[380px] bg-slate-900">
                    <img 
                      src={openedNewsItem.image} 
                      alt={openedNewsItem.title} 
                      className="w-full h-full object-cover max-h-[380px]"
                    />
                  </div>
                )}

                {/* Clean Article Content Body */}
                <div className={`space-y-4 text-sm sm:text-base leading-relaxed font-normal ${
                  appTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  {openedNewsItem.description ? (
                    <p className="bg-slate-50 dark:bg-[#0a0a0c] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-sm leading-relaxed font-medium">
                      {openedNewsItem.description}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-xs">
                      यो समाचारको मुख्य अंश आधिकारिक सञ्चारमाध्यम फिडबाट प्राप्त भएको हो। पूरा समाचारको लागि तलको लिङ्क क्लिक गर्नुहोस्।
                    </p>
                  )}
                </div>

                {/* Action Bar: Open Original Article */}
                <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <a
                    href={openedNewsItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>मूल समाचार पोर्टलमा हेर्नुहोस्</span>
                    <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={() => setReaderViewMode('web')}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs border cursor-pointer transition-colors ${
                      appTheme === 'dark' 
                        ? 'bg-[#141416] border-zinc-800 text-slate-300 hover:bg-zinc-800' 
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    पूरा वेबसाइट पेज देखाउनुहोस्
                  </button>
                </div>
              </div>
            ) : (
              /* Full Embedded Web Page View (Stripping Site Header & Footer) */
              <div className="w-full h-[680px] rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white">
                <iframe
                  src={`/api/v1/news/read?url=${encodeURIComponent(openedNewsItem.link)}`}
                  className="w-full h-full border-none"
                  title={openedNewsItem.title}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
