import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, CheckCircle, ArrowRight, Sparkles, Check, Loader2, Download, FileText, Gift
} from 'lucide-react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { useNavigation } from '../context/NavigationContext';
import { useUser } from '../hooks/useUser';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface CheckoutPageProps {
  planId?: string | null;
}

const CheckoutPage: React.FC<CheckoutPageProps> = () => {
  const { navigate } = useNavigation();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedProdKey, setGeneratedProdKey] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const generateProductionKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 32; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `bc_prod_${salt}`;
  };

  const handleGenerateFreeKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address to receive your free key.');
      return;
    }

    setLoading(true);
    const prodKey = generateProductionKey();

    try {
      if (user?.uid) {
        const now = Date.now();
        const expiresAt = now + (365 * 24 * 60 * 60 * 1000); // 1 year free
        await setDoc(doc(db, 'users', user.uid), {
          api_production_key: prodKey,
          api_plan: 'free_pro',
          api_plan_name: 'Free Developer Plan',
          api_limit: 50000,
          api_subscribed_at: now,
          api_expires_at: expiresAt,
          api_status: 'active'
        }, { merge: true });
      }

      setGeneratedProdKey(prodKey);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to generate free key:', err);
      alert('Failed to generate key. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdfInvoice = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('BISHAL CODES', 20, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('FREE API KEY & INTEGRATION GUIDE', 130, 25);

      // Metadata
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('License Information', 20, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Account Email: ${email || 'Guest User'}`, 20, 65);
      doc.text(`Tier Plan: Free Developer Tier`, 20, 73);
      doc.text(`Price: $0.00 USD (100% Free)`, 20, 81);
      doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 20, 89);
      doc.text(`Status: ACTIVE`, 20, 97);

      // API Key Box
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 105, 170, 25, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text(`LIVE KEY: ${generatedProdKey}`, 25, 120);

      // Integration Code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Quick Integration Examples', 20, 145);

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.text('1. cURL Request:', 20, 155);
      doc.text(`curl -X GET "https://bishalcodes.com/api/v1/currency?from=USD&to=NPR" \\`, 20, 162);
      doc.text(`  -H "Authorization: Bearer ${generatedProdKey}"`, 20, 169);

      doc.text('2. JavaScript / Node.js (fetch):', 20, 184);
      doc.text(`const res = await fetch('https://bishalcodes.com/api/v1/currency?from=USD&to=NPR', {`, 20, 191);
      doc.text(`  headers: { 'Authorization': 'Bearer ${generatedProdKey}' }`, 20, 198);
      doc.text(`});`, 20, 205);

      doc.save(`BishalCodes_Free_API_Key.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF guide.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow pt-28 pb-16 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    API Key Activated!
                  </h1>
                  <span className="text-[11px] text-slate-500 font-medium">
                    100% Free Developer Tier
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <span>Your Live Production Key</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Free Unlimited Access</span>
              </div>
              <div className="bg-slate-955 text-white rounded-xl p-3.5 flex items-center justify-between border border-slate-800 shadow-inner">
                <code className="font-mono text-xs font-bold text-emerald-400 truncate pr-2 select-all">
                  {generatedProdKey}
                </code>
              </div>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={handleDownloadPdfInvoice}
                className="w-full bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
              >
                <Download size={14} />
                Download PDF Integration Guide (.pdf)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => navigate('developers')}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Back to Portal
                </button>
                {user?.uid ? (
                  <button 
                    onClick={() => navigate('user-dashboard')}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    View Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('home')}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    Return Home
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
              <Gift size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Get 100% Free API Key
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
              No credit card required. Instant live production key generation.
            </p>
          </div>

          <form onSubmit={handleGenerateFreeKey} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-800 dark:focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5 font-medium">
              <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <Sparkles size={14} /> Free Plan Included Features:
              </div>
              <ul className="space-y-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                <li>✓ 50,000 API requests per month</li>
                <li>✓ Access to all core developer utilities</li>
                <li>✓ High-speed production endpoints</li>
                <li>✓ Instant key activation</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Generating Free Key...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Free Production API Key
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
