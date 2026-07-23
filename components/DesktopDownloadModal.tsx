"use client";

import React, { useState } from 'react';
import { doc, updateDoc, increment, collection, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Star, X } from 'lucide-react';

export default function DesktopDownloadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = (value: number) => {
    setRating(value);
    if (value >= 4) {
      submitFeedback(value, "Great experience");
    } else {
      setStep(2); // Ask for feedback
    }
  };

  const submitFeedback = async (starVal: number, textMsg: string = feedback) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'desktop_app_feedback'), {
        rating: starVal,
        feedback: textMsg,
        timestamp: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {!submitted ? (
            <>
              {step === 1 ? (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thank you for downloading! 🎉</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                    If Windows shows a blue "Windows protected your PC" screen during installation, simply click <strong>More info</strong> and then <strong>Run anyway</strong>.
                  </p>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-xl mb-6">
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      Why does this happen? The app is safe, but as a new indie app, it doesn't yet have an expensive corporate certificate to bypass Microsoft's automatic filters.
                    </p>
                  </div>

                  <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">How was your experience today?</h4>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        className={`p-1 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                      >
                        <Star className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">We're sorry to hear that!</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Please let us know how we can improve the Nepali Calendar app:
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what went wrong or what's missing..."
                    className="w-full h-32 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#e52521] outline-none mb-4 resize-none"
                  ></textarea>
                  <button
                    onClick={() => submitFeedback(rating)}
                    disabled={isSubmitting || !feedback.trim()}
                    className="w-full py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thank you!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Your feedback helps us make the calendar better for everyone.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
