"use client";

import React, { useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Video, FileText, Trash2, Copy, Check, ExternalLink, Search, RefreshCw, Loader2, HardDrive, X } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { uploadToCloudinary, CloudinaryUploadResult } from '../services/cloudinary';

export interface MediaAsset {
  id?: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf' | 'raw';
  publicId?: string;
  sizeBytes?: number;
  createdAt: number;
  source?: string;
}

// Media Assets Management Section for Admin Panel
export default function AdminMediaAssets() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'image' | 'video' | 'pdf'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    fetchAndMigrateMedia();
  }, []);

  // Fetch ALL media directly from Cloudinary Account API + scan all site collections (Projects, Blog, Services, Hero, Notifications)
  const fetchAndMigrateMedia = async () => {
    try {
      setLoading(true);
      const allAssetsMap = new Map<string, MediaAsset>();

      // 1. Fetch ALL Cloudinary account assets directly from /api/cloudinary/resources API
      try {
        const cRes = await fetch('/api/cloudinary/resources');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.resources && Array.isArray(cData.resources)) {
            cData.resources.forEach((item: MediaAsset) => {
              allAssetsMap.set(item.url, item);
            });
          }
        }
      } catch (err) {
        console.warn('Failed calling /api/cloudinary/resources API:', err);
      }

      // 2. Fetch saved Firestore media assets (safe query without order constraints)
      try {
        const snapshot = await getDocs(collection(db, 'media_assets'));
        snapshot.docs.forEach(d => {
          const data = d.data() as MediaAsset;
          if (data.url) {
            allAssetsMap.set(data.url, { id: d.id, ...data });
          }
        });
      } catch (err) {
        console.warn('Error reading media_assets Firestore collection:', err);
      }

      // Helper to classify URL type
      const getMediaType = (url: string): 'image' | 'video' | 'pdf' | 'raw' => {
        const lowercase = url.toLowerCase();
        if (lowercase.includes('.mp4') || lowercase.includes('.webm') || lowercase.includes('.mov') || lowercase.includes('video')) return 'video';
        if (lowercase.includes('.pdf')) return 'pdf';
        return 'image';
      };

      // Helper to safely add discovered URL from site collections
      const trackMediaUrl = (url: string | undefined | null, name: string, source: string) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
        if (!allAssetsMap.has(url)) {
          allAssetsMap.set(url, {
            name: name || 'Site Media Asset',
            url: url,
            type: getMediaType(url),
            createdAt: Date.now(),
            source: source
          });
        }
      };

      // 3. Scan Projects collection
      try {
        const projSnap = await getDocs(collection(db, 'projects'));
        projSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          if (Array.isArray(d.images)) {
            d.images.forEach((img: any, idx: number) => {
              const url = typeof img === 'string' ? img : img?.url;
              trackMediaUrl(url, `Project: ${d.title || 'Untitled'} (#${idx + 1})`, 'Projects');
            });
          }
        });
      } catch (e) { console.warn('Projects scan error:', e); }

      // 4. Scan Blog collection
      try {
        const blogSnap = await getDocs(collection(db, 'blog'));
        blogSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          trackMediaUrl(d.imageUrl, `Blog Cover: ${d.title || 'Article'}`, 'Blog');
        });
      } catch (e) { console.warn('Blog scan error:', e); }

      // 5. Scan Services collection
      try {
        const serviceSnap = await getDocs(collection(db, 'services'));
        serviceSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          trackMediaUrl(d.iconUrl, `Service Icon: ${d.title || 'Tool'}`, 'Services');
          trackMediaUrl(d.bgImageUrl, `Service Background: ${d.title || 'Tool'}`, 'Services');
        });
      } catch (e) { console.warn('Services scan error:', e); }

      // 6. Scan Notifications collection
      try {
        const notifSnap = await getDocs(collection(db, 'notifications'));
        notifSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          trackMediaUrl(d.fileUrl, `Push Notification: ${d.title || 'Broadcast'}`, 'Notifications');
        });
      } catch (e) { console.warn('Notifications scan error:', e); }

      // 7. Scan Testimonials & Settings/Hero
      try {
        const testSnap = await getDocs(collection(db, 'testimonials'));
        testSnap.docs.forEach(docSnap => {
          const d = docSnap.data();
          trackMediaUrl(d.avatarUrl || d.imageUrl, `Testimonial: ${d.name || 'Client'}`, 'Testimonials');
        });

        const heroSnap = await getDoc(doc(db, 'settings', 'hero'));
        if (heroSnap.exists()) {
          const h = heroSnap.data();
          if (Array.isArray(h.slides)) {
            h.slides.forEach((s: any, idx: number) => {
              const url = typeof s === 'string' ? s : s?.imageUrl;
              trackMediaUrl(url, `Hero Slide #${idx + 1}`, 'Hero Settings');
            });
          }
          if (h.aboutData) {
            trackMediaUrl(h.aboutData.imageUrl, 'About Profile Image', 'About');
            if (Array.isArray(h.aboutData.images)) {
              h.aboutData.images.forEach((u: string, idx: number) => trackMediaUrl(u, `About Photo #${idx + 1}`, 'About'));
            }
          }
        }
      } catch (e) { console.warn('Settings/Testimonials scan error:', e); }

      const finalAssetList = Array.from(allAssetsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setAssets(finalAssetList);
    } catch (e) {
      console.warn('Error fetching and migrating media assets:', e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading ${file.name} to Cloudinary...`);
        const result: CloudinaryUploadResult = await uploadToCloudinary(file);

        const newAsset: MediaAsset = {
          name: file.name,
          url: result.url,
          type: result.type,
          publicId: result.publicId,
          sizeBytes: file.size,
          createdAt: Date.now(),
          source: 'Cloudinary Direct Upload'
        };

        try {
          const docRef = await addDoc(collection(db, 'media_assets'), newAsset);
          newAsset.id = docRef.id;
        } catch (err) { console.warn('Saved local asset:', err); }

        setAssets(prev => [newAsset, ...prev]);
      }
      alert('Media files uploaded to Cloudinary successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Error uploading file to Cloudinary'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id || asset.url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`Are you sure you want to remove "${asset.name}" from your media library view?`)) return;
    try {
      if (asset.id) {
        await deleteDoc(doc(db, 'media_assets', asset.id));
      }
      setAssets(prev => prev.filter(a => a.url !== asset.url));
    } catch (err) {
      console.error('Error deleting asset:', err);
      setAssets(prev => prev.filter(a => a.url !== asset.url));
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || asset.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Cloud Asset';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Light Theme Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e52521]/10 border border-[#e52521]/20 text-[#e52521] rounded-lg text-xs font-semibold uppercase tracking-wider mb-2">
            <HardDrive size={14} /> Cloudinary & Site Media Library
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cloudinary Media Assets & Site Gallery</h2>
          <p className="text-slate-500 text-xs mt-1">
            All files stored on your Cloudinary account and used across BishalCodes listed in full quality.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setSyncing(true); fetchAndMigrateMedia(); }}
            disabled={loading || syncing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Fetch all media files directly from Cloudinary account & site database"
          >
            <RefreshCw size={14} className={syncing || loading ? 'animate-spin text-[#e52521]' : 'text-slate-600'} />
            {syncing ? 'Fetching Cloudinary Assets...' : 'Fetch All Cloudinary Media'}
          </button>

          <label className="px-4 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 shrink-0">
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Uploading to Cloudinary...
              </>
            ) : (
              <>
                <UploadCloud size={16} /> Upload New Files (100MB)
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media files by title, category, or Cloudinary URL..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedTypeFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({assets.length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              selectedTypeFilter === 'image' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon size={13} /> Images ({assets.filter(a => a.type === 'image').length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              selectedTypeFilter === 'video' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Video size={13} /> Videos ({assets.filter(a => a.type === 'video').length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('pdf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              selectedTypeFilter === 'pdf' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText size={13} /> PDFs/Docs ({assets.filter(a => a.type === 'pdf' || a.type === 'raw').length})
          </button>
        </div>
      </div>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin text-[#e52521] mx-auto" size={32} />
          <p className="text-xs font-semibold text-slate-600">Connecting to Cloudinary Account & fetching media assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <UploadCloud size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Cloudinary media found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Fetch All Cloudinary Media" above or upload images and videos directly to your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 pb-12">
          {filteredAssets.map(asset => (
            <div
              key={asset.id || asset.url}
              className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Media Preview Container */}
              <div 
                onClick={() => setPreviewAsset(asset)}
                className="h-28 sm:h-44 bg-slate-950 flex items-center justify-center relative overflow-hidden cursor-pointer p-1"
              >
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                ) : asset.type === 'video' ? (
                  <video src={asset.url} className="w-full h-full object-contain" muted />
                ) : (
                  <div className="text-center p-2 space-y-1">
                    <FileText size={28} className="text-[#e52521] mx-auto" />
                    <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[120px]">{asset.name}</span>
                  </div>
                )}

                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-extrabold uppercase rounded-md border border-slate-700 shadow-sm truncate max-w-[45%]">
                  {asset.type}
                </span>

                {asset.source && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#e52521]/90 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold rounded-md shadow-sm truncate max-w-[45%]">
                    {asset.source}
                  </span>
                )}
              </div>

              {/* Card Footer Details */}
              <div className="p-2 sm:p-3 bg-slate-50 border-t border-slate-100 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2">
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate" title={asset.name}>
                    {asset.name}
                  </h4>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5 flex items-center justify-between gap-1 truncate">
                    <span>{formatFileSize(asset.sizeBytes)}</span>
                    <span className="hidden sm:inline">{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 pt-1.5 sm:pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => handleCopyUrl(asset)}
                    className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg text-[9px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      copiedId === (asset.id || asset.url)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {copiedId === (asset.id || asset.url) ? (
                      <>
                        <Check size={11} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> <span className="hidden sm:inline">Copy Link</span><span className="sm:hidden">Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 sm:p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                    title="Open full resolution"
                  >
                    <ExternalLink size={12} />
                  </a>

                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-1 sm:p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete from view"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 space-y-4 text-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold truncate text-slate-900">{previewAsset.name}</h3>
              <button onClick={() => setPreviewAsset(null)} className="p-1 text-slate-400 hover:text-slate-900 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2">
              {previewAsset.type === 'image' ? (
                <img src={previewAsset.url} alt={previewAsset.name} className="max-h-[65vh] w-auto object-contain rounded-lg" />
              ) : previewAsset.type === 'video' ? (
                <video src={previewAsset.url} controls className="max-h-[65vh] w-full" />
              ) : (
                <iframe src={previewAsset.url} className="w-full h-96 rounded-lg" title="PDF Viewer" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono text-[11px] truncate max-w-md">{previewAsset.url}</span>
              <button
                onClick={() => handleCopyUrl(previewAsset)}
                className="px-3.5 py-2 bg-[#e52521] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Copy size={13} /> Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Media Picker Modal for Forms
export function MediaPickerModal({
  isOpen,
  onClose,
  onSelectMedia
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (url: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMediaAssets();
    }
  }, [isOpen]);

  const fetchMediaAssets = async () => {
    try {
      setLoading(true);
      const cRes = await fetch('/api/cloudinary/resources');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.resources && Array.isArray(cData.resources)) {
          setAssets(cData.resources);
          return;
        }
      }

      const snapshot = await getDocs(collection(db, 'media_assets'));
      const items: MediaAsset[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as MediaAsset));
      setAssets(items);
    } catch (e) {
      console.warn('Error fetching media picker assets:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.url.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-5 space-y-4 text-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon size={18} className="text-[#e52521]" /> Choose Media from Cloudinary Library
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media files by name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#e52521]"
          />
        </div>

        <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500">
              <Loader2 size={24} className="animate-spin text-[#e52521] mx-auto mb-2" /> Fetching Cloudinary files...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500">
              No media files found in Cloudinary.
            </div>
          ) : (
            filtered.map(asset => (
              <div
                key={asset.id || asset.url}
                onClick={() => { onSelectMedia(asset.url); onClose(); }}
                className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-pointer group hover:border-[#e52521] transition-all flex flex-col relative h-32 p-1 shadow-sm"
              >
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-white">
                    <FileText size={28} className="text-[#e52521] mb-1" />
                    <span className="text-[9px] font-mono truncate w-full">{asset.name}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                  <span className="px-2.5 py-1 bg-[#e52521] text-white text-[10px] font-bold rounded-lg shadow-sm">
                    Select Media
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
