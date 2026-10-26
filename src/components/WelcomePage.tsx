import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Navigation, Stethoscope, ArrowRight, ShieldCheck, Sparkles, MapPin, Smartphone } from 'lucide-react';
import { useTheme, ThemeToggle } from '../context/ThemeContext';

interface WelcomePageProps {
  onEnter: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const lightBgUrl = 'https://res.cloudinary.com/jsg7ebov/image/upload/v1792975977/central.jpg';
  const darkBgUrl = 'https://res.cloudinary.com/jsg7ebov/image/upload/v1791646024/images_1.jpg';

  return (
    <div className={`relative min-h-screen z-10 flex flex-col items-center justify-between px-4 py-8 md:py-12 transition-colors duration-500 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Background Image with Theme-Aware Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 z-[-2]"
        style={{ backgroundImage: `url('${isDark ? darkBgUrl : lightBgUrl}')` }}
      />
      <div 
        className={`absolute inset-0 transition-colors duration-500 z-[-1] ${
          isDark 
            ? 'bg-slate-950/80 backdrop-blur-sm' 
            : 'bg-white/80 backdrop-blur-[1px]'
        }`} 
      />

      {/* Top Bar with PWA Download Button & Theme Switcher */}
      <div className="w-full max-w-4xl flex items-center justify-end">
        {/* Top Controls: PWA App Download & Theme Toggle Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
            id="welcome-pwa-install-btn"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#ff073a]/20 hover:bg-[#ff073a]/30 text-rose-200 border border-[#ff073a]/50 shadow-[0_0_15px_rgba(255,7,58,0.3)]'
                : 'bg-white/90 hover:bg-red-50 text-[#CE1126] border border-red-200 shadow-md shadow-red-100/50'
            }`}
            title="Download & Install Central Mall PWA App"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#ff073a]" />
            <span className="hidden sm:inline">PWA App</span>
          </button>
          <ThemeToggle showLabel />
        </motion.div>
      </div>

      {/* Main Hero Content */}
      <div className="max-w-4xl w-full text-center my-auto py-8">
        {/* University Logo / Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={`mx-auto w-24 h-24 md:w-32 md:h-32 mb-6 rounded-3xl border-4 flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all ${
            isDark
              ? 'border-[#ff073a]/80 shadow-[0_0_40px_rgba(255,7,58,0.4)] bg-[#002147]'
              : 'border-[#CE1126] shadow-xl shadow-red-200/60 bg-white'
          }`}
        >
          <img 
            src="https://res.cloudinary.com/jsg7ebov/image/upload/v1791647742/download_6.jpg" 
            alt="Central University Miotso" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className={`text-4xl md:text-6xl font-black tracking-tight mb-2 leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Welcome to <span className="neon-crimson-text">Central Mall</span>
        </motion.h1>

        {/* Centered campus location label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.33 }}
          className={`text-sm md:text-base font-extrabold tracking-wide uppercase mb-3 ${
            isDark ? 'text-rose-300' : 'text-[#CE1126]'
          }`}
        >
          Central University • Miotso Main Campus
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className={`text-xs font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-2 ${
            isDark ? 'text-[#D4AF37]' : 'text-amber-700'
          }`}
        >
          <span>✦ Faith</span>
          <span>•</span>
          <span>Integrity</span>
          <span>•</span>
          <span>Excellence ✦</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className={`text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          Your high-speed digital campus ecosystem for Central University, Miotso. Buy & sell freely, navigate the campus via real road GPS, and access 24/7 clinic consultations.
        </motion.p>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 text-left"
        >
          {/* Shop Card */}
          <div className={`p-6 rounded-3xl backdrop-blur-md transition-all hover:-translate-y-1 group ${
            isDark
              ? 'neon-cu-card'
              : 'bg-white/90 border border-red-200/80 shadow-lg shadow-red-100/50 hover:shadow-xl hover:border-red-300'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDark
                ? 'bg-[#ff073a]/20 border border-[#ff073a]/50 text-[#ff073a] group-hover:bg-[#ff073a] group-hover:text-white shadow-[0_0_15px_rgba(255,7,58,0.3)]'
                : 'bg-red-50 border border-red-200 text-[#CE1126] group-hover:bg-[#CE1126] group-hover:text-white shadow-sm'
            }`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-1.5 flex items-center justify-between ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>Central Marketplace</span>
              <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-[#D4AF37]' : 'text-amber-700'}`}>GH₵ MoMo</span>
            </h3>
            <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Open to all students & merchants. Sell your items, buy hostel essentials, and pay securely via MoMo.
            </p>
          </div>

          {/* GPS Card */}
          <div className={`p-6 rounded-3xl backdrop-blur-md transition-all hover:-translate-y-1 group ${
            isDark
              ? 'neon-cu-card'
              : 'bg-white/90 border border-red-200/80 shadow-lg shadow-red-100/50 hover:shadow-xl hover:border-red-300'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDark
                ? 'bg-[#002147]/80 border border-blue-400/40 text-blue-300 group-hover:bg-[#ff073a] group-hover:text-white shadow-[0_0_15px_rgba(0,33,71,0.5)]'
                : 'bg-blue-50 border border-blue-200 text-[#002147] group-hover:bg-[#CE1126] group-hover:text-white shadow-sm'
            }`}>
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-1.5 flex items-center justify-between ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>Campus Road GPS</span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">Live</span>
            </h3>
            <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              High-precision road & lane navigation across Central University Miotso with clear, unobstructed lanes.
            </p>
          </div>

          {/* Clinic Card */}
          <div className={`p-6 rounded-3xl backdrop-blur-md transition-all hover:-translate-y-1 group ${
            isDark
              ? 'neon-cu-card'
              : 'bg-white/90 border border-red-200/80 shadow-lg shadow-red-100/50 hover:shadow-xl hover:border-red-300'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDark
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 group-hover:bg-[#ff073a] group-hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 group-hover:bg-[#CE1126] group-hover:text-white shadow-sm'
            }`}>
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-1.5 flex items-center justify-between ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>School Clinic OPD</span>
              <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-rose-300' : 'text-[#CE1126]'}`}>24/7 GHS</span>
            </h3>
            <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Consult with clinic nurses, access Ghana Health Service tips, and request emergency triage.
            </p>
          </div>
        </motion.div>

        {/* Enter CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button
            onClick={onEnter}
            id="enter-app-button"
            className="btn-neon-crimson px-9 py-4 rounded-full text-white font-extrabold text-lg flex items-center gap-3 mx-auto transition-all cursor-pointer"
          >
            <span>Enter Central Mall</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </motion.div>
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className={`flex flex-wrap items-center justify-center gap-6 text-xs font-semibold pt-4 border-t w-full max-w-4xl transition-colors ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300/80 text-slate-600'
        }`}
      >
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#CE1126]" /> Miotso, Greater Accra, Ghana
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#CE1126]" /> Official Central University Portal
        </span>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
          className={`flex items-center gap-1 transition-colors cursor-pointer ${
            isDark ? 'text-[#ff073a] hover:text-white' : 'text-[#CE1126] hover:text-[#8B0000]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" /> Install Central Mall PWA App
        </button>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#CE1126]" /> Powered by Central AI
        </span>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
