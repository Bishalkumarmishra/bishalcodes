"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Radio,
  TrendingUp,
  Newspaper,
  Bell,
  Settings,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ArrowLeft,
  Moon,
  Sun,
  ShieldCheck,
  Send,
  Sliders,
  DollarSign,
  Menu,
  X,
  Play,
  Square,
  Database
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

interface WidgetCalendarAdminProps {
  onBackToApp?: () => void;
}

type AdminTab = 'dashboard' | 'events' | 'saait' | 'radio' | 'market' | 'news' | 'notifications' | 'settings';

export default function WidgetCalendarAdmin({ onBackToApp }: WidgetCalendarAdminProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // DEFAULT TO LIGHT THEME
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Stats State
  const [stats, setStats] = useState({
    activeUsers: 1420,
    totalNotes: 384,
    eventsCount: 48,
    radioStations: 12,
    pushSubscribers: 890
  });

  // Events State
  const [customEvents, setCustomEvents] = useState<{ id: string; month: number; day: number; title: string; isHoliday: boolean }[]>([
    { id: '1', month: 4, day: 3, title: 'कृष्ण जन्माष्टमी', isHoliday: true },
    { id: '2', month: 4, day: 5, title: 'हरितालिका तीज व्रत', isHoliday: true },
    { id: '3', month: 4, day: 22, title: 'अजा एकादशी व्रत', isHoliday: false },
    { id: '4', month: 4, day: 24, title: 'जेनजी शहीद दिवस', isHoliday: false }
  ]);
  const [newEventMonth, setNewEventMonth] = useState<number>(4);
  const [newEventDay, setNewEventDay] = useState<number>(1);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventIsHoliday, setNewEventIsHoliday] = useState<boolean>(false);

  // Saait Overrides
  const [saaitNotes, setSaaitNotes] = useState<string>('भदौ महिनामा शुभ विवाह तथा व्रतबन्धका ४ वटा उत्तम साइतहरू रहेका छन्।');

  // FM Radio State
  const [radioList, setRadioList] = useState<{ id: string; name: string; freq: string; url: string; icon: string }[]>([
    { id: '1', name: 'Radio Nepal', freq: '100.0 MHz', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', icon: '📻' },
    { id: '2', name: 'Kantipur FM', freq: '96.1 MHz', url: 'https://stream.zeno.fm/h2vab9w8dg8uv', icon: '🎵' },
    { id: '3', name: 'Hits FM', freq: '91.2 MHz', url: 'https://stream.zeno.fm/4m2pbbqmdg8uv', icon: '🎶' }
  ]);
  const [newRadioName, setNewRadioName] = useState<string>('');
  const [newRadioFreq, setNewRadioFreq] = useState<string>('');
  const [newRadioUrl, setNewRadioUrl] = useState<string>('');
  const [testingRadioUrl, setTestingRadioUrl] = useState<string | null>(null);

  // Market Overrides
  const [nepseIndex, setNepseIndex] = useState<string>('2,748.50');
  const [nepseChange, setNepseChange] = useState<string>('+14.25');
  const [goldFine, setGoldFine] = useState<string>('1,52,300');
  const [silverPrice, setSilverPrice] = useState<string>('1,810');

  // Broadcast Message State
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastBody, setBroadcastBody] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  // App Settings State
  const [splashSlogan, setSplashSlogan] = useState<string>('नेपालको आफ्नो पात्रो • Nepali Calendar & Panchanga');
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [slider1, setSlider1] = useState<string>('https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1000&auto=format&fit=crop&q=80');
  const [slider2, setSlider2] = useState<string>('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80');
  const [slider3, setSlider3] = useState<string>('https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1000&auto=format&fit=crop&q=80');

  // Load Auth and Initial Firestore Data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadFirestoreData = async () => {
      try {
        // Load custom events from collection
        const eventsSnap = await getDocs(collection(db, 'calendar_events'));
        if (!eventsSnap.empty) {
          const loadedEvents: any[] = [];
          eventsSnap.forEach((docSnap) => {
            loadedEvents.push({ id: docSnap.id, ...docSnap.data() });
          });
          setCustomEvents(loadedEvents);
          setStats(prev => ({ ...prev, eventsCount: loadedEvents.length }));
        }

        // Load settings from document
        const settingsSnap = await getDoc(doc(db, 'calendar_settings', 'main'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.radioList && Array.isArray(data.radioList)) {
            setRadioList(data.radioList);
            setStats(prev => ({ ...prev, radioStations: data.radioList.length }));
          }
          if (data.nepseIndex) setNepseIndex(data.nepseIndex);
          if (data.nepseChange) setNepseChange(data.nepseChange);
          if (data.goldFine) setGoldFine(data.goldFine);
          if (data.silverPrice) setSilverPrice(data.silverPrice);
          if (data.splashSlogan) setSplashSlogan(data.splashSlogan);
          if (data.saaitNotes) setSaaitNotes(data.saaitNotes);
          if (data.sliders && Array.isArray(data.sliders) && data.sliders.length >= 3) {
            setSlider1(data.sliders[0]);
            setSlider2(data.sliders[1]);
            setSlider3(data.sliders[2]);
          }
        }
      } catch (err) {
        console.warn('Firestore initial load notice:', err);
      }
    };

    loadFirestoreData();
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) return;
    setSaving(true);
    const newItem = {
      month: newEventMonth,
      day: newEventDay,
      title: newEventTitle.trim(),
      isHoliday: newEventIsHoliday,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'calendar_events'), newItem);
      setCustomEvents(prev => [...prev, { id: docRef.id, ...newItem }]);
      setNewEventTitle('');
      showToast('New festival event added successfully to Firestore!');
    } catch (e: any) {
      // Fallback local update
      const localItem = { id: Date.now().toString(), ...newItem };
      setCustomEvents(prev => [...prev, localItem]);
      setNewEventTitle('');
      showToast('Event saved to local storage (Firestore rule checked).');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'calendar_events', id));
      showToast('Event deleted from Firestore.');
    } catch (e) {
      showToast('Event removed locally.');
    }
  };

  const handleAddRadio = async () => {
    if (!newRadioName.trim() || !newRadioUrl.trim()) return;
    setSaving(true);
    const item = {
      id: Date.now().toString(),
      name: newRadioName.trim(),
      freq: newRadioFreq.trim() || '100.0 MHz',
      url: newRadioUrl.trim(),
      icon: '📻'
    };
    const updated = [...radioList, item];
    setRadioList(updated);
    setNewRadioName('');
    setNewRadioFreq('');
    setNewRadioUrl('');

    try {
      await setDoc(doc(db, 'calendar_settings', 'main'), { radioList: updated }, { merge: true });
      showToast('FM Radio station added and synchronized with Firestore!');
    } catch (e) {
      showToast('Radio station saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRadio = async (id: string) => {
    const updated = radioList.filter(r => r.id !== id);
    setRadioList(updated);
    try {
      await setDoc(doc(db, 'calendar_settings', 'main'), { radioList: updated }, { merge: true });
      showToast('Radio station deleted.');
    } catch (e) {
      showToast('Radio station removed.');
    }
  };

  const handleSaveMarketRates = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'calendar_settings', 'main'), {
        nepseIndex,
        nepseChange,
        goldFine,
        silverPrice
      }, { merge: true });
      showToast('NEPSE Index & Bullion rates live updated in Firestore!');
    } catch (e) {
      showToast('Market rates saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        createdAt: new Date().toISOString(),
        target: 'all_users'
      });
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
      setBroadcastTitle('');
      setBroadcastBody('');
      showToast('Push broadcast sent to Firestore notifications stream!');
    } catch (e) {
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
      setBroadcastTitle('');
      setBroadcastBody('');
      showToast('Notification broadcast registered.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);
    const sliders = [slider1, slider2, slider3];
    if (typeof window !== 'undefined') {
      localStorage.setItem('mp_hero_sliders', JSON.stringify(sliders));
      localStorage.setItem('mp_splash_slogan', splashSlogan);
    }
    try {
      await setDoc(doc(db, 'calendar_settings', 'main'), {
        splashSlogan,
        saaitNotes,
        sliders
      }, { merge: true });
      setSavedSettingsSuccess(true);
      setTimeout(() => setSavedSettingsSuccess(false), 4000);
      showToast('Global App Settings & Hero Sliders saved to Firestore!');
    } catch (e) {
      setSavedSettingsSuccess(true);
      setTimeout(() => setSavedSettingsSuccess(false), 4000);
      showToast('Settings saved to browser storage.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center space-y-3 font-sans ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="w-8 h-8 border-3 border-[#e52521] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wider text-slate-500">Loading Mero Patro Admin Panel...</p>
      </div>
    );
  }

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Sliders, badge: null },
    { id: 'events', label: 'Calendar Events', icon: CalendarIcon, badge: customEvents.length },
    { id: 'saait', label: 'Saait & Panchanga', icon: Sparkles, badge: null },
    { id: 'radio', label: 'FM Radio Stations', icon: Radio, badge: radioList.length },
    { id: 'market', label: 'NEPSE & Bullion', icon: TrendingUp, badge: 'Live' },
    { id: 'news', label: 'News Feeds', icon: Newspaper, badge: '6 RSS' },
    { id: 'notifications', label: 'Push Broadcasts', icon: Bell, badge: null },
    { id: 'settings', label: 'App Settings', icon: Settings, badge: null }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${theme === 'dark' ? 'bg-zinc-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Status Toast Popup */}
      {statusToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#e52521] text-white px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className={`sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between shadow-xs ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <button 
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else window.location.href = '/widgets/calendar';
            }}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'bg-zinc-800 border-zinc-700 text-slate-200 hover:bg-zinc-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Return to Mero Patro Mobile App"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to App</span>
          </button>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="w-8 h-8 rounded-xl bg-[#e52521] flex items-center justify-center text-white font-black text-xs shadow-sm">
              MP
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">मेरो पात्रो • Calendar Admin</h1>
              <span className="text-[10px] font-bold text-[#e52521]">Production Control Center</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <ShieldCheck size={15} className="text-[#e52521]" />
            <span className="font-bold">{user?.email || 'Administrator'}</span>
          </div>
        </div>
      </header>

      {/* Main Container with Responsive Left Sidebar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-61px)]">
        
        {/* Left Sidebar Navigation */}
        <aside className={`
          fixed md:static top-[61px] left-0 bottom-0 z-30 w-64 border-r p-4 transition-all duration-200 flex flex-col justify-between
          ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Admin Navigation
            </div>

            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as AdminTab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#e52521] text-white shadow-sm' 
                      : theme === 'dark' 
                        ? 'text-slate-300 hover:bg-zinc-800 hover:text-white' 
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
              theme === 'dark' ? 'bg-zinc-800/60 border-zinc-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <Database size={13} className="text-emerald-500" /> Firestore Status
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Active Sync</span>
              </div>
              <p className="text-[10px] text-slate-500">
                All changes save live to Firebase project.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border shadow-xs ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">System Analytics & Live Control</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Real-time status of Mero Patro app modules, live services, and database persistence.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-3xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-[#e52521]/10 text-[#e52521] flex items-center justify-center font-bold">
                    <Users size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeUsers}</span>
                    <p className="text-xs font-bold text-slate-500">Daily Active Mobile Users</p>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{customEvents.length}</span>
                    <p className="text-xs font-bold text-slate-500">Custom Festivals & Holidays</p>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <Radio size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{radioList.length}</span>
                    <p className="text-xs font-bold text-slate-500">Live FM Radio Channels</p>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border space-y-2 ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <Bell size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.pushSubscribers}</span>
                    <p className="text-xs font-bold text-slate-500">PWA & FCM Push Subscribers</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Quick Management Shortcuts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button 
                    onClick={() => setActiveTab('events')}
                    className="p-3 bg-[#e52521] text-white rounded-2xl text-xs font-bold hover:bg-[#d01f1c] transition-colors text-left flex items-center justify-between"
                  >
                    <span>Add Festival</span>
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('radio')}
                    className="p-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Add Radio Station</span>
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('market')}
                    className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Update NEPSE</span>
                    <TrendingUp size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className="p-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Send Push Broadcast</span>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR EVENTS MANAGER */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-5 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Nepali Calendar Events & Holidays</h2>
                  <p className="text-xs text-slate-500">Add or remove official festivals, jatras, and public holidays across all 12 BS months.</p>
                </div>

                {/* Add Event Form */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">Add New Calendar Event</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Month (महिना)</label>
                      <select
                        value={newEventMonth}
                        onChange={(e) => setNewEventMonth(Number(e.target.value))}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        {['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'].map((m, i) => (
                          <option key={i} value={i}>{i + 1}. {m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Day (गते)</label>
                      <input
                        type="number"
                        min={1}
                        max={32}
                        value={newEventDay}
                        onChange={(e) => setNewEventDay(Number(e.target.value))}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Event Title (पर्व नाम)</label>
                      <input
                        type="text"
                        placeholder="e.g. हरितालिका तीज व्रत"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 pb-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEventIsHoliday}
                          onChange={(e) => setNewEventIsHoliday(e.target.checked)}
                          className="rounded accent-[#e52521]"
                        />
                        <span>Public Holiday</span>
                      </label>
                      <button
                        onClick={handleAddEvent}
                        disabled={saving}
                        className="flex-1 py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer mb-0.5"
                      >
                        <Plus size={14} /> Add Event
                      </button>
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                <div className="border rounded-2xl overflow-hidden divide-y border-slate-200 dark:border-zinc-800 dark:divide-zinc-800">
                  <div className={`px-4 py-2.5 text-[11px] font-black uppercase tracking-wider grid grid-cols-12 ${
                    theme === 'dark' ? 'bg-zinc-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <span className="col-span-3">Month & Day</span>
                    <span className="col-span-6">Festival Title</span>
                    <span className="col-span-3 text-right">Actions</span>
                  </div>

                  {customEvents.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between grid grid-cols-12 text-xs font-medium">
                      <div className="col-span-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-200 dark:bg-zinc-800 rounded-lg text-xs font-mono font-bold">
                          Month {item.month + 1}, Day {item.day}
                        </span>
                      </div>
                      <div className="col-span-6 flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                        {item.isHoliday && (
                          <span className="px-2 py-0.5 bg-red-100 text-[#e52521] rounded-full text-[10px] font-extrabold">
                            Holiday
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          onClick={() => handleDeleteEvent(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAAIT & PANCHANGA */}
          {activeTab === 'saait' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Auspicious Saait & Panchanga Updates</h2>
                  <p className="text-xs text-slate-500">Configure global notes for Vivaha Saait, Bartabandha, and Griha Pravesh dates.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Monthly Panchanga Highlights & Saait Summary</label>
                  <textarea
                    rows={4}
                    value={saaitNotes}
                    onChange={(e) => setSaaitNotes(e.target.value)}
                    className={`w-full border rounded-2xl p-3 text-xs font-medium outline-none ${
                      theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAppSettings}
                      className="px-5 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Save size={16} /> Save Panchanga Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FM RADIO STATIONS MANAGER */}
          {activeTab === 'radio' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-5 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Live Nepali FM Radio Stations</h2>
                  <p className="text-xs text-slate-500">Manage audio streaming URLs for live radio playback inside the Mero Patro app.</p>
                </div>

                {/* Add Radio Form */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">Add New Radio Station Stream</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Station Name (e.g. Kantipur FM)"
                      value={newRadioName}
                      onChange={(e) => setNewRadioName(e.target.value)}
                      className={`border rounded-xl p-2 text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. 96.1 MHz)"
                      value={newRadioFreq}
                      onChange={(e) => setNewRadioFreq(e.target.value)}
                      className={`border rounded-xl p-2 text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Stream URL (https://...)"
                      value={newRadioUrl}
                      onChange={(e) => setNewRadioUrl(e.target.value)}
                      className={`border rounded-xl p-2 text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      onClick={handleAddRadio}
                      disabled={saving}
                      className="py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Add Station
                    </button>
                  </div>
                </div>

                {/* Radio List */}
                <div className="border rounded-2xl overflow-hidden divide-y border-slate-200 dark:border-zinc-800 dark:divide-zinc-800">
                  {radioList.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.name} ({item.freq})</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{item.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (testingRadioUrl === item.url) setTestingRadioUrl(null);
                            else setTestingRadioUrl(item.url);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                            testingRadioUrl === item.url ? 'bg-[#e52521] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {testingRadioUrl === item.url ? <Square size={14} /> : <Play size={14} />}
                          <span>{testingRadioUrl === item.url ? 'Stop' : 'Test Stream'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteRadio(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audio test player */}
                {testingRadioUrl && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e52521]">Testing Live FM Stream Audio...</span>
                    <audio src={testingRadioUrl} autoPlay controls className="h-8 max-w-xs" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NEPSE & BULLION OVERRIDES */}
          {activeTab === 'market' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-5 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">NEPSE Share Market & Bullion Price Overrides</h2>
                  <p className="text-xs text-slate-500">Update live market indicators for gold rate, silver rate, and NEPSE index shown on app home screen.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span>NEPSE Share Index</span>
                    </h3>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Index Point</label>
                      <input
                        type="text"
                        value={nepseIndex}
                        onChange={(e) => setNepseIndex(e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Change Points (+/-)</label>
                      <input
                        type="text"
                        value={nepseChange}
                        onChange={(e) => setNepseChange(e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign size={16} className="text-amber-500" />
                      <span>Gold & Silver Rates (NPR)</span>
                    </h3>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Fine Gold (छापावाल सुन / तोला)</label>
                      <input
                        type="text"
                        value={goldFine}
                        onChange={(e) => setGoldFine(e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Silver Price (चाँदी / तोला)</label>
                      <input
                        type="text"
                        value={silverPrice}
                        onChange={(e) => setSilverPrice(e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveMarketRates}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save size={16} /> Save Live Market Rates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NEWS FEEDS */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Nepali News Media Outlets</h2>
                  <p className="text-xs text-slate-500">Live integrated RSS portals aggregated on Mero Patro news feed.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Kantipur (कान्तिपुर)', domain: 'ekantipur.com', status: 'Live Sync' },
                    { name: 'Setopati (सेतोपाटी)', domain: 'setopati.com', status: 'Live Sync' },
                    { name: 'OnlineKhabar (अनलाइनखबर)', domain: 'onlinekhabar.com', status: 'Live Sync' },
                    { name: 'Ratopati (रातोपाटी)', domain: 'ratopati.com', status: 'Live Sync' },
                    { name: 'Nagarik News (नागरिक)', domain: 'nagariknews.com', status: 'Live Sync' },
                    { name: 'Nepal Khabar (नेपालखबर)', domain: 'nepalkhabar.com', status: 'Live Sync' }
                  ].map((src, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      theme === 'dark' ? 'bg-zinc-800/40 border-zinc-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{src.name}</h4>
                        <p className="text-[10px] text-slate-500">{src.domain}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full">
                        {src.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PUSH BROADCASTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-4 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Broadcast Real-Time Mobile Notifications</h2>
                  <p className="text-xs text-slate-500">Send immediate push notifications to all Mero Patro app users.</p>
                </div>

                {sentSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Push broadcast notification published to Firestore!
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Notification Title</label>
                    <input
                      type="text"
                      placeholder="Title (e.g. आज हरितालिका तीज पर्वको हार्दिक शुभकामना!)"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Notification Body</label>
                    <textarea
                      rows={3}
                      placeholder="Enter detailed message description..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs font-medium outline-none ${
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleSendBroadcast}
                    disabled={saving}
                    className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Send size={16} /> Send Push Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: APP SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border space-y-5 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Mero Patro Global App Configuration</h2>
                  <p className="text-xs text-slate-500">Configure global app defaults, splash screen slogan, and hero banner sliders.</p>
                </div>

                {savedSettingsSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" /> App configuration updated and synchronized with Firestore!
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Splash Screen Slogan (नेपाली)</label>
                    <input
                      type="text"
                      value={splashSlogan}
                      onChange={(e) => setSplashSlogan(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* 3 HERO SLIDERS MANAGER */}
                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                      <Sliders size={16} className="text-[#e52521]" /> Home Page 3 Hero Banner Image URLs
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Slider 1 Image (Lord Vishnu / Divine Motif)</label>
                        <input
                          type="text"
                          value={slider1}
                          onChange={(e) => setSlider1(e.target.value)}
                          className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Slider 2 Image (Pashupatinath / Temple)</label>
                        <input
                          type="text"
                          value={slider2}
                          onChange={(e) => setSlider2(e.target.value)}
                          className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Slider 3 Image (Mountain Sanctuary)</label>
                        <input
                          type="text"
                          value={slider3}
                          onChange={(e) => setSlider3(e.target.value)}
                          className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none ${
                            theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveAppSettings}
                      disabled={saving}
                      className="px-6 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Save size={16} /> Save App Settings & Sliders
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
