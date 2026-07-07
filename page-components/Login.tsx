
import React, { useState, useEffect } from 'react';
// @ts-ignore - Suppress misleading named export errors for Firebase Auth methods
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, User } from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from '../services/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Mail, Lock, Chrome, Github, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const Login: React.FC = () => {
  const { navigate } = useNavigation(); // Use useNavigation hook
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          checkAndRedirect(result.user);
        }
      } catch (err: any) {
        console.error("Redirect auth error:", err);
        setError(err.message || 'Social login redirect failed');
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const checkAndRedirect = async (user: User | null) => {
    if (user) {
      try {
        // Record user profile in Firestore users collection
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          lastActive: Date.now()
        }, { merge: true });

        // Log login activity
        await addDoc(collection(db, 'user_activity'), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          activityType: 'login',
          details: 'Logged into the site',
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn("Could not record login metadata/activity in Firestore:", err);
      }
    }

    const allowedAdmins = [
        'bishalmishra9000@gmail.com',
        'admin@bishalcodes.com',
        'developer@bishalcodes.com'
    ];

    if (user && user.email && allowedAdmins.includes(user.email)) {
        navigate('admin');
    } else {
        navigate('user-dashboard');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      checkAndRedirect(userCredential.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: any) => {
    setLoading(true);
    setError('');
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Social login failed');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      // Use named modular function for password reset
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 md:p-10 shadow-sm relative">
        <button onClick={() => navigate('home')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-sm font-normal">Access the admin panel of Bishalcodes.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3.5 rounded-lg text-xs mb-6 font-medium border border-rose-100">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-lg text-xs mb-6 font-medium border border-emerald-100">
            Password reset link has been sent to your email.
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-600 outline-none transition-colors text-sm font-normal"
                placeholder="bishal@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-0.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              {isLogin && (
                <button type="button" onClick={handleResetPassword} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider">
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-600 outline-none transition-colors text-sm font-normal"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleProviderLogin(googleProvider)}
            className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-700 shadow-sm"
          >
            <Chrome size={14} className="text-indigo-600" /> Google
          </button>
          <button 
            onClick={() => handleProviderLogin(githubProvider)}
            className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-700 shadow-sm"
          >
            <Github size={14} /> GitHub
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <p className="text-slate-500 text-xs font-normal">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1.5 font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
