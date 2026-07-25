
import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { useNavigation } from '../context/NavigationContext';
import {
  LogOut, Edit3, Check, X, Loader2, ChevronRight, Star, Shield, Code2,
  Brain, QrCode, BookOpen, Wrench, GitCompare, Camera, Clock, Key, AlertTriangle, RefreshCw, Zap
} from 'lucide-react';

const quickTools = [
  { label: 'AI Studio', icon: Brain, desc: 'Chat with AI assistant', page: 'ai-studio', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
  { label: 'Docs', icon: BookOpen, desc: 'Read the documentation', page: 'docs', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
  { label: 'Tools', icon: Wrench, desc: 'Developer utilities', page: 'services', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
  { label: 'QR Studio', icon: QrCode, desc: 'Generate & scan QR codes', page: 'services', pageId: 'qr-code-studio', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
  { label: 'Diff Checker', icon: GitCompare, desc: 'Compare text & code', page: 'services', pageId: 'diff-checker', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
  { label: 'JSON Tools', icon: Code2, desc: 'Format & validate JSON', page: 'services', pageId: 'json-formatter', color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
];

const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
  if (name && name.trim()) return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return 'U';
};

const compressImageIfNeeded = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // Only compress images that are larger than 9MB (9 * 1024 * 1024 bytes)
    if (!file.type.startsWith('image/') || file.size <= 9 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down dimensions if extremely large to prevent browser crash
        const maxDimension = 4096;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG at 0.90 high quality (visually identical but ~90% size reduction)
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.90
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const UserDashboard: React.FC = () => {
  const { navigate } = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userProfileData, setUserProfileData] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      if (!u) { navigate('login'); return; }
      setUser(u);
      setNewName(u.displayName || '');
      setLoading(false);

      try {
        // Update user profile in Firestore
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          lastActive: Date.now()
        }, { merge: true });

        // Fetch user profile data to check subscription status & expiration
        const userDocSnap = await getDoc(doc(db, 'users', u.uid));
        if (userDocSnap.exists()) {
          const pData = userDocSnap.data();
          setUserProfileData(pData);

          // Expiration 7-day automatic courtesy reminder check
          if (pData.api_expires_at) {
            const daysLeft = Math.max(0, Math.ceil((pData.api_expires_at - Date.now()) / (1000 * 60 * 60 * 24)));
            if (daysLeft <= 7 && daysLeft > 0 && !sessionStorage.getItem(`reminder_sent_${u.uid}`)) {
              sessionStorage.setItem(`reminder_sent_${u.uid}`, 'true');
              fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'subscription-reminder',
                  data: {
                    email: u.email,
                    planName: pData.api_plan_name || 'Active API Plan',
                    daysLeft,
                    expiresDate: new Date(pData.api_expires_at).toLocaleDateString(),
                    generatedApiKey: pData.api_production_key
                  }
                })
              });
            }
          }
        }

        // Log session login once
        if (!sessionStorage.getItem('logged_login_activity')) {
          sessionStorage.setItem('logged_login_activity', 'true');
          await addDoc(collection(db, 'user_activity'), {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || u.email,
            activityType: 'login',
            details: 'Signed into the user portal',
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.warn("Could not log user metadata/activity:", err);
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 95MB limit check
    if (file.size > 95 * 1024 * 1024) {
      alert(`File size too large. Got ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum limit is 95MB.`);
      return;
    }

    setUploading(true);
    try {
      // Compress large images client-side to pass Cloudinary's 10MB limit transparently
      const processedFile = await compressImageIfNeeded(file);
      const result = await uploadToCloudinary(processedFile);
      await updateProfile(user, { photoURL: result.url });
      setUser({ ...user, photoURL: result.url } as User);
      
      // Update users collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: result.url,
        lastActive: Date.now()
      }, { merge: true });

      // Log activity
      await addDoc(collection(db, 'user_activity'), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        activityType: 'profile_picture_updated',
        details: 'Updated profile picture',
        timestamp: Date.now()
      });
      
      alert('Profile picture updated successfully!');
    } catch (err: any) {
      console.error("Profile picture upload failure details:", err);
      alert("Failed to upload profile picture. Please try again with a different image or format.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    if (!newName.trim()) { setNameError('Name cannot be empty.'); return; }
    setSavingName(true);
    setNameError('');
    try {
      await updateProfile(user, { displayName: newName.trim() });
      setUser({ ...user, displayName: newName.trim() } as User);

      // Update users collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: newName.trim(),
        photoURL: user.photoURL || '',
        lastActive: Date.now()
      }, { merge: true });

      // Log activity
      await addDoc(collection(db, 'user_activity'), {
        uid: user.uid,
        email: user.email,
        displayName: newName.trim(),
        activityType: 'display_name_updated',
        details: `Updated display name to: ${newName.trim()}`,
        timestamp: Date.now()
      });

      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch {
      setNameError('Failed to update name. Try again.');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    );
  }

  const initials = getInitials(user?.displayName, user?.email);
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const daysRemaining = userProfileData?.api_expires_at 
    ? Math.max(0, Math.ceil((userProfileData.api_expires_at - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 hover:opacity-95">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white font-bold">
              <Code2 size={16} />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Bishal<span className="text-slate-950">Codes</span>
            </span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium hidden sm:inline">User Portal</span>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition-colors">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content (Full Screen Width container) */}
      <div className="w-full px-6 py-8">
        
        {/* Header Hero Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-200 cursor-pointer group bg-slate-900 flex items-center justify-center"
              >
                {uploading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                ) : (
                  <>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-extrabold tracking-wider">
                        {initials}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150">
                      <Camera size={18} />
                    </div>
                  </>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {user?.displayName ? `Hi, ${user.displayName.split(' ')[0]}` : 'Welcome'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  <Star size={10} className="fill-current text-slate-900" /> Member
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-2">Member since {memberSince}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 flex flex-col items-center justify-center text-center self-start md:self-auto min-w-[140px]">
            <span className="text-2xl font-black text-slate-900">∞</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Free Access</span>
          </div>
        </div>

        {/* Active API Subscription & Expiration Tracking Card */}
        {userProfileData?.api_production_key && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 mb-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Key size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {userProfileData.api_plan_name || 'Commercial API Plan'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      daysRemaining === 0 
                        ? 'bg-rose-100 text-rose-700' 
                        : (daysRemaining !== null && daysRemaining <= 7)
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {daysRemaining === 0 ? 'EXPIRED' : (daysRemaining !== null && daysRemaining <= 7) ? 'EXPIRING SOON' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live Production Endpoint Access • Rate Limit: {userProfileData.api_limit ? userProfileData.api_limit.toLocaleString() : '50,000'} req/mo
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('checkout', 'pro')}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm"
              >
                <RefreshCw size={13} />
                Renew / Upgrade Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Days Left Indicator */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Clock size={13} /> Days Remaining</span>
                  <span className="font-extrabold text-slate-900">{daysRemaining !== null ? `${daysRemaining} Days` : '30 Days'}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      daysRemaining === 0 ? 'bg-rose-500' : (daysRemaining !== null && daysRemaining <= 7) ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${daysRemaining !== null ? Math.max(5, ((30 - daysRemaining) / 30) * 100) : 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  {daysRemaining !== null ? `Expires on ${new Date(userProfileData.api_expires_at).toLocaleDateString()}` : '30-Day Auto Billing Cycle'}
                </div>
              </div>

              {/* API Key Display Box */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Your Live API Key</span>
                  <span className="text-slate-500 font-mono text-[9px]">x-api-key header</span>
                </div>
                <code className="block bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-xs font-bold text-slate-900 select-all break-all shadow-2xs">
                  {userProfileData.api_production_key}
                </code>
              </div>
            </div>

            {/* 7-Day Warning Notification Banner */}
            {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span>Courtesy Reminder: Your plan expires in <strong>{daysRemaining} days</strong>. Click <strong>Renew Plan</strong> above to prevent API key throttling.</span>
              </div>
            )}
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Access Area (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {quickTools.map((tool) => (
                <div
                  key={tool.label}
                  onClick={() => navigate(tool.page as any, (tool as any).pageId)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-350 hover:shadow-sm cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                    <tool.icon size={20} className="text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-slate-950 transition-colors text-sm mb-1">{tool.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{tool.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-950 group-hover:underline">
                    Open <ChevronRight size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Panel (Right sidebar column) */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Settings</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              
              {/* Display Name Box */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                {editingName ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-lg text-sm text-slate-900 outline-none transition-colors"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Your name"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNewName(user?.displayName || ''); } }}
                    />
                    {nameError && <p className="text-xs text-rose-600">{nameError}</p>}
                    <div className="flex gap-2">
                      <button onClick={handleSaveName} disabled={savingName} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                        {savingName ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button onClick={() => { setEditingName(false); setNewName(user?.displayName || ''); setNameError(''); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2">
                    <span className={`text-sm ${user?.displayName ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                      {user?.displayName || 'Not set'}
                    </span>
                    <button onClick={() => setEditingName(true)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:underline">
                      <Edit3 size={11} /> Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email Box */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 font-medium break-all">
                  {user?.email}
                </div>
              </div>

              {/* UID Box */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">User ID</label>
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2.5 text-[10px] text-slate-400 font-mono break-all leading-normal">
                  {user?.uid}
                </div>
              </div>

              {/* Sign-in Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sign-in Method</label>
                <div className="flex gap-1.5 flex-wrap">
                  {user?.providerData?.map((p: any) => (
                    <span key={p.providerId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {p.providerId === 'google.com' ? '🔵 Google' : p.providerId === 'github.com' ? '⚫ GitHub' : '✉️ Email'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-2 border-t border-slate-100">
                <button onClick={handleSignOut} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>

            </div>

            <button onClick={() => navigate('home')} className="w-full inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors">
              ← Back to main site
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
