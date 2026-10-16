import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, LogIn, UserPlus, ArrowLeft, Shield, Mail, Lock, Phone, 
  GraduationCap, Store, UserCheck, AlertCircle, CheckCircle2, Camera, Upload, ArrowRight, Sparkles, X, Check, RefreshCw
} from 'lucide-react';
import { User as UserType } from '../types';
import { useTheme, ThemeToggle } from '../context/ThemeContext';
import { AVATAR_PROFILES, svgToDataUri, getRandomAvatarDataUri } from '../data/avatars';

interface AuthPageProps {
  onLogin: (user: UserType) => void;
  onBackToWelcome: () => void;
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'merchant' | 'visitor';
  studentId?: string;
  phone?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onBackToWelcome }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Check if any user has registered before in this browser
  const [hasExistingAccounts, setHasExistingAccounts] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('central_mall_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  });

  // For first-time users, default to Registration so they sign up first
  const [isLoginView, setIsLoginView] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('central_mall_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  });

  // 4-Fold Sign Up Wizard Step (1, 2, 3, 4)
  const [signupStep, setSignupStep] = useState<number>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'merchant' | 'visitor'>('student');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Merchant Verification State (OTP & 100 Cedis Payment)
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [merchantPaid, setMerchantPaid] = useState<boolean>(false);
  const [merchantMomo, setMerchantMomo] = useState<string>('');
  const [smsToast, setSmsToast] = useState<string | null>(null);

  // Avatar Selector Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to retrieve local registered users
  const getLocalRegisteredUsers = (): StoredAccount[] => {
    try {
      const saved = localStorage.getItem('central_mall_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Helper to save registered user locally
  const saveLocalRegisteredUser = (acc: StoredAccount) => {
    try {
      const existing = getLocalRegisteredUsers();
      const updated = [...existing.filter(u => u.email.toLowerCase() !== acc.email.toLowerCase()), acc];
      localStorage.setItem('central_mall_registered_users', JSON.stringify(updated));
      setHasExistingAccounts(true);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Image Upload handler for registration avatar
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrorMessage('Profile picture is too large (max 4MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Switch to sign up tab and pre-fill email
  const handleSwitchToSignUp = () => {
    setIsLoginView(false);
    setSignupStep(1);
    setErrorMessage(null);
    setShowSignupPrompt(false);
    setSuccessMessage(null);
  };

  // Step validation helpers for the 4-fold wizard
  const handleNextStep = () => {
    setErrorMessage(null);
    if (signupStep === 1) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!gender) {
        setErrorMessage('Please select your gender.');
        return;
      }
    } else if (signupStep === 2) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password.trim() || password.length < 4) {
        setErrorMessage('Password must be at least 4 characters.');
        return;
      }
    } else if (signupStep === 3) {
      if (!role) {
        setErrorMessage('Please select your campus role.');
        return;
      }
      // Student rule: Student Index Number is compulsory!
      if (role === 'student') {
        if (!studentId.trim()) {
          setErrorMessage('Student Index Number is compulsory for students. Please provide your student index number to proceed.');
          return;
        }
      }
      // Merchant rule: Generate OTP when entering Step 4
      if (role === 'merchant') {
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(randomCode);
        setSmsToast(`[CentralMall SMS] Your verification OTP is ${randomCode}`);
        setTimeout(() => setSmsToast(null), 8000);
      }
    }
    setSignupStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (signupStep > 1) {
      setSignupStep(prev => prev - 1);
    } else {
      onBackToWelcome();
    }
  };

  const handleResendOtp = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setEnteredOtp('');
    setOtpVerified(false);
    setSmsToast(`[CentralMall SMS] Your new verification OTP code is ${randomCode}`);
    setTimeout(() => setSmsToast(null), 8000);
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowSignupPrompt(false);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const localAccounts = getLocalRegisteredUsers();
      const foundLocal = localAccounts.find(u => u.email.toLowerCase() === cleanEmail);

      let serverRes: Response | null = null;
      let serverData: any = null;

      try {
        serverRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });
        serverData = await serverRes.json();
      } catch (fetchErr) {
        console.warn('Backend login fetch error:', fetchErr);
      }

      if (serverRes && serverRes.ok && serverData && serverData.user) {
        setSuccessMessage(serverData.message || 'Login successful! Entering Central Mall...');
        setTimeout(() => onLogin(serverData.user), 450);
        return;
      }

      if (foundLocal) {
        if (foundLocal.password && foundLocal.password !== cleanPassword) {
          setErrorMessage('Incorrect password. Please verify and try again.');
          setLoading(false);
          return;
        }

        const loggedUser: UserType = {
          id: foundLocal.id,
          name: foundLocal.name,
          email: foundLocal.email,
          role: foundLocal.role,
          studentId: foundLocal.studentId,
          phone: foundLocal.phone,
          avatar: foundLocal.avatar || getRandomAvatarDataUri(),
        };

        setSuccessMessage('Welcome back! Logging into Central Mall...');
        setTimeout(() => onLogin(loggedUser), 450);
        return;
      }

      if (serverRes && serverRes.status === 401) {
        setErrorMessage(serverData?.message || 'Incorrect password.');
        setLoading(false);
        return;
      }

      setErrorMessage(`No account found for "${cleanEmail}". You must sign up first!`);
      setShowSignupPrompt(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage('Could not log in. Please sign up first.');
      setShowSignupPrompt(true);
      setLoading(false);
    }
  };

  const handleFinalSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate student rule again
    if (role === 'student' && !studentId.trim()) {
      setErrorMessage('Student Index Number is compulsory for students.');
      return;
    }

    // Validate merchant rules: OTP verification & GH₵ 100 payment verification
    if (role === 'merchant') {
      if (!enteredOtp.trim() || enteredOtp.trim() !== generatedOtp) {
        setErrorMessage('Please enter the correct 6-digit OTP code sent via SMS from CentralMall.');
        return;
      }
      if (!merchantPaid) {
        setErrorMessage('Please complete the GH₵ 100 vendor registration payment to activate your merchant store.');
        return;
      }
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    try {
      let registeredUser: UserType | null = null;
      let serverRes: Response | null = null;
      let serverData: any = null;

      const finalAvatar = avatarPreview || getRandomAvatarDataUri();

      try {
        serverRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            role,
            gender,
            phone: phone.trim() || merchantMomo || undefined,
            studentId: role === 'student' ? studentId.trim() : undefined,
            avatar: finalAvatar,
          }),
        });
        serverData = await serverRes.json();
      } catch (fetchErr) {
        console.warn('Backend register fetch error:', fetchErr);
      }

      if (serverRes && !serverRes.ok && serverData && serverData.message && serverData.message.includes('already exists')) {
        setErrorMessage('An account with this email already exists! Please click "Log In" above.');
        setLoading(false);
        return;
      }

      if (serverRes && serverRes.ok && serverData && serverData.user) {
        registeredUser = serverData.user;
      } else {
        registeredUser = {
          id: `usr_${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role,
          gender,
          studentId: role === 'student' ? studentId.trim() : undefined,
          phone: phone.trim() || merchantMomo || undefined,
          avatar: finalAvatar,
        };
      }

      if (registeredUser) {
        saveLocalRegisteredUser({
          id: registeredUser.id,
          name: registeredUser.name,
          email: registeredUser.email,
          password: cleanPassword,
          role: registeredUser.role as any,
          gender,
          studentId: registeredUser.studentId,
          phone: registeredUser.phone,
          avatar: finalAvatar,
        });

        setSuccessMessage(`Account created successfully! Welcome to Central Mall, ${cleanName}.`);
        setTimeout(() => {
          if (registeredUser) onLogin(registeredUser);
        }, 500);
        return;
      }
    } catch (err: any) {
      setErrorMessage('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen z-10 flex flex-col items-center justify-center px-4 py-8 transition-colors duration-300 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Top Bar with Back Button & Theme Switcher */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBackToWelcome}
          id="back-to-welcome-button"
          className={`flex items-center gap-2 text-sm font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm transition-colors cursor-pointer border ${
            isDark 
              ? 'text-red-400 bg-slate-900/90 border-slate-800 hover:bg-slate-800' 
              : 'text-[#CE1126] bg-white/90 border-red-200/80 hover:bg-red-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Welcome Page</span>
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-red-400' 
              : 'bg-white/90 border-red-200/80 text-[#CE1126]'
          }`}>
            <Shield className="w-3.5 h-3.5 text-[#CE1126]" />
            <span>Central Auth</span>
          </div>
        </div>
      </div>

      {/* Simulated CentralMall SMS Banner for Merchant OTP */}
      <AnimatePresence>
        {smsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 z-50 max-w-sm w-full mx-4 bg-[#002147] border-2 border-[#ff073a] text-white p-4 rounded-2xl shadow-2xl shadow-red-900/40 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#ff073a] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-300">CentralMall SMS Alert</span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-xs font-semibold mt-1 text-slate-100">{smsToast}</p>
            </div>
            <button onClick={() => setSmsToast(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left border ${
          isDark 
            ? 'bg-gradient-to-b from-[#0a1424]/95 via-[#12121c]/95 to-[#060a14]/95 border-[#ff073a]/40 shadow-[0_0_40px_rgba(255,7,58,0.25)] text-slate-100' 
            : 'bg-white border-red-200 shadow-red-100 text-slate-800'
        }`}
      >
        {/* Glow Header Accent in Navy, Neon Red & Central Crimson */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002147] via-[#ff073a] to-[#CE1126]" />

        {/* Tab Switcher */}
        <div className={`grid grid-cols-2 p-1 rounded-xl mb-6 border ${
          isDark ? 'bg-slate-950/90 border-gray-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              setIsLoginView(false);
              setSignupStep(1);
              setErrorMessage(null);
              setShowSignupPrompt(false);
              setSuccessMessage(null);
            }}
            id="tab-signup-button"
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isLoginView
                ? 'bg-[#ff073a] text-white shadow-[0_0_12px_rgba(255,7,58,0.5)]'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up Wizard</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginView(true);
              setErrorMessage(null);
              setShowSignupPrompt(false);
              setSuccessMessage(null);
            }}
            id="tab-login-button"
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isLoginView
                ? 'bg-[#ff073a] text-white shadow-[0_0_12px_rgba(255,7,58,0.5)]'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

        {/* Error / Feedback Notifications */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 p-3.5 rounded-2xl text-xs flex flex-col gap-2 border ${
                isDark 
                  ? 'bg-red-950/70 border-red-800 text-red-200' 
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#CE1126] shrink-0 mt-0.5" />
                <p className="font-bold flex-1">{errorMessage}</p>
              </div>

              {showSignupPrompt && (
                <button
                  type="button"
                  onClick={handleSwitchToSignUp}
                  id="error-switch-to-signup-cta"
                  className="mt-1 w-full py-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Click Here to Sign Up Now &rarr;</span>
                </button>
              )}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 font-bold border ${
                isDark 
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- LOGIN VIEW --- */}
        {isLoginView ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,7,58,0.5)] border border-[#ff3366]/40">
                <LogIn className="w-7 h-7" />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sign In to Central Mall
              </h2>
              <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter your registered email and password to access your account
              </p>
            </div>

            <form onSubmit={handleSubmitLogin} className="space-y-4 text-left">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
                  <input
                    type="email"
                    required
                    placeholder="someone@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon-crimson w-full mt-2 py-3.5 disabled:opacity-50 text-white font-extrabold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying account...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Log In to Central Mall</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs">
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={handleSwitchToSignUp}
                  className="font-bold text-[#CE1126] hover:underline cursor-pointer"
                >
                  Start Sign Up Wizard &rarr;
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* --- 4-FOLD SIGN UP WIZARD --- */
          <div>
            {/* Header & Step Indicator */}
            <div className="mb-5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,7,58,0.5)] border border-[#ff3366]/40">
                <UserPlus className="w-7 h-7" />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Create Central Account
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      signupStep === stepNum 
                        ? 'w-8 bg-[#ff073a]' 
                        : signupStep > stepNum 
                        ? 'w-4 bg-emerald-500' 
                        : isDark ? 'w-4 bg-slate-800' : 'w-4 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-semibold mt-1.5 ${isDark ? 'text-red-400' : 'text-[#CE1126]'}`}>
                Step {signupStep} of 4: {
                  signupStep === 1 ? 'Personal Identity' :
                  signupStep === 2 ? 'Contact & Password' :
                  signupStep === 3 ? 'Campus Role & ID' : 
                  role === 'merchant' ? 'Vendor OTP & 100 Cedis Fee' : 'Profile Avatar'
                }
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* FOLD 1: Name and Gender */}
              {signupStep === 1 && (
                <motion.div
                  key="fold-1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-[#CE1126]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jesse Fiagbe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Gender <span className="text-red-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Select Male or Female)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-3.5 px-4 text-xs font-extrabold rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          gender === 'male'
                            ? 'bg-gradient-to-r from-[#ff073a] to-[#CE1126] border-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)] scale-[1.02]'
                            : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-[#ff073a]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#ff073a]'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                          {gender === 'male' && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span>Male</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-3.5 px-4 text-xs font-extrabold rounded-2xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          gender === 'female'
                            ? 'bg-gradient-to-r from-[#ff073a] to-[#CE1126] border-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)] scale-[1.02]'
                            : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-[#ff073a]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#ff073a]'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                          {gender === 'female' && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span>Female</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn-neon-crimson flex-2 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Next: Contact Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* FOLD 2: Phone Number, Email, and Password */}
              {signupStep === 2 && (
                <motion.div
                  key="fold-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Phone Number (MTN / Telecel / AirtelTigo)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#CE1126]" />
                      <input
                        type="tel"
                        placeholder="e.g. +233 24 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#CE1126]" />
                      <input
                        type="email"
                        required
                        placeholder="someone@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Password <span className="text-red-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Min 4 chars)</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#CE1126]" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn-neon-crimson flex-2 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Next: Campus Role</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* FOLD 3: Campus Role Horizontal Radio List with SVGs & Compulsory Student ID */}
              {signupStep === 3 && (
                <motion.div
                  key="fold-3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Select Your Campus Role <span className="text-red-500">*</span>
                  </label>

                  {/* Horizontal Radio List with SVG icons */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Student Option */}
                    <div
                      onClick={() => setRole('student')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        role === 'student'
                          ? 'border-[#ff073a] bg-gradient-to-r from-red-950/40 to-transparent shadow-[0_0_15px_rgba(255,7,58,0.2)]'
                          : isDark ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          role === 'student' ? 'bg-[#ff073a] text-white shadow-md' : isDark ? 'bg-slate-700 text-red-400' : 'bg-red-100 text-[#CE1126]'
                        }`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0.011.665-6.16 3.422z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19v-4.5a3 3 0 013-3h8a3 3 0 013 3V19" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Student</p>
                          <p className="text-[11px] text-slate-400">Buy items only (Student ID compulsory)</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        role === 'student' ? 'border-[#ff073a] bg-[#ff073a]' : 'border-slate-500'
                      }`}>
                        {role === 'student' && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Merchant Option */}
                    <div
                      onClick={() => setRole('merchant')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        role === 'merchant'
                          ? 'border-[#ff073a] bg-gradient-to-r from-red-950/40 to-transparent shadow-[0_0_15px_rgba(255,7,58,0.2)]'
                          : isDark ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          role === 'merchant' ? 'bg-[#ff073a] text-white shadow-md' : isDark ? 'bg-slate-700 text-red-400' : 'bg-red-100 text-[#CE1126]'
                        }`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Merchant / Vendor</p>
                          <p className="text-[11px] text-slate-400">SMS OTP & GH₵ 100 fee (Can list & sell items)</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        role === 'merchant' ? 'border-[#ff073a] bg-[#ff073a]' : 'border-slate-500'
                      }`}>
                        {role === 'merchant' && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Visitor Option */}
                    <div
                      onClick={() => setRole('visitor')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        role === 'visitor'
                          ? 'border-[#ff073a] bg-gradient-to-r from-red-950/40 to-transparent shadow-[0_0_15px_rgba(255,7,58,0.2)]'
                          : isDark ? 'border-slate-800 bg-slate-800/50 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          role === 'visitor' ? 'bg-[#ff073a] text-white shadow-md' : isDark ? 'bg-slate-700 text-red-400' : 'bg-red-100 text-[#CE1126]'
                        }`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Visitor / Guest</p>
                          <p className="text-[11px] text-slate-400">Explore campus & buy only (No selling)</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        role === 'visitor' ? 'border-[#ff073a] bg-[#ff073a]' : 'border-slate-500'
                      }`}>
                        {role === 'visitor' && <span className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {role === 'student' && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30">
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-red-300' : 'text-[#CE1126]'}`}>
                        Student Index Number <span className="text-red-500">* (Compulsory)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CU-2026-9812"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                          isDark 
                            ? 'bg-slate-800 border-red-500/50 text-white placeholder-slate-500' 
                            : 'bg-white border-red-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Compulsory: You cannot enter the website without providing your student index number.</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn-neon-crimson flex-2 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Next: {role === 'merchant' ? 'Vendor SMS & Fee' : 'Profile Avatar'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* FOLD 4: Profile Picture / Avatar & Merchant SMS OTP + GH₵ 100 Fee Verification */}
              {signupStep === 4 && (
                <motion.div
                  key="fold-4"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {role === 'merchant' ? (
                    /* Merchant Verification: SMS OTP (CentralMall) & GH₵ 100 Fee */
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-2xl bg-[#002147]/60 border border-[#ff073a]/40 text-left">
                        <div className="flex items-center gap-2 mb-1 text-rose-300 font-bold text-xs">
                          <Shield className="w-4 h-4 text-[#ff073a]" />
                          <span>CentralMall Vendor Verification</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          A 6-digit OTP code has been sent via SMS from <strong>CentralMall</strong> to your phone number. Enter the code and pay the GH₵ 100 vendor registration fee to activate your merchant store.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Enter 6-Digit SMS OTP Code <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-[11px] font-bold text-[#ff073a] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resend OTS</span>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 482910"
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value)}
                            className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-widest text-center transition-colors focus:outline-none focus:border-[#CE1126] border ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (enteredOtp.trim() === generatedOtp) {
                                setOtpVerified(true);
                                setErrorMessage(null);
                              } else {
                                setErrorMessage('Invalid OTP code. Please check your SMS banner.');
                              }
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              otpVerified ? 'bg-emerald-600 text-white' : 'bg-[#ff073a] hover:bg-[#e0142b] text-white'
                            }`}
                          >
                            {otpVerified ? 'Verified ✓' : 'Verify OTP'}
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl border bg-amber-950/20 border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-300">Vendor Registration Fee</span>
                          <span className="text-sm font-black text-white font-mono">GH₵ 100.00</span>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="tel"
                            placeholder="Momo Number (e.g. 0240000000)"
                            value={merchantMomo}
                            onChange={(e) => setMerchantMomo(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs border ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!merchantMomo.trim()) {
                                setErrorMessage('Please enter your Momo number to pay the 100 cedis fee.');
                                return;
                              }
                              setMerchantPaid(true);
                              setErrorMessage(null);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              merchantPaid 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'bg-gradient-to-r from-amber-500 to-[#CE1126] text-white shadow-md hover:opacity-95'
                            }`}
                          >
                            {merchantPaid ? 'GH₵ 100 Paid Successfully ✓' : 'Pay GH₵ 100 via Mobile Money'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Profile Picture / Avatar Step for Student & Visitor */
                    <div>
                      <div className="text-center">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          Profile Picture & SVG Avatars
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Choose an exclusive SVG profile or upload your own photo
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center py-2">
                        <div className={`relative w-24 h-24 rounded-3xl border-2 overflow-hidden flex items-center justify-center shadow-lg ${
                          isDark ? 'bg-slate-800/90 border-[#ff073a]/50' : 'bg-slate-100 border-red-300'
                        }`}>
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <Sparkles className="w-8 h-8 text-[#ff073a] mb-1 animate-pulse" />
                              <span className="text-[10px] font-bold">Auto-Randomized if left blank</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
                          <button
                            type="button"
                            onClick={() => setIsAvatarModalOpen(true)}
                            className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md border ${
                              isDark 
                                ? 'bg-[#ff073a]/20 hover:bg-[#ff073a]/30 border-[#ff073a] text-red-300' 
                                : 'bg-red-50 hover:bg-red-100 border-red-300 text-[#CE1126]'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-[#ff073a]" />
                            <span>Select Avatar</span>
                          </button>

                          <label className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm border ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          }`}>
                            <Upload className="w-4 h-4" />
                            <span>Upload Custom Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleFinalSignupSubmit} className="space-y-3">
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || (role === 'merchant' && (!otpVerified || !merchantPaid))}
                        className="btn-neon-crimson flex-2 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(255,7,58,0.5)]"
                      >
                        {loading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating account...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span>{role === 'merchant' ? 'Verify & Enter Central Mall' : 'Enter Central Mall'} &rarr;</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 text-center text-xs">
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(true);
                    setErrorMessage(null);
                    setShowSignupPrompt(false);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#CE1126] hover:underline cursor-pointer"
                >
                  Log In Here &rarr;
                </button>
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* --- AVATAR SELECTION POPUP MODAL --- */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl relative max-h-[90vh] overflow-y-auto ${
                isDark 
                  ? 'bg-[#0f172a] border-[#ff073a]/40 text-slate-100 shadow-[0_0_50px_rgba(255,7,58,0.25)]' 
                  : 'bg-white border-red-200 text-slate-900 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ff073a] text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black">Choose Your SVG Avatar</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Click on any SVG profile avatar below to instantly fix it as your profile image.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {AVATAR_PROFILES.map((prof) => {
                  const dataUri = svgToDataUri(prof.svg);
                  const isSelected = avatarPreview === dataUri;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => {
                        setAvatarPreview(dataUri);
                        setIsAvatarModalOpen(false);
                      }}
                      className={`group relative p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#ff073a] bg-[#ff073a]/10 shadow-[0_0_15px_rgba(255,7,58,0.3)] scale-105'
                          : isDark ? 'border-slate-800 bg-slate-900/80 hover:border-[#ff073a]/60 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-md bg-slate-800/20 p-1">
                        <img src={dataUri} alt={prof.name} className="w-full h-full object-contain" />
                      </div>
                      <span className={`text-xs font-bold text-center truncate w-full ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {prof.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-3 border-t border-gray-700/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="btn-neon-crimson px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
