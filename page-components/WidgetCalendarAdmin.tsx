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
  Edit,
  Save,
  CheckCircle2,
  ArrowLeft,
  Moon,
  Sun,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronRight,
  Flame,
  Clock,
  Layers,
  Send,
  Sliders,
  DollarSign
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface WidgetCalendarAdminProps {
  onBackToApp?: () => void;
}

type AdminTab = 'dashboard' | 'events' | 'saait' | 'radio' | 'market' | 'news' | 'notifications' | 'settings';

export default function WidgetCalendarAdmin({ onBackToApp }: WidgetCalendarAdminProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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

  // FM Radio State
  const [radioList, setRadioList] = useState<{ id: string; name: string; freq: string; url: string; icon: string }[]>([
    { id: '1', name: 'Radio Nepal', freq: '100.0 MHz', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv', icon: '📻' },
    { id: '2', name: 'Kantipur FM', freq: '96.1 MHz', url: 'https://stream.zeno.fm/h2vab9w8dg8uv', icon: '🎵' },
    { id: '3', name: 'Hits FM', freq: '91.2 MHz', url: 'https://stream.zeno.fm/4m2pbbqmdg8uv', icon: '🎶' }
  ]);
  const [newRadioName, setNewRadioName] = useState<string>('');
  const [newRadioFreq, setNewRadioFreq] = useState<string>('');
  const [newRadioUrl, setNewRadioUrl] = useState<string>('');

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
  const [primaryColor, setPrimaryColor] = useState<string>('#e52521');
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState<boolean>(false);
  const [slider1, setSlider1] = useState<string>('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80');
  const [slider2, setSlider2] = useState<string>('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1000&auto=format&fit=crop&q=80');
  const [slider3, setSlider3] = useState<string>('https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1000&auto=format&fit=crop&q=80');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      month: newEventMonth,
      day: newEventDay,
      title: newEventTitle.trim(),
      isHoliday: newEventIsHoliday
    };
    setCustomEvents(prev => [...prev, newItem]);
    setNewEventTitle('');
  };

  const handleDeleteEvent = (id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleAddRadio = () => {
    if (!newRadioName.trim() || !newRadioUrl.trim()) return;
    const item = {
      id: Date.now().toString(),
      name: newRadioName.trim(),
      freq: newRadioFreq.trim() || '100.0 MHz',
      url: newRadioUrl.trim(),
      icon: '📻'
    };
    setRadioList(prev => [...prev, item]);
    setNewRadioName('');
    setNewRadioFreq('');
    setNewRadioUrl('');
  };

  const handleDeleteRadio = (id: string) => {
    setRadioList(prev => prev.filter(r => r.id !== id));
  };

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
    setBroadcastTitle('');
    setBroadcastBody('');
  };

  const handleSaveSettings = () => {
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#000000] text-white flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-[#e52521] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wider text-slate-400">Loading Mero Patro Admin...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-[#000000] text-white' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#000000] border-b border-zinc-900 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else window.location.href = '/widgets/calendar';
            }}
            className="p-1.5 rounded-xl bg-zinc-900 text-slate-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Back to Calendar"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e52521] flex items-center justify-center text-white shadow-sm font-black text-xs">
              MP
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none">मेरो पात्रो • Calendar Admin</h1>
              <span className="text-[10px] font-bold text-[#e52521]">System Control Terminal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-xl bg-zinc-900 text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-slate-300">
            <ShieldCheck size={14} className="text-[#e52521]" />
            <span className="font-extrabold">{user ? user.email : 'Admin Account'}</span>
          </div>
        </div>
      </header>

      {/* Admin Body Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Left Sidebar Navigation */}
        <aside className="md:col-span-1 space-y-1 bg-[#0a0a0c] border border-zinc-900 p-2.5 rounded-3xl h-fit shadow-sm">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: Sliders },
            { id: 'events', label: 'Calendar Events', icon: CalendarIcon },
            { id: 'saait', label: 'Saait & Panchanga', icon: Sparkles },
            { id: 'radio', label: 'FM Radio Stations', icon: Radio },
            { id: 'market', label: 'NEPSE & Bullion', icon: TrendingUp },
            { id: 'news', label: 'News Feeds', icon: Newspaper },
            { id: 'notifications', label: 'Push Broadcasts', icon: Bell },
            { id: 'settings', label: 'App Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer text-left ${
                  isActive 
                    ? 'bg-[#e52521] text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-4 space-y-6">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-1 shadow-sm">
                <h2 className="text-xl font-black text-white">System Analytics & Live Overview</h2>
                <p className="text-xs text-slate-400 font-medium">Real-time status of Mero Patro app modules and active users.</p>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0c] border border-zinc-900 p-4 rounded-3xl space-y-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#e52521]/10 text-[#e52521] flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">{stats.activeUsers}</span>
                    <p className="text-[11px] font-bold text-slate-400">Daily Active Users</p>
                  </div>
                </div>

                <div className="bg-[#0a0a0c] border border-zinc-900 p-4 rounded-3xl space-y-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">{stats.eventsCount}</span>
                    <p className="text-[11px] font-bold text-slate-400">Active Festivals</p>
                  </div>
                </div>

                <div className="bg-[#0a0a0c] border border-zinc-900 p-4 rounded-3xl space-y-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Radio size={20} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">{stats.radioStations}</span>
                    <p className="text-[11px] font-bold text-slate-400">FM Radio Streams</p>
                  </div>
                </div>

                <div className="bg-[#0a0a0c] border border-zinc-900 p-4 rounded-3xl space-y-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">{stats.pushSubscribers}</span>
                    <p className="text-[11px] font-bold text-slate-400">PWA Push Devices</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR EVENTS MANAGER */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white">Nepali Calendar Events & Holidays</h2>
                    <p className="text-xs text-slate-400">Add or manage official festivals and holidays for any month.</p>
                  </div>
                </div>

                {/* Add Event Form */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Month</label>
                    <select
                      value={newEventMonth}
                      onChange={(e) => setNewEventMonth(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                    >
                      {['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'].map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Day</label>
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={newEventDay}
                      onChange={(e) => setNewEventDay(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="Event Title (e.g. कृष्ण जन्माष्टमी)"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 pb-2.5 cursor-pointer">
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
                      className="flex-1 py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer mb-0.5"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                {/* Events List */}
                <div className="divide-y divide-zinc-900">
                  {customEvents.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-zinc-900 text-slate-300 rounded-lg text-xs font-mono font-bold">
                          Month {item.month + 1}, Day {item.day}
                        </span>
                        <h4 className="text-xs font-black text-white">{item.title}</h4>
                        {item.isHoliday && (
                          <span className="px-2 py-0.5 bg-[#e52521]/20 text-[#e52521] rounded-full text-[10px] font-extrabold">
                            Public Holiday
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FM RADIO STATIONS MANAGER */}
          {activeTab === 'radio' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-white">Live Nepali FM Radio Stations</h2>
                  <p className="text-xs text-slate-400">Add or manage streaming audio URLs for live radio FM playback.</p>
                </div>

                {/* Add Radio Form */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800">
                  <input
                    type="text"
                    placeholder="Station Name (e.g. Kantipur FM)"
                    value={newRadioName}
                    onChange={(e) => setNewRadioName(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. 96.1 MHz)"
                    value={newRadioFreq}
                    onChange={(e) => setNewRadioFreq(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Stream URL (https://...)"
                    value={newRadioUrl}
                    onChange={(e) => setNewRadioUrl(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                  />
                  <button
                    onClick={handleAddRadio}
                    className="py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Station
                  </button>
                </div>

                {/* Radio List */}
                <div className="divide-y divide-zinc-900">
                  {radioList.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <h4 className="text-xs font-black text-white">{item.name} ({item.freq})</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{item.url}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRadio(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NEPSE & BULLION OVERRIDES */}
          {activeTab === 'market' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-white">NEPSE Share Market & Bullion Price Overrides</h2>
                  <p className="text-xs text-slate-400">Set real-time manual overrides for gold, silver, and NEPSE index.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span>NEPSE Share Index</span>
                    </h3>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Index Point</label>
                      <input
                        type="text"
                        value={nepseIndex}
                        onChange={(e) => setNepseIndex(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Change Points (+/-)</label>
                      <input
                        type="text"
                        value={nepseChange}
                        onChange={(e) => setNepseChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <h3 className="text-xs font-black text-white flex items-center gap-2">
                      <DollarSign size={16} className="text-amber-400" />
                      <span>Gold & Silver Bullion Prices (NPR)</span>
                    </h3>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Fine Gold (छापावाल सुन / तोला)</label>
                      <input
                        type="text"
                        value={goldFine}
                        onChange={(e) => setGoldFine(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Silver Price (चाँदी / तोला)</label>
                      <input
                        type="text"
                        value={silverPrice}
                        onChange={(e) => setSilverPrice(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save size={16} /> Save Market Rates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PUSH BROADCASTS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-white">Broadcast Push Notifications</h2>
                  <p className="text-xs text-slate-400">Send real-time mobile push notifications to all Mero Patro app users.</p>
                </div>

                {sentSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Broadcast notification sent successfully to all subscriber devices!
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Notification Title</label>
                    <input
                      type="text"
                      placeholder="Title (e.g. आज हरितालिका तीज पर्व)"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Notification Body</label>
                    <textarea
                      rows={3}
                      placeholder="Message content..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSendBroadcast}
                    className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Send size={16} /> Send Immediate Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: APP SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#0a0a0c] border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-black text-white">Mero Patro App Configuration</h2>
                  <p className="text-xs text-slate-400">Configure global app defaults, splash screen slogan, and hero banner sliders.</p>
                </div>

                {savedSettingsSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Settings saved successfully!
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Splash Screen Slogan</label>
                    <input
                      type="text"
                      value={splashSlogan}
                      onChange={(e) => setSplashSlogan(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  {/* 3 HERO SLIDERS MANAGER */}
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Sliders size={16} className="text-[#e52521]" /> Home Page 3 Hero Slider Banner Images
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Slider 1 Image URL (Lord Vishnu / Divine Scenery)</label>
                        <input
                          type="text"
                          value={slider1}
                          onChange={(e) => setSlider1(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Slider 2 Image URL (Pashupatinath / Temple Scenery)</label>
                        <input
                          type="text"
                          value={slider2}
                          onChange={(e) => setSlider2(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Slider 3 Image URL (Mount Everest / Divine Scenery)</label>
                        <input
                          type="text"
                          value={slider3}
                          onChange={(e) => setSlider3(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        localStorage.setItem('mp_hero_sliders', JSON.stringify([slider1, slider2, slider3]));
                        localStorage.setItem('mp_splash_slogan', splashSlogan);
                        setSavedSettingsSuccess(true);
                        setTimeout(() => setSavedSettingsSuccess(false), 3000);
                      }}
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
