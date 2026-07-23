
import React, { useState, ChangeEvent } from 'react';
import { X, ShieldCheck, UploadCloud, Image, Loader2, CheckCircle2 } from 'lucide-react';
import { useUser } from '../hooks/useUser';
// @ts-ignore
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PaymentRequest } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const creditPackages = [
  { name: 'Starter Pack', credits: 10, price: 500, popular: false },
  { name: 'Creator Pack', credits: 25, price: 1000, popular: true },
  { name: 'Pro Pack', credits: 100, price: 3500, popular: false },
];

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile } = useUser();
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1]);
  const [paymentProof, setPaymentProof] = useState<{ name: string; base64: string } | null>(null);
  const [status, setStatus] = useState<'selecting' | 'paying' | 'uploading' | 'pending' | 'error'>('selecting');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmitProof = async () => {
    if (!paymentProof || !user || !userProfile) {
      alert("Missing information. Please ensure you are logged in and have uploaded proof.");
      return;
    }
    setSubmitting(true);
    const paymentRequest: Omit<PaymentRequest, 'id'> = {
        userId: user.uid,
        userEmail: user.email!,
        userName: userProfile.displayName || 'N/A',
        creditPackage: selectedPackage,
        paymentProofBase64: paymentProof.base64,
        status: 'pending',
        timestamp: Date.now(),
    };
    try {
        await addDoc(collection(db, 'payments'), paymentRequest);
        setStatus('pending');
    } catch (error) {
        console.error("Failed to submit payment proof:", error);
        setStatus('error');
    } finally {
        setSubmitting(false);
    }
  };
  
  const resetFlow = () => {
      setPaymentProof(null);
      setStatus('selecting');
      onClose();
  };


  const renderContent = () => {
    switch(status) {
        case 'selecting':
            return (
                <>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">Purchase Credits</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">Select a package to continue. Generation costs 1 credit.</p>
                    <div className="space-y-4 mb-8 text-left">
                        {creditPackages.map(pkg => (
                            <div key={pkg.name} onClick={() => setSelectedPackage(pkg)} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedPackage.name === pkg.name ? 'border-[#e52521] bg-red-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{pkg.name}</p>
                                    <p className="font-medium text-[#e52521] text-xs">{pkg.credits} Credits</p>
                                </div>
                                <span className="font-bold text-slate-900 text-base">Rs. {pkg.price}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setStatus('paying')} className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">Proceed to Pay</button>
                </>
            );
        case 'paying':
            return (
                <>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">Scan to Pay</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">Pay Rs. {selectedPackage.price} for {selectedPackage.credits} credits using Fonepay. <strong className="text-rose-600 font-semibold">Take a screenshot</strong> after payment.</p>
                    <img src="https://ik.imagekit.io/bishalc/Screenshot%202026-01-09%20224952.png" alt="Fonepay QR Code" className="w-64 h-64 mx-auto rounded-2xl border-4 border-white shadow-md mb-6"/>
                    <button onClick={() => setStatus('uploading')} className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm">I have paid, upload proof</button>
                    <button onClick={() => setStatus('selecting')} className="mt-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Back to packages</button>
                </>
            );
        case 'uploading':
            return (
                <>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">Upload Proof</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">Please upload the payment screenshot to verify your purchase of {selectedPackage.credits} credits.</p>
                    <div className="mb-6">
                        <label className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <UploadCloud size={32} className="text-slate-400 mb-2"/>
                            <span className="font-semibold text-slate-600 text-sm">{paymentProof ? "Change Screenshot" : "Click to Upload Screenshot"}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        {paymentProof && <p className="text-xs text-slate-500 mt-2 text-center font-medium">File: {paymentProof.name}</p>}
                    </div>
                    <button onClick={handleSubmitProof} disabled={!paymentProof || submitting} className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit for Verification'}
                    </button>
                    <button onClick={() => setStatus('paying')} className="mt-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Back to QR</button>
                </>
            );
        case 'pending':
             return (
                <div className="py-10 text-center animate-in fade-in zoom-in-90">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Submission Received!</h3>
                    <p className="text-slate-500 font-medium">Your payment is pending verification. Credits will be added to your account within a few hours. Thank you!</p>
                    <button onClick={resetFlow} className="mt-8 bg-[#e52521] text-white px-8 py-3 rounded-lg font-bold">Close</button>
                </div>
             );
        case 'error':
            return (
                <div className="py-10 text-center">
                    <h3 className="text-xl font-semibold text-rose-600 mb-2">Submission Failed</h3>
                    <p className="text-slate-500 font-medium">There was an error submitting your request. Please try again or contact support.</p>
                    <button onClick={() => setStatus('uploading')} className="mt-8 bg-[#e52521] text-white px-8 py-3 rounded-lg font-bold">Try Again</button>
                </div>
            );
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-red-50 text-[#e52521] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                <ShieldCheck size={40} />
            </div>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
