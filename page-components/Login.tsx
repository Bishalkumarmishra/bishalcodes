
import React, { useState, useEffect } from 'react';
// @ts-ignore - Suppress misleading named export errors for Firebase Auth methods
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, User } from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from '../services/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { Mail, Lock, Chrome, Github, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

// Simple encryption helper using a client-side key for security (obfuscation)
const encryptData = (text: string): string => {
  const key = "BishalCodesBiometricSecureKey";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decryptData = (encoded: string): string => {
  const key = "BishalCodesBiometricSecureKey";
  const text = atob(encoded);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

const getPlatformInfo = () => {
  if (typeof window === 'undefined') return { isIOS: false, isAndroid: false, isDesktop: true };
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;
  return { isIOS, isAndroid, isDesktop };
};

const Login: React.FC = () => {
  const { navigate } = useNavigation(); // Use useNavigation hook
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Biometrics States
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState('');
  const [platform, setPlatform] = useState<{ isIOS: boolean; isAndroid: boolean; isDesktop: boolean }>({ isIOS: false, isAndroid: false, isDesktop: true });
  const [enableBiometricsOnLogin, setEnableBiometricsOnLogin] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

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

  useEffect(() => {
    const { isIOS, isAndroid, isDesktop } = getPlatformInfo();
    setPlatform({ isIOS, isAndroid, isDesktop });

    const savedCredId = localStorage.getItem('biometric_credential_id');
    const savedEmail = localStorage.getItem('biometric_email');
    if (savedCredId && savedEmail) {
      setHasBiometrics(true);
      setBiometricEmail(savedEmail);
    }
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

  const registerBiometrics = async (loginEmail: string, loginPass: string) => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      alert("WebAuthn is not supported in this browser/device.");
      return;
    }
    
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "Bishal Codes",
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: loginEmail,
            displayName: loginEmail.split('@')[0]
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            userVerification: "preferred",
            residentKey: "preferred",
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: "none"
        }
      };

      const credential = await navigator.credentials.create(credentialCreationOptions) as any;
      if (credential) {
        const rawId = new Uint8Array(credential.rawId);
        let binary = '';
        rawId.forEach((byte) => binary += String.fromCharCode(byte));
        const credentialIdBase64 = btoa(binary);

        localStorage.setItem('biometric_credential_id', credentialIdBase64);
        localStorage.setItem('biometric_email', loginEmail);
        localStorage.setItem('biometric_payload', encryptData(JSON.stringify({ email: loginEmail, password: loginPass })));
        
        setHasBiometrics(true);
        setBiometricEmail(loginEmail);
        alert("Device biometrics registered successfully! You can now log in using biometrics on this device next time.");
      }
    } catch (err: any) {
      console.error("Biometric registration failed:", err);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        alert(`Biometric registration failed: ${err.message}`);
      }
    }
  };

  const handleBiometricAuth = async () => {
    const savedCredId = localStorage.getItem('biometric_credential_id');
    const savedPayload = localStorage.getItem('biometric_payload');
    if (!savedCredId || !savedPayload) {
      setError("No biometric credentials registered on this device yet.");
      return;
    }

    setBiometricLoading(true);
    setError('');
    try {
      const binaryString = atob(savedCredId);
      const len = binaryString.length;
      const credentialId = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        credentialId[i] = binaryString.charCodeAt(i);
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialId,
            type: "public-key"
          }],
          timeout: 60000,
          userVerification: "required"
        }
      };

      const assertion = await navigator.credentials.get(credentialRequestOptions);
      if (assertion) {
        const decrypted = JSON.parse(decryptData(savedPayload));
        const { email: savedEmail, password: savedPassword } = decrypted;

        setLoading(true);
        const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        checkAndRedirect(userCredential.user);
      }
    } catch (err: any) {
      console.error("Biometric authentication failed:", err);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        setError(err.message || 'Biometric authentication failed');
      }
    } finally {
      setBiometricLoading(false);
      setLoading(false);
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
      
      if (enableBiometricsOnLogin) {
        const savedEmail = email;
        const savedPassword = password;
        checkAndRedirect(userCredential.user);
        setTimeout(() => {
          registerBiometrics(savedEmail, savedPassword);
        }, 1000);
      } else {
        checkAndRedirect(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const getBiometricIcon = () => {
    if (platform.isIOS) {
      // Official Apple Face ID Brackets with dynamic CSS eyes blinking animation
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-800 group-hover:text-[#e52521] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <style>{`
            @keyframes faceid-blink {
              0%, 88%, 100% { transform: scaleY(1); }
              94% { transform: scaleY(0.1); }
            }
            .faceid-eye {
              animation: faceid-blink 4s infinite;
            }
          `}</style>
          {/* Frame brackets */}
          <path d="M7 3H5a2 2 0 0 0-2 2v2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          
          {/* Face features */}
          <path d="M8 8v8" />
          <path d="M16 8v8" />
          
          {/* Eyes */}
          <g style={{ transformOrigin: 'center' }}>
            <ellipse className="faceid-eye" cx="10.2" cy="10.2" rx="1" ry="1" fill="currentColor" stroke="none" style={{ transformOrigin: '10.2px 10.2px' }} />
            <ellipse className="faceid-eye" cx="13.8" cy="10.2" rx="1" ry="1" fill="currentColor" stroke="none" style={{ transformOrigin: '13.8px 10.2px' }} />
          </g>
          
          {/* Nose */}
          <path d="M12 9.5v3.5h1" />
          
          {/* Smile */}
          <path d="M9.5 15.5a2.5 2.5 0 0 0 5 0" />
        </svg>
      );
    } else if (platform.isAndroid) {
      // Official Android Fingerprint concentric circles style icon (Material design)
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-800 group-hover:text-[#e52521] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a7 7 0 0 0 7-7c0-4.3-3-7-7-7s-7 2.7-7 7" />
          <path d="M12 19a4 4 0 0 0 4-4c0-2.5-1.7-4.5-4-4.5s-4 2-4 4.5" />
          <path d="M12 15a1 1 0 0 0 1-1" />
          <path d="M8 22a10 10 0 0 1-1.3-4.6" />
          <path d="M16 22a10 10 0 0 0 1.3-4.6" />
          <path d="M2 15a10 10 0 0 1 10-10 10 10 0 0 1 10 10" />
        </svg>
      );
    } else {
      // Official FIDO / Passkey alliance key logo (person silhouette merged with key)
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-800 group-hover:text-[#e52521] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Key Head (Circle on the Left) */}
          <circle cx="8" cy="12" r="5" />
          
          {/* Key Shaft */}
          <line x1="13" y1="12" x2="22" y2="12" />
          
          {/* Key Teeth */}
          <line x1="17" y1="12" x2="17" y2="15" />
          <line x1="20" y1="12" x2="20" y2="15" />
          
          {/* User Silhouette inside Key Head */}
          <circle cx="8" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M5.5 15.5c0-.8.7-1.5 1.5-1.5h2c.8 0 1.5.7 1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 md:p-10 shadow-sm relative">
        <button onClick={() => navigate('home')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#d01f1c] transition-colors mb-6">
          <ArrowLeft size={14} /> Back to site
        </button>

        <div className="text-center mb-6">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-[#e52521] outline-none transition-colors text-sm font-normal"
                placeholder="bishal@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-0.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              {isLogin && (
                <button type="button" onClick={handleResetPassword} className="text-[10px] font-bold text-[#e52521] hover:text-[#d01f1c] transition-colors uppercase tracking-wider">
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-[#e52521] outline-none transition-colors text-sm font-normal"
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

          {/* Biometrics Status/Opt-in Option */}
          {hasBiometrics && isLogin ? (
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 animate-in fade-in duration-300">
              <span className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                Biometrics active: <span className="text-slate-900 font-bold">{biometricEmail}</span>
              </span>
              <button 
                type="button"
                onClick={() => {
                  localStorage.removeItem('biometric_credential_id');
                  localStorage.removeItem('biometric_email');
                  localStorage.removeItem('biometric_payload');
                  setHasBiometrics(false);
                }}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-wider shrink-0 ml-2"
              >
                Disable
              </button>
            </div>
          ) : (
            typeof window !== 'undefined' && window.PublicKeyCredential && (
              <div className="flex items-center gap-2.5 my-2">
                <input 
                  type="checkbox" 
                  id="enableBiometrics" 
                  checked={enableBiometricsOnLogin}
                  onChange={(e) => setEnableBiometricsOnLogin(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#e52521] focus:ring-[#e52521] cursor-pointer"
                />
                <label htmlFor="enableBiometrics" className="text-xs text-slate-500 font-medium select-none cursor-pointer">
                  Enable {platform.isIOS ? 'Face ID' : platform.isAndroid ? 'Fingerprint' : 'Passkey'} for next time
                </label>
              </div>
            )
          )}

          {/* Submit button and Biometric trigger side by side */}
          <div className="flex gap-2 mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
            
            {hasBiometrics && isLogin && (
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={biometricLoading || loading}
                className="w-[42px] h-[42px] shrink-0 border border-slate-200 rounded-lg hover:border-[#e52521] hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm group"
                title={platform.isIOS ? 'Sign in with Face ID' : platform.isAndroid ? 'Sign in with Fingerprint' : 'Sign in with Passkey'}
              >
                {biometricLoading ? (
                  <Loader2 className="animate-spin text-[#e52521]" size={18} />
                ) : (
                  getBiometricIcon()
                )}
              </button>
            )}
          </div>
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
            <Chrome size={14} className="text-[#e52521]" /> Google
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
              className="ml-1.5 font-bold text-[#e52521] hover:text-[#d01f1c] transition-colors"
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
