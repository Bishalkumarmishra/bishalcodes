"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Trash2, ExternalLink, CheckCheck, X, Sparkles, Inbox, RefreshCw } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export interface StoredNotification {
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  fileUrl?: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'bishalcodes_notification_center_history';
const UNREAD_COUNT_KEY = 'bishalcodes_notification_unread_count';

export default function NotificationCenterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { navigate } = useNavigation();

  // Load from localStorage on mount & sync from API
  useEffect(() => {
    loadNotificationsFromStorage();
    fetchRemoteNotifications();
  }, []);

  // Sync whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchRemoteNotifications();
    }
  }, [isOpen]);

  const loadNotificationsFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredNotification[] = JSON.parse(raw);
        setNotifications(parsed);
        const unread = parsed.filter(n => !n.read).length;
        setUnreadCount(unread);
        updateNavbarBadge(unread);
      }
    } catch (e) {
      console.warn('Failed loading stored notifications:', e);
    }
  };

  const saveNotificationsToStorage = (items: StoredNotification[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setNotifications(items);
      const unread = items.filter(n => !n.read).length;
      setUnreadCount(unread);
      updateNavbarBadge(unread);
    } catch (e) {
      console.warn('Failed saving notifications:', e);
    }
  };

  const updateNavbarBadge = (count: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(UNREAD_COUNT_KEY, count.toString());
    window.dispatchEvent(new CustomEvent('notification_count_updated', { detail: count }));
  };

  const fetchRemoteNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/push-notification', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.notifications)) return;

      const remoteItems: StoredNotification[] = data.notifications.map((n: any) => ({
        id: n.id || 'notif-' + n.timestamp,
        title: n.title || 'Bishal Codes Broadcast',
        message: n.message || n.body || '',
        actionUrl: n.actionUrl || 'https://bishalcodes.com/',
        fileUrl: n.fileUrl || undefined,
        timestamp: n.timestamp || Date.now(),
        read: false
      }));

      // Merge remote notifications with local storage items, preserving read status and user deletes
      const existingMap = new Map(notifications.map(n => [n.id, n]));
      const merged: StoredNotification[] = [];

      for (const item of remoteItems) {
        if (existingMap.has(item.id)) {
          merged.push(existingMap.get(item.id)!);
        } else {
          merged.push(item);
        }
      }

      // Append any existing local items that were custom or loaded before
      for (const item of notifications) {
        if (!merged.some(m => m.id === item.id)) {
          merged.push(item);
        }
      }

      merged.sort((a, b) => b.timestamp - a.timestamp);
      saveNotificationsToStorage(merged);
    } catch (err) {
      console.warn('Error fetching remote notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotificationsToStorage(updated);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    if (confirm('Are you sure you want to delete all notifications from this device?')) {
      saveNotificationsToStorage([]);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotificationsToStorage(updated);
  };

  const handleNotificationClick = (item: StoredNotification) => {
    // Mark as read
    const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
    saveNotificationsToStorage(updated);

    if (item.actionUrl) {
      if (item.actionUrl.startsWith('http://') || item.actionUrl.startsWith('https://')) {
        window.open(item.actionUrl, '_blank');
      } else {
        navigate(item.actionUrl as any);
      }
    }
    onClose();
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-end p-4 pt-16 md:pt-20 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e52521]/10 border border-[#e52521]/20 flex items-center justify-center text-[#e52521]">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#e52521] text-white text-[10px] font-extrabold rounded-full">
                    {unreadCount} NEW
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live broadcast updates & tools activity</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchRemoteNotifications}
              disabled={loading}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action Controls Bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={handleMarkAllRead}
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Trash2 size={13} /> Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 flex-1 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Inbox size={24} />
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-semibold text-xs">No notifications right now</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                System broadcasts, tool updates, and announcements will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                  item.read 
                    ? 'bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/50' 
                    : 'bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border-l-2 border-[#e52521]'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#e52521]/10 border border-[#e52521]/20 flex items-center justify-center text-[#e52521] shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    {item.fileUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-24 max-w-xs">
                        <img src={item.fileUrl} alt="Attachment" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {item.actionUrl && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-[#e52521] group-hover:underline">
                        <span>Open Link</span>
                        <ExternalLink size={10} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Delete Button */}
                <button
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="opacity-60 group-hover:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                  title="Delete from device"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          BishalCodes Notification Center • Saved Locally
        </div>
      </div>
    </div>
  );
}
