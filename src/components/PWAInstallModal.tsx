import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, X, Sparkles, Smartphone, Monitor, Check, Copy, ExternalLink,
  Laptop, Compass, CheckCircle2, AlertCircle
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  pwaInstallPrompt?: any;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  pwaInstallPrompt
}) => {
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<number>(512);

  const handleInstallClick = async () => {
    if (pwaInstallPrompt) {
      try {
        pwaInstallPrompt.prompt();
        const choice = await pwaInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallStatus('🎉 Central Mall PWA successfully installed to your device!');
        } else {
          setInstallStatus('Installation was dismissed. You can install at any time.');
        }
      } catch (err) {
        setInstallStatus('Use your browser menu (⋮ or Share) → "Add to Home Screen"');
      }
    } else {
      setInstallStatus('📱 To install on mobile/desktop: Open browser menu (⋮ or Share) → Tap "Add to Home Screen" or "Install App".');
    }
  };

  const handleCopySvg = () => {
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#bg-gradient)" stroke="#ff073a" stroke-width="3" stroke-opacity="0.8"/>
  <defs>
    <linearGradient id="bg-gradient" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#140206"/>
      <stop offset="1" stop-color="#26050c"/>
    </linearGradient>
    <linearGradient id="neon-gradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff3366"/>
      <stop offset="1" stop-color="#ff073a"/>
    </linearGradient>
  </defs>
  <path d="M30 40H70V78C70 80.2091 68.2091 82 66 82H34C31.7909 82 30 80.2091 30 78V40Z" fill="url(#neon-gradient)" fill-opacity="0.25" stroke="#ff073a" stroke-width="3"/>
  <path d="M40 40V30C40 24.4772 44.4772 20 50 20C55.5228 20 60 24.4772 60 30V40" stroke="#ff073a" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 82V62C42 60.8954 42.8954 60 44 60H56C57.1046 60 58 60.8954 58 62V82" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.9"/>
  <path d="M75 25L77.5 32L84.5 34.5L77.5 37L75 44L72.5 37L65.5 34.5L72.5 32L75 25Z" fill="#ff3366"/>
  <path d="M25 65L26.25 68.5L29.75 69.75L26.25 71L25 74.5L23.75 71L20.25 69.75L23.75 68.5L25 65Z" fill="#ff073a"/>
</svg>`;
    navigator.clipboard.writeText(svgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2500);
  };

  const handleDownloadFavicon = () => {
    const a = document.createElement('a');
    a.href = '/favicon.svg';
    a.download = 'central-mall-neon-favicon.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-4xl bg-[#0a0a0f] border-2 border-[#ff073a]/70 rounded-3xl shadow-[0_0_50px_rgba(255,7,58,0.35)] overflow-hidden text-gray-100 p-6 sm:p-8"
      >
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002147] via-[#ff073a] to-[#CE1126]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] flex items-center justify-center shadow-[0_0_15px_rgba(255,7,58,0.6)] border border-[#ff3366]/40 p-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Central Mall PWA (PAW) App Download</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff073a]/20 text-rose-300 border border-[#ff073a]/40 font-mono">
                  v2.0
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Install as a native home-screen app with offline support and neon red favicon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-center">
          {/* Left: Animated Neon Mall SVG & Tab Simulator */}
          <div className="md:col-span-5 flex flex-col items-center bg-[#12121c] border border-gray-800 rounded-3xl p-6 neon-card-glow relative overflow-hidden text-center">
            <div className="w-28 h-28 md:w-32 md:h-32 p-4 bg-gray-950/90 rounded-2xl border border-gray-800 flex items-center justify-center mb-4 shadow-inner">
              <div className="animate-float animate-neon-pulse">
                <svg className="w-24 h-24 neon-glow" viewBox="0 0 100 100" fill="none">
                  <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#pwa-bg-grad)" stroke="#ff073a" strokeWidth="3" strokeOpacity="0.8"/>
                  <defs>
                    <linearGradient id="pwa-bg-grad" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#140206"/>
                      <stop offset="1" stopColor="#26050c"/>
                    </linearGradient>
                    <linearGradient id="pwa-neon-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ff3366"/>
                      <stop offset="1" stopColor="#ff073a"/>
                    </linearGradient>
                  </defs>
                  <path d="M30 40H70V78C70 80.2 68.2 82 66 82H34C31.8 82 30 80.2 30 78V40Z" fill="url(#pwa-neon-grad)" fillOpacity="0.25" stroke="#ff073a" strokeWidth="3"/>
                  <path d="M40 40V30C40 24.5 44.5 20 50 20C55.5 20 60 24.5 60 30V40" stroke="#ff073a" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M42 82V62C42 60.9 42.9 60 44 60H56C57.1 60 58 60.9 58 62V82" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.9"/>
                  <path d="M75 25L77.5 32L84.5 34.5L77.5 37L75 44L72.5 37L65.5 34.5L72.5 32L75 25Z" fill="#ff3366"/>
                  <path d="M25 65L26.25 68.5L29.75 69.75L26.25 71L25 74.5L23.75 71L20.25 69.75L23.75 68.5L25 65Z" fill="#ff073a"/>
                </svg>
              </div>
            </div>

            {/* Simulated Browser Tab */}
            <div className="w-full bg-gray-900/90 border border-gray-800 rounded-xl p-2.5 flex items-center space-x-2 text-left">
              <div className="flex space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 bg-gray-950 rounded-lg px-2 py-1 flex items-center space-x-1.5 border border-gray-800 text-[10px] text-gray-300">
                <span className="w-3 h-3 text-[#ff073a]">🏛️</span>
                <span className="truncate">Central Mall - Miotso Hub</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">
              Matches official Central University crimson & neon red branding
            </p>
          </div>

          {/* Right: Install Action & Instructions */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-[#12121c] border border-gray-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                One-Click App Download
              </h4>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Enjoy high-speed access to the Student Marketplace, Clinic OPD consultations, and Campus GPS without needing an app store download.
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:from-[#ff1a47] hover:to-[#ff073a] shadow-[0_0_20px_rgba(255,7,58,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download / Install Central Mall PWA</span>
              </button>

              {installStatus && (
                <div className="mt-3 p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-rose-200">
                  {installStatus}
                </div>
              )}
            </div>

            {/* Quick Assets Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadFavicon}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#ff073a]" />
                <span>Download favicon.svg</span>
              </button>

              <button
                onClick={handleCopySvg}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#ff073a]" />}
                <span>{copiedSvg ? 'Copied!' : 'Copy SVG Code'}</span>
              </button>
            </div>

            {/* Standalone Suite Link */}
            <div className="pt-2 text-center sm:text-left flex items-center justify-between text-xs text-gray-400">
              <a
                href="/favicon-suite.html"
                target="_blank"
                rel="noreferrer"
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <span>Open Fullscreen Favicon & Animation Suite</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-gray-500 font-mono">Shift + A for Admin</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
