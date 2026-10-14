import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, LogIn, UserPlus, ArrowLeft, Shield, Mail, Lock, Phone, 
  GraduationCap, Store, UserCheck, AlertCircle, CheckCircle2, Camera, Upload, ArrowRight
} from 'lucide-react';
import { User as UserType, detectGenderFromName } from '../types';
import { useTheme, ThemeToggle } from '../context/ThemeContext';

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
    // If no one has signed up yet, start directly on Sign Up view!
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
    return false; // Default to Sign Up for first users!
  });

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'merchant' | 'visitor'>('student');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

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
    setErrorMessage(null);
    setShowSignupPrompt(false);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowSignupPrompt(false);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please provide your email address.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      if (isLoginView) {
        // --- STRICT LOGIN FLOW ---
        // A user MUST have signed up first!
        const localAccounts = getLocalRegisteredUsers();
        const foundLocal = localAccounts.find(u => u.email.toLowerCase() === cleanEmail);

        let serverRes: Response | null = null;
        let serverData: any = null;

        try {
          serverRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password: cleanPassword,
            }),
          });
          serverData = await serverRes.json();
        } catch (fetchErr) {
          console.warn('Backend login fetch error:', fetchErr);
        }

        // Case 1: Server confirmed successful login
        if (serverRes && serverRes.ok && serverData && serverData.user) {
          setSuccessMessage(serverData.message || 'Login successful! Entering Central Mall...');
          setTimeout(() => {
            onLogin(serverData.user);
          }, 450);
          return;
        }

        // Case 2: User exists locally (e.g. registered in this browser)
        if (foundLocal) {
          if (foundLocal.password && foundLocal.password !== cleanPassword) {
            setErrorMessage('Incorrect password. Please verify your password and try again.');
            setLoading(false);
            return;
          }

          // Local password matches, log in
          const loggedUser: UserType = {
            id: foundLocal.id,
            name: foundLocal.name,
            email: foundLocal.email,
            role: foundLocal.role,
            studentId: foundLocal.studentId,
            phone: foundLocal.phone,
            avatar: foundLocal.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          };

          setSuccessMessage('Welcome back! Logging into Central Mall...');
          setTimeout(() => {
            onLogin(loggedUser);
          }, 450);
          return;
        }

        // Case 3: Server returned 401 (wrong password for existing user)
        if (serverRes && serverRes.status === 401) {
          setErrorMessage(serverData?.message || 'Incorrect password. Please check your credentials.');
          setLoading(false);
          return;
        }

        // Case 4: USER HAS NOT SIGNED UP!
        // Enforce requirement: MUST NOT allow login. Must sign up first!
        setErrorMessage(
          `No account found for "${cleanEmail}". You must sign up first before you can log in to Central Mall!`
        );
        setShowSignupPrompt(true);
        setLoading(false);
        return;
      } else {
        // --- REGISTRATION / SIGN UP FLOW ---
        const cleanName = name.trim();
        if (!cleanName) {
          setErrorMessage('Please enter your full name to create an account.');
          setLoading(false);
          return;
        }

        if (cleanPassword.length < 4) {
          setErrorMessage('Password must be at least 4 characters.');
          setLoading(false);
          return;
        }

        let registeredUser: UserType | null = null;
        let serverRes: Response | null = null;
        let serverData: any = null;

        const finalGender = gender || detectGenderFromName(cleanName);
        const defaultAvatar = finalGender === 'female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300';

        const finalAvatar = avatarPreview || defaultAvatar;

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
              phone: phone.trim() || undefined,
              studentId: role === 'student' ? (studentId.trim() || `CU-2026-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
              avatar: finalAvatar,
            }),
          });
          serverData = await serverRes.json();
        } catch (fetchErr) {
          console.warn('Backend register fetch error:', fetchErr);
        }

        if (serverRes && !serverRes.ok && serverData && serverData.message && !serverData.success) {
          // If server reports account already exists
          if (serverRes.status === 400 && serverData.message.includes('already exists')) {
            setErrorMessage('An account with this email already exists! Please click "Log In" above to sign in.');
            setLoading(false);
            return;
          }
        }

        if (serverRes && serverRes.ok && serverData && serverData.user) {
          registeredUser = serverData.user;
        } else {
          // Construct client registered user
          registeredUser = {
            id: `usr_${Date.now()}`,
            name: cleanName,
            email: cleanEmail,
            role,
            gender,
            studentId: role === 'student' ? (studentId.trim() || `CU-2026-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
            phone: phone.trim() || undefined,
            avatar: finalAvatar,
          };
        }

        if (registeredUser) {
          // Save registered account so future logins work
          saveLocalRegisteredUser({
            id: registeredUser.id,
            name: registeredUser.name,
            email: registeredUser.email,
            password: cleanPassword,
            role: registeredUser.role as any,
            gender,
            studentId: registeredUser.studentId,
            phone: phone.trim(),
            avatar: finalAvatar,
          });

          setSuccessMessage(`Account created successfully! Welcome to Central Mall, ${cleanName}.`);
          setTimeout(() => {
            if (registeredUser) onLogin(registeredUser);
          }, 500);
          return;
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      if (isLoginView) {
        setErrorMessage('Could not log in. You must sign up first before logging in.');
        setShowSignupPrompt(true);
      } else {
        setErrorMessage('Failed to complete registration. Please check your network and try again.');
      }
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

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left border ${
          isDark 
            ? 'bg-gradient-to-b from-[#0a1424]/95 via-[#12121c]/95 to-[#060a14]/95 border-[#ff073a]/40 shadow-[0_0_40px_rgba(255,7,58,0.25)] text-slate-100' 
            : 'bg-white border-red-200 shadow-red-100 text-slate-800'
        }`}
      >
        {/* Glow Header Accent in Navy, Neon Red & Central Crimson */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002147] via-[#ff073a] to-[#CE1126]" />

        {/* First-time user instruction banner */}
        {!hasExistingAccounts && (
          <div className={`mb-5 p-2.5 rounded-2xl text-xs flex items-center gap-2 font-semibold border ${
            isDark 
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>First time visiting? Please <strong>Sign Up</strong> below to create your account before logging in.</span>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,7,58,0.5)] border border-[#ff3366]/40">
            {isLoginView ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isLoginView ? 'Sign In to Central Mall' : 'Create Central Account'}
          </h2>
          <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isLoginView 
              ? 'Enter your registered email and password to log in' 
              : 'Sign up first with your details to access Central Mall'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`grid grid-cols-2 p-1 rounded-xl mb-4 border ${
          isDark ? 'bg-slate-950/90 border-gray-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              setIsLoginView(false);
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
            <span>1. Sign Up First</span>
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
            <span>2. Log In</span>
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

              {/* Explicit Sign Up Call-To-Action if user tried to log in without an account */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {!isLoginView && (
            <>
              {/* Picture Upload for Registration Avatar */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className={`relative w-14 h-14 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'
                  }`}>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm border ${
                      isDark 
                        ? 'bg-red-950/60 hover:bg-red-900/60 border-red-800 text-red-300' 
                        : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#CE1126]'
                    }`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP (Photo preview)</p>
                  </div>
                </div>
              </div>

              {/* Gender Selection for Auto Avatar */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Gender <span className="text-[10px] text-slate-400 font-normal">(Used for automatic avatar if no picture is added)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      gender === 'male'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <span>Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      gender === 'female'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <span>Female</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      gender === 'other'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <span>Other</span>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jesse Fiagbe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
              <input
                type="email"
                required
                placeholder={isLoginView ? 'Enter your registered email' : 'e.g. student@central.edu.gh or yourname@gmail.com'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
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
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {!isLoginView && (
            <>
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Phone Number (MTN / Telecel / AirtelTigo)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
                  <input
                    type="tel"
                    placeholder="e.g. +233 24 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Campus Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      role === 'student'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      role === 'merchant'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Merchant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('visitor')}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      role === 'visitor'
                        ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#CE1126]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Visitor</span>
                  </button>
                </div>
              </div>

              {role === 'student' && (
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Student Index Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CU-2026-9812"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800/90' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon-crimson w-full mt-3 py-3.5 disabled:opacity-50 text-white font-extrabold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isLoginView ? 'Verifying account...' : 'Creating your account...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>{isLoginView ? 'Log In' : 'Sign Up & Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="mt-5 text-center text-xs">
          {isLoginView ? (
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={handleSwitchToSignUp}
                id="footer-switch-to-signup"
                className="font-bold text-[#CE1126] hover:underline cursor-pointer"
              >
                Sign Up First &rarr;
              </button>
            </p>
          ) : (
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Already signed up?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(true);
                  setErrorMessage(null);
                  setShowSignupPrompt(false);
                  setSuccessMessage(null);
                }}
                id="footer-switch-to-login"
                className="font-bold text-[#CE1126] hover:underline cursor-pointer"
              >
                Log In Here &rarr;
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
