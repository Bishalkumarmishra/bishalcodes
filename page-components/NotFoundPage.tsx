'use client';
import React from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { useNavigation } from '../context/NavigationContext';
import { ArrowLeft, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-24 text-center max-w-2xl mx-auto space-y-8">
        <div className="w-full max-w-md mx-auto select-none">
          <img
            src="/404 error.svg"
            alt="404 Page Not Found"
            className="w-full h-auto object-contain max-h-[300px] pointer-events-none drop-shadow-md"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto font-medium leading-relaxed">
            Oops! The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('home')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <Home size={16} />
            <span>Go to Homepage</span>
          </button>
          <button
            onClick={() => navigate('services')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-800 font-bold text-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <span>Back to Tools</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
