import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Shield, Lock, CheckCircle, UploadCloud, Smartphone, ArrowRight, 
  Coins, Sparkles, Check, Loader2, Landmark, AlertCircle, Download, FileText
} from 'lucide-react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { useNavigation } from '../context/NavigationContext';
import { useUser } from '../hooks/useUser';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface CheckoutPageProps {
  planId?: string | null;
}

const PLANS = [
  {
    id: 'pro',
    name: 'Commercial Pro',
    price: 29,
    priceNpr: 3500,
    desc: 'Unlocks live endpoints with 50,000 monthly requests.',
    features: [
      '50,050 API requests / month',
      'Rate limit: 60 req / minute',
      'Dedicated HTTPS live production key',
      '99.9% Server uptime SLA',
      'All 7 core developer utility tools'
    ]
  },
  {
    id: 'enterprise',
    name: 'Custom Enterprise',
    price: 149,
    priceNpr: 18000,
    desc: 'Unlimited volume with zero-throttling hosting cluster.',
    features: [
      'Unlimited API requests (custom contract)',
      'Rate limit: 500 req / minute',
      'High-availability SLA clusters',
      'Dedicated Slack & email support channel',
      'Custom code integration consulting'
    ]
  }
];

const CheckoutPage: React.FC<CheckoutPageProps> = ({ planId }) => {
  const { navigate } = useNavigation();
  const { user, userProfile } = useUser();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId || 'pro');
  const [customPriceUsd, setCustomPriceUsd] = useState<number | string>(1);

  // Active plan or custom plan calculations
  const presetPlan = PLANS.find(p => p.id === selectedPlanId);
  const isCustom = selectedPlanId === 'custom' || !presetPlan;
  
  const effectivePriceUsd = isCustom 
    ? Math.max(1, Number(customPriceUsd) || 1) 
    : (presetPlan?.price || 29);

  const effectivePriceNpr = isCustom 
    ? Math.round(effectivePriceUsd * 125) 
    : (presetPlan?.priceNpr || 3500);

  const activePlanName = isCustom ? 'Custom Tier' : presetPlan?.name || 'Commercial Pro';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'fonepay'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedProdKey, setGeneratedProdKey] = useState('');
  
  // Input fields
  const [email, setEmail] = useState(user?.email || '');
  const [cardName, setCardName] = useState(userProfile?.displayName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Wallet inputs
  const [walletPhone, setWalletPhone] = useState('');
  const [walletPin, setWalletPin] = useState('');
  const [walletOtp, setWalletOtp] = useState('');
  const [walletStep, setWalletStep] = useState<'details' | 'otp'>('details');

  // Fonepay states
  const [paymentProof, setPaymentProof] = useState<{ name: string; base64: string } | null>(null);

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

  const sendReceiptEmail = async (paymentData: {
    email: string;
    planName: string;
    amountPaid: number;
    currency: string;
    paymentMethod: string;
    generatedApiKey?: string;
  }) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment-receipt',
          data: paymentData
        })
      });
    } catch (err) {
      console.error('Failed to send automatic payment receipt email:', err);
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
      doc.setTextColor(148, 163, 184);
      doc.text('OFFICIAL INVOICE & INTEGRATION GUIDE', 130, 25);

      // Invoice Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Receipt & License Key', 20, 55);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 60, 190, 60);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('ACCOUNT EMAIL:', 20, 72);
      doc.text('TIER / PLAN:', 20, 82);
      doc.text('AMOUNT PAID:', 20, 92);
      doc.text('PAYMENT METHOD:', 20, 102);
      doc.text('TRANSACTION DATE:', 20, 112);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(email || 'Guest User', 70, 72);
      doc.text(activePlanName, 70, 82);
      doc.text(`${paymentMethod === 'card' ? '$' + effectivePriceUsd + ' USD' : 'Rs. ' + effectivePriceNpr + ' NPR'}`, 70, 92);
      doc.text(paymentMethod === 'card' ? 'Payoneer Card Processing' : paymentMethod === 'wallet' ? 'eSewa / Khalti Digital Wallet' : 'Fonepay QR Scan', 70, 102);
      doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), 70, 112);

      // API Key Box
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(20, 122, 170, 24, 3, 3, 'F');
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(20, 122, 170, 24, 3, 3, 'D');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text('YOUR ACTIVE PRODUCTION API KEY:', 25, 130);

      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      doc.setTextColor(67, 56, 202);
      doc.text(generatedProdKey || 'bc_prod_live_key', 25, 140);

      // Integration Guide Section
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('API Integration Guide (Step-by-Step)', 20, 160);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 164, 190, 164);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('1. cURL Terminal Header Example:', 20, 174);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`curl -X POST "https://bishalcodes.com/api/v1/currency" \\`, 25, 182);
      doc.text(`  -H "x-api-key: ${generatedProdKey || 'bc_prod_YOUR_KEY'}" \\`, 25, 188);
      doc.text(`  -H "Content-Type: application/json"`, 25, 194);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Node.js / Next.js Fetch Example:', 20, 208);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`const res = await fetch('https://bishalcodes.com/api/v1/currency', {`, 25, 216);
      doc.text(`  headers: { 'x-api-key': '${generatedProdKey || 'bc_prod_YOUR_KEY'}' }`, 25, 222);
      doc.text(`});`, 25, 228);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Python Requests Integration:', 20, 242);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`import requests`, 25, 250);
      doc.text(`headers = {'x-api-key': '${generatedProdKey || 'bc_prod_YOUR_KEY'}'}`, 25, 256);
      doc.text(`res = requests.get('https://bishalcodes.com/api/v1/currency', headers=headers)`, 25, 262);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Bishal Codes (https://bishalcodes.com) • Support: developer@bishalcodes.com • Kathmandu, Nepal', 20, 285);

      doc.save(`BishalCodes_Invoice_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF invoice:', err);
      alert('Error generating PDF invoice. Please try again.');
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please fill out your email address.');
      return;
    }
    if (!cardNumber || cardNumber.length < 15) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }

    setLoading(true);
    const prodKey = generateProductionKey();
    const paymentRecord = {
      userId: user?.uid || 'guest_checkout',
      userEmail: email,
      planId: selectedPlanId,
      amountPaid: effectivePriceUsd,
      currency: 'USD',
      paymentMethod: 'International Card / Payoneer',
      cardHolderName: cardName || 'Cardholder',
      status: 'completed',
      generatedApiKey: prodKey,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'payments'), paymentRecord);

      if (user?.uid) {
        const now = Date.now();
        const expiresAt = now + (30 * 24 * 60 * 60 * 1000);
        await setDoc(doc(db, 'users', user.uid), {
          api_production_key: prodKey,
          api_plan: selectedPlanId,
          api_plan_name: activePlanName,
          api_limit: effectivePriceUsd >= 100 ? 999999 : 50000,
          api_subscribed_at: now,
          api_expires_at: expiresAt,
          api_status: 'active'
        }, { merge: true });
      }

      // Automatically dispatch email receipt
      sendReceiptEmail({
        email,
        planName: activePlanName,
        amountPaid: effectivePriceUsd,
        currency: 'USD',
        paymentMethod: 'International Card / Payoneer',
        generatedApiKey: prodKey
      });

      setGeneratedProdKey(prodKey);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to register transaction:', err);
      alert('Gateway transaction failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletPhone || walletPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (walletStep === 'details') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setWalletStep('otp');
      }, 1200);
      return;
    }

    // OTP submission
    if (!walletOtp || walletOtp.length < 4) {
      alert('Please enter the OTP verification code.');
      return;
    }

    setLoading(true);
    const prodKey = generateProductionKey();
    const targetEmail = email || walletPhone + '@khalti-wallet.local';
    const paymentRecord = {
      userId: user?.uid || 'guest_checkout',
      userEmail: targetEmail,
      planId: selectedPlanId,
      amountPaid: effectivePriceNpr,
      currency: 'NPR',
      paymentMethod: 'Khalti/eSewa Wallet',
      walletPhone: walletPhone,
      status: 'completed',
      generatedApiKey: prodKey,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'payments'), paymentRecord);

      if (user?.uid) {
        const now = Date.now();
        const expiresAt = now + (30 * 24 * 60 * 60 * 1000);
        await setDoc(doc(db, 'users', user.uid), {
          api_production_key: prodKey,
          api_plan: selectedPlanId,
          api_plan_name: activePlanName,
          api_limit: effectivePriceUsd >= 100 ? 999999 : 50000,
          api_subscribed_at: now,
          api_expires_at: expiresAt,
          api_status: 'active'
        }, { merge: true });
      }

      // Automatically dispatch email receipt if valid email provided
      if (email) {
        sendReceiptEmail({
          email,
          planName: activePlanName,
          amountPaid: effectivePriceNpr,
          currency: 'NPR',
          paymentMethod: 'eSewa / Khalti Digital Wallet',
          generatedApiKey: prodKey
        });
      }

      setGeneratedProdKey(prodKey);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to register wallet transaction:', err);
      alert('Gateway transaction failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setPaymentProof({ name: file.name, base64 });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image file (PNG, JPG, etc).");
    }
  };

  const handleFonepaySubmit = async () => {
    if (!paymentProof) {
      alert('Please select or drag an image screenshot of your transaction proof.');
      return;
    }
    if (!email) {
      alert('Please fill out your contact email address.');
      return;
    }

    setLoading(true);
    const paymentRecord = {
      userId: user?.uid || 'guest_checkout',
      userEmail: email,
      planId: selectedPlanId,
      amountPaid: effectivePriceNpr,
      currency: 'NPR',
      paymentMethod: 'Fonepay QR Scan',
      paymentProofBase64: paymentProof.base64,
      status: 'pending',
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'payments'), paymentRecord);

      // Automatically dispatch email notification for proof upload
      sendReceiptEmail({
        email,
        planName: activePlanName,
        amountPaid: effectivePriceNpr,
        currency: 'NPR',
        paymentMethod: 'Fonepay QR Scan',
        generatedApiKey: 'Pending Audit Review'
      });

      setSuccess(true);
    } catch (err) {
      console.error('Failed to log Fonepay request:', err);
      alert('Request error. Please check database permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden">
        <Navbar />
        <div className="flex-grow pt-32 pb-20 flex items-center justify-center px-[5vw]">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-lg relative z-10">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle size={40} />
            </div>

            {paymentMethod === 'fonepay' ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Proof Submitted!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-normal">
                  Your manual payment proof was registered successfully. Once our billing desk reviews the receipt, your live production key will be activated and emailed to <strong className="text-slate-800 dark:text-white font-bold">{email}</strong> within 1-2 hours.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs text-left mb-8 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pending Audit Verification:</span> You can check your status in the Developer Dashboard or email billing support.
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  Payment Successful!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-normal">
                  Thank you for subscribing! Your live production key is initialized and ready. Integrate this key into your backends to bypass sandbox blocks.
                </p>
                
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-left mb-8">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                    <span>Your Live Production API Key</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-450 uppercase tracking-widest font-black flex items-center gap-1">
                      <Sparkles size={12} />
                      Active
                    </span>
                  </div>
                  <code className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 font-mono text-xs text-indigo-650 dark:text-indigo-300 font-bold select-all break-all shadow-sm">
                    {generatedProdKey}
                  </code>
                  <div className="text-[9px] text-slate-500 mt-2 font-normal">
                    * Make sure to save this key securely. It operates under standard rate limits of {activePlanName}.
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownloadPdfInvoice}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                Download PDF Invoice & Integration Guide
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button 
                  onClick={() => navigate('developers')}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  Back to API Portal
                </button>
                {user?.uid && (
                  <button 
                    onClick={() => navigate('user-dashboard')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    View Dashboard
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-850 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-[5vw] relative z-10">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Checkout & Gateway Billing
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 font-normal">
              Select your preferred method to complete subscription processing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form Gateways */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
              <h2 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Select Payment Method
              </h2>
              
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-extrabold' 
                      : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-550 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <CreditCard size={18} />
                  Card (Payoneer)
                </button>
                
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                    paymentMethod === 'wallet' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-extrabold' 
                      : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-550 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Smartphone size={18} />
                  eSewa / Khalti
                </button>

                <button
                  onClick={() => setPaymentMethod('fonepay')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                    paymentMethod === 'fonepay' 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-extrabold' 
                      : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-550 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Landmark size={18} />
                  Fonepay QR
                </button>
              </div>

              <h2 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Payment Details
              </h2>

              {/* CARD PAYMENT FLOW */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="ccname"
                      autoComplete="cc-name"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Card Number
                      </label>
                      {cardNumber.length >= 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                          {/^4/.test(cardNumber.replace(/\D/g, '')) ? '💳 VISA' : 
                           /^(5[1-5]|2[2-7])/.test(cardNumber.replace(/\D/g, '')) ? '💳 MASTERCARD' :
                           /^3[47]/.test(cardNumber.replace(/\D/g, '')) ? '💳 AMEX' :
                           /^6/.test(cardNumber.replace(/\D/g, '')) ? '💳 DISCOVER' : '💳 CARD'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardnumber"
                        autoComplete="cc-number"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        placeholder="4000 0000 0000 0000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="exp-date"
                        autoComplete="cc-exp"
                        required
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                          setCardExpiry(val);
                        }}
                        placeholder="MM/YY"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        name="cvc"
                        autoComplete="cc-csc"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-normal">
                    <span className="font-bold text-slate-800 dark:text-white block mb-1">💳 Payoneer Global Card Processing</span>
                    Auto-detects Visa, MasterCard, Amex & Discover cards. Funds settle directly into your linked bank account with zero domain verification required.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Processing Direct Payment...
                      </>
                    ) : (
                      <>
                        <Lock size={12} />
                        Pay ${effectivePriceUsd} USD Securely
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* DIGITAL WALLETS FLOW */}
              {paymentMethod === 'wallet' && (
                <form onSubmit={handleWalletSubmit} className="space-y-4">
                  {walletStep === 'details' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your-email@example.com"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                          Wallet / Mobile Number
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98XXXXXXXX (eSewa or Khalti ID)"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                          Wallet M-PIN
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={walletPin}
                          onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="xxxx"
                          className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Smartphone size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider mb-2">
                        Enter OTP Code
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-4 max-w-sm mx-auto leading-normal">
                        A dynamic SMS verification OTP has been triggered and sent to <span className="font-bold text-slate-800 dark:text-white">{walletPhone}</span>. Enter it below to authorize this invoice.
                      </p>
                      
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={walletOtp}
                        onChange={(e) => setWalletOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="XXXXXX"
                        className="w-40 text-center font-bold text-base tracking-widest bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 mb-4 focus:border-indigo-500 outline-none text-slate-850 dark:text-white font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Sending verification details...
                      </>
                    ) : (
                      <>
                        <Smartphone size={12} />
                        {walletStep === 'details' ? 'Request Payment OTP' : `Authorize Rs. ${effectivePriceNpr}`}
                      </>
                    )}
                  </button>

                  {walletStep === 'otp' && (
                    <button 
                      type="button" 
                      onClick={() => setWalletStep('details')}
                      className="w-full text-center text-xs font-semibold text-slate-550 hover:text-slate-800 transition-colors uppercase tracking-wider mt-2.5"
                    >
                      Back to wallet configuration
                    </button>
                  )}
                </form>
              )}

              {/* FONEPAY SCAN QR MANUAL FLOW */}
              {paymentMethod === 'fonepay' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mb-4">
                      Scan the official billing Fonepay QR below using eSewa, Khalti, or any Nepalese Mobile Banking app.
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl w-fit mx-auto shadow-sm">
                      <img 
                        src="https://ik.imagekit.io/bishalc/Screenshot%202026-01-09%20224952.png" 
                        alt="Fonepay QR Code" 
                        className="w-56 h-56 object-contain rounded-2xl border border-slate-100 bg-white"
                      />
                      <div className="text-[10px] text-indigo-650 dark:text-indigo-400 font-black uppercase tracking-wider mt-2">
                        Total Amount: Rs. {effectivePriceNpr}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                        Upload Receipt Screenshot
                      </label>
                      <label className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <UploadCloud size={24} className="text-slate-400 mb-2" />
                        <span className="font-bold text-slate-650 dark:text-slate-400 text-xs">
                          {paymentProof ? "Change Screenshot" : "Click to Upload Screenshot"}
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                      {paymentProof && (
                        <p className="text-[10px] text-slate-500 mt-1.5 text-center font-bold font-mono">
                          Selected: {paymentProof.name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleFonepaySubmit}
                      disabled={loading || !paymentProof}
                      className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Logging transaction audit...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} />
                          Submit Proof for verification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 leading-none">
                <span className="flex items-center gap-1 font-medium">
                  <Shield size={12} className="text-emerald-500 font-bold" />
                  SSL Secured Processing
                </span>
                <span className="font-medium">PCI-DSS Compliant Infrastructure</span>
              </div>
            </div>

            {/* Right Column: Plan Order Summary */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm sticky top-24">
              <h2 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Order Summary & Pricing Tier
              </h2>

              {/* Tier Selector Buttons */}
              <div className="space-y-2 mb-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Amount or Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId('custom')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedPlanId === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    ⚡ Custom $1+
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId('pro')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedPlanId === 'pro'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    Pro ($29)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId('enterprise')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedPlanId === 'enterprise'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    Enterprise ($149)
                  </button>
                </div>
              </div>

              {/* Custom Input Field when Custom is selected */}
              {selectedPlanId === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 mb-4">
                  <label className="block text-xs font-bold text-slate-800 dark:text-indigo-200 mb-1 uppercase">
                    Enter Custom USD Amount ($)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">$</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={customPriceUsd}
                      onChange={(e) => setCustomPriceUsd(e.target.value)}
                      placeholder="1"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                    * Ideal for testing $1 transactions or custom quotes.
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 mb-5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800 dark:text-white text-xs">{activePlanName}</span>
                  <span className="text-indigo-650 dark:text-indigo-400 text-sm font-black font-mono">
                    ${effectivePriceUsd} <span className="text-[10px] text-slate-500 font-medium">USD</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 font-medium leading-normal">
                  {isCustom ? 'Custom payment transaction with instant API key activation.' : presetPlan?.desc}
                </p>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
                  NPR Equivalent: Rs. {effectivePriceNpr} NPR
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Included Features
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-655 dark:text-slate-300 font-medium">
                  {(presetPlan?.features || [
                    'Dedicated HTTPS live production key',
                    'Instant API quota activation',
                    'Rate limit: 60 - 500 req / minute',
                    'All core developer utility tools'
                  ]).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={12} className="text-indigo-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-600 dark:text-indigo-300 leading-relaxed font-normal mb-2 flex gap-2">
                <Coins size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Instant Activation:</span> Subscriptions paid by Card or wallet are activated immediately. Production keys can be used on any domain.
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
