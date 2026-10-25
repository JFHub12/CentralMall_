import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Navigation, Stethoscope, LogOut, Sparkles, MapPin, 
  ChevronRight, User as UserIcon, Search, Tag, X, ArrowUpRight, FileText, 
  Download, CloudSun, DollarSign, Thermometer, Camera, Edit3, CheckCircle2, Globe, PlusCircle,
  Smartphone, Shield, Trash2
} from 'lucide-react';
import { User, Building, Product, detectGenderFromName } from '../types';
import { CampusUpdatesCard } from './CampusUpdatesCard';
import { useTheme, ThemeToggle } from '../context/ThemeContext';
import { ActionTooltip } from './ActionTooltip';

interface DashboardPageProps {
  user: User;
  onSelectOption: (option: 'shop' | 'gps' | 'clinic', searchQuery?: string, openSellModal?: boolean) => void;
  onLogout: () => void;
  onOpenAIChat: () => void;
  refreshTrigger?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onSelectOption,
  onLogout,
  onOpenAIChat,
  refreshTrigger,
}) => {
  const { theme } = useTheme();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ buildings: Building[]; products: Product[]; totalCount: number } | null>(null);
  const [searching, setSearching] = useState(false);

  // Live Web API States
  const [weather, setWeather] = useState<{ temperatureC: number; condition: string; windspeedKmH: number } | null>(null);
  const [rates, setRates] = useState<{ usdRate: number; eurRate: number; gbpRate: number } | null>(null);

  // User Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [newAvatarInput, setNewAvatarInput] = useState('');
  const [avatarUpdateMsg, setAvatarUpdateMsg] = useState<string | null>(null);

  // Fetch Live Weather & Rates from Backend APIs
  useEffect(() => {
    fetch('/api/weather')
      .then(async res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json();
      })
      .then(data => {
        if (data) setWeather(data);
      })
      .catch(() => {});

    fetch('/api/rates')
      .then(async res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json();
      })
      .then(data => {
        if (data) setRates(data);
      })
      .catch(() => {});
  }, []);

  // Live Backend Search Fetch
  useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/gps/search?q=${encodeURIComponent(globalSearch.trim())}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Expected JSON response');
        const data = await res.json();
        const buildings = Array.isArray(data?.buildings) ? data.buildings : [];
        const products = Array.isArray(data?.products) ? data.products : [];
        const totalCount = typeof data?.totalCount === 'number' 
          ? data.totalCount 
          : typeof data?.count === 'number' 
          ? data.count 
          : (buildings.length + products.length);

        setSearchResults({
          buildings,
          products,
          totalCount
        });
      } catch (err) {
        console.error('Backend search error', err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        user.avatar = result;
        setAvatarUpdateMsg('Profile photo updated successfully!');
        setTimeout(() => {
          setAvatarUpdateMsg(null);
          setShowAvatarModal(false);
        }, 1500);

        // Sync with backend
        fetch('/api/auth/update-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, avatar: result })
        }).catch(err => console.error('Avatar update failed', err));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUrlSave = () => {
    if (newAvatarInput.trim()) {
      setAvatarUrl(newAvatarInput.trim());
      user.avatar = newAvatarInput.trim();
      setAvatarUpdateMsg('Profile photo updated successfully!');
      setTimeout(() => {
        setAvatarUpdateMsg(null);
        setShowAvatarModal(false);
      }, 1500);

      fetch('/api/auth/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, avatar: newAvatarInput.trim() })
      }).catch(err => console.error('Avatar update failed', err));
    }
  };

  const handleRemoveAvatar = () => {
    const derivedGender = user.gender || detectGenderFromName(user.name);
    const defaultAvatar = derivedGender === 'female'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300';

    setAvatarUrl(defaultAvatar);
    user.avatar = defaultAvatar;
    setAvatarUpdateMsg('Removed profile picture. Reverted to gender default avatar.');
    setTimeout(() => {
      setAvatarUpdateMsg(null);
      setShowAvatarModal(false);
    }, 1500);

    fetch('/api/auth/update-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, avatar: defaultAvatar })
    }).catch(err => console.error('Avatar remove failed', err));
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen z-10 flex flex-col justify-between px-4 py-6 md:py-10 max-w-6xl mx-auto transition-colors duration-300 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Top Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-3.5 sm:p-4 lg:p-5 rounded-3xl backdrop-blur-md shadow-lg transition-all ${
          isDark 
            ? 'bg-[#0a1424]/90 border border-[#ff073a]/40 shadow-[0_0_30px_rgba(255,7,58,0.2)]' 
            : 'bg-white/95 border border-red-200/80 shadow-red-100/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(255,7,58,0.5)] border border-[#ff3366]/40 shrink-0">
            C
          </div>
          <div>
            <h1 className="text-xl font-black neon-crimson-text tracking-tight flex items-center gap-1.5">
              <span>CENTRAL MALL</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff073a]/20 text-rose-300 border border-[#ff073a]/40">
                MIOTSO
              </span>
            </h1>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <MapPin className="w-3 h-3 text-[#ff073a]" /> Central University Ghana
            </p>
          </div>
        </div>

        {/* Streamlined Minimalist Horizontal Action Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 max-w-full justify-start lg:justify-end">
          {/* User Profile Avatar & Badge Button */}
          <ActionTooltip label={`${user.name} (${user.role}) • Change Photo`}>
            <button
              onClick={() => setShowAvatarModal(true)}
              id="user-profile-badge-button"
              aria-label={`User Profile: ${user.name} (${user.role})`}
              className="relative w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full overflow-hidden border-2 border-[#ff073a] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer p-0.5 bg-slate-900 shrink-0"
            >
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </ActionTooltip>

          {/* + Sell on Market Header Quick Action (Only for Merchants) */}
          {user.role === 'merchant' && (
            <ActionTooltip label="Sell on Market (+ List Item)">
              <button
                onClick={() => onSelectOption('shop', '', true)}
                id="sell-on-market-header"
                aria-label="List an Item to Sell on Marketplace"
                className="w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center bg-[#CE1126] hover:bg-[#A00D1D] text-white shadow-md shadow-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <PlusCircle className="w-5 h-5 text-white" />
              </button>
            </ActionTooltip>
          )}

          {/* PWA App Download Button (Pure Icon Symbol + Tooltip) */}
          <ActionTooltip label="Install Central Mall PWA App">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }}
              id="pwa-app-download-header"
              aria-label="Download and Install Central Mall PWA App"
              className={`w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center shadow-sm transition-all cursor-pointer border hover:scale-105 active:scale-95 shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <Smartphone className="w-5 h-5 text-[#ff073a]" />
            </button>
          </ActionTooltip>

          {/* Theme Switcher Toggle */}
          <ActionTooltip label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <ThemeToggle className="w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] flex items-center justify-center p-0 shrink-0" />
          </ActionTooltip>

          {/* AI Assistant Quick Button (Pure Icon Symbol + Tooltip) */}
          <ActionTooltip label="Campus AI Assistant">
            <button
              onClick={onOpenAIChat}
              id="open-ai-chat-header"
              aria-label="Open Campus AI Assistant"
              className="relative w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center bg-[#CE1126] hover:bg-[#A00D1D] text-white shadow-md shadow-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </button>
          </ActionTooltip>

          {/* Logout Button (Pure Icon Symbol + Tooltip) */}
          <ActionTooltip label="Log Out">
            <button
              onClick={onLogout}
              id="logout-button"
              aria-label="Log Out"
              className={`w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer border hover:scale-105 active:scale-95 shrink-0 ${
                isDark
                  ? 'bg-slate-800 hover:bg-red-950/60 border-slate-700 text-slate-300 hover:text-red-400'
                  : 'bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-[#CE1126]'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </ActionTooltip>
        </div>
      </motion.header>

      {/* Main Choice Section */}
      <div className="my-auto py-6">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex flex-wrap items-center justify-center gap-2 mb-3"
          >
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border ${
              isDark 
                ? 'bg-red-950/50 border-red-800/80 text-red-300' 
                : 'bg-red-100/80 border-red-200 text-[#CE1126]'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#CE1126]" />
              Central University Miotso
            </span>

            {/* Live Weather Pill */}
            {weather && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs border ${
                isDark 
                  ? 'bg-sky-950/50 border-sky-800/80 text-sky-300' 
                  : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}>
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                <span>{weather.temperatureC}°C</span>
                <span className="opacity-75">({weather.condition})</span>
              </span>
            )}

            {/* Live Exchange Rate Pill */}
            {rates && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs border ${
                isDark 
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>1 GHS = ${rates.usdRate}</span>
              </span>
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-3xl md:text-5xl font-black tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Welcome, <span className="text-[#CE1126]">{user.name}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-sm md:text-base font-medium mt-2 max-w-xl mx-auto ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            What would you like to explore today on Central University Miotso Main Campus?
          </motion.p>
        </div>

        {/* Universal Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#CE1126]" />
            <input
              type="text"
              placeholder="Search buildings (Senate, Trinity), textbooks, laptops, clinics..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className={`w-full pl-12 pr-10 py-3.5 border-2 rounded-2xl text-sm transition-all focus:outline-none focus:border-[#CE1126] shadow-lg ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 shadow-black/50' 
                  : 'bg-white border-red-200/80 text-slate-900 placeholder-slate-400 shadow-red-100/50'
              }`}
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          <AnimatePresence>
            {searchResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute left-0 right-0 top-full mt-2 rounded-3xl p-4 shadow-2xl z-30 max-h-80 overflow-y-auto text-left border ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200' 
                    : 'bg-white border-red-100 text-slate-800'
                }`}
              >
                {searching ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Searching Miotso Campus...</p>
                ) : (searchResults.totalCount === 0 || ((searchResults.buildings?.length || 0) === 0 && (searchResults.products?.length || 0) === 0)) ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No campus results found for "{globalSearch}"</p>
                ) : (
                  <div className="space-y-3">
                    {Boolean(searchResults.buildings && searchResults.buildings.length > 0) && (
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#CE1126] tracking-wider mb-1.5">
                          Campus Buildings & Landmarks ({searchResults.buildings?.length || 0})
                        </p>
                        <div className="space-y-1">
                          {(searchResults.buildings || []).map((b) => (
                            <button
                              key={b.id}
                              onClick={() => onSelectOption('gps', b.name)}
                              className={`w-full p-2 rounded-xl flex items-center justify-between text-xs text-left cursor-pointer transition-colors ${
                                isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-red-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#CE1126]" />
                                <div>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">[{b.code}]</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-[#CE1126] font-bold">View on GPS &rarr;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {Boolean(searchResults.products && searchResults.products.length > 0) && (
                      <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className="text-[10px] font-black uppercase text-[#CE1126] tracking-wider mb-1.5">
                          Marketplace Items ({searchResults.products?.length || 0})
                        </p>
                        <div className="space-y-1">
                          {(searchResults.products || []).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onSelectOption('shop', p.title)}
                              className={`w-full p-2 rounded-xl flex items-center justify-between text-xs text-left cursor-pointer transition-colors ${
                                isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-red-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-[#CE1126]" />
                                <div>
                                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</span>
                                  <span className="text-[10px] text-[#CE1126] font-extrabold ml-2">GHS {p.price}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-[#CE1126] font-bold">Open Shop &rarr;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3 Main Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* OPTION 1: SHOP */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => onSelectOption('shop')}
            id="dashboard-card-shop"
            className="neon-cu-card rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left border group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-[#ff073a]/20 border border-[#ff073a]/50 text-[#ff073a] group-hover:bg-[#ff073a] group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(255,7,58,0.35)]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff073a] mb-1">
                <span>Central Marketplace</span>
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-black mb-2 text-white group-hover:text-[#ff073a] transition-colors">
                Marketplace & Sell
              </h3>
              <p className="text-xs font-medium leading-relaxed mb-4 text-slate-300">
                {user.role === 'merchant'
                  ? 'List textbooks, laptops, apparel, and food with photos. Open to verified merchants with instant MoMo and WhatsApp chat.'
                  : 'Browse textbooks, laptops, apparel, and food with instant MoMo and WhatsApp chat. Buying mode for students and visitors.'}
              </p>

              {/* Direct Sell Item CTA - Only for Merchants */}
              {user.role === 'merchant' && (
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOption('shop', '', true);
                    }}
                    className="btn-neon-crimson px-3.5 py-1.5 text-white text-[11px] font-extrabold rounded-full flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Sell an Item Now</span>
                  </button>
                  <span className="text-[10px] text-gray-400 font-bold">Verified merchant listing</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
              <span className="text-xs font-extrabold text-slate-300 group-hover:text-[#ff073a] transition-colors">
                Explore Marketplace & Buy
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-800 text-slate-300 group-hover:bg-[#ff073a] group-hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* OPTION 2: GPS MAP */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => onSelectOption('gps')}
            id="dashboard-card-gps"
            className="neon-cu-card rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left border group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-[#002147] border border-blue-400/50 text-blue-300 group-hover:bg-[#ff073a] group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(0,33,71,0.5)]">
                <Navigation className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                <span>Campus Road GPS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-xl font-black mb-2 text-white group-hover:text-[#ff073a] transition-colors">
                Campus GPS & Directions
              </h3>
              <p className="text-xs font-medium leading-relaxed mb-6 text-slate-300">
                Step-by-step road navigation with clear lanes, turn-by-turn guidance, and live vehicle tracking across Central University Miotso.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
              <span className="text-xs font-extrabold text-slate-300 group-hover:text-[#ff073a] transition-colors">
                Get Campus Directions
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-800 text-slate-300 group-hover:bg-[#ff073a] group-hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* OPTION 3: CLINIC */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => onSelectOption('clinic')}
            id="dashboard-card-clinic"
            className="neon-cu-card rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left border group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 group-hover:bg-[#ff073a] group-hover:text-white transition-colors duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <span>Ghana Health Service (GHS)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  NHIS
                </span>
              </div>
              <h3 className="text-xl font-black mb-2 text-white group-hover:text-[#ff073a] transition-colors">
                School Clinic & Triage
              </h3>
              <p className="text-xs font-medium leading-relaxed mb-6 text-slate-300">
                24/7 medical triage based on GHS clinical protocols, malaria rapid diagnosis, emergency ambulance dispatch, and doctor appointments.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
              <span className="text-xs font-extrabold text-slate-300 group-hover:text-[#ff073a] transition-colors">
                Consult Clinic Nurse
              </span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-800 text-slate-300 group-hover:bg-[#ff073a] group-hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Official Campus Updates & Notices from central.edu.gh */}
        <div className="mt-8">
          <CampusUpdatesCard onNavigateToOption={onSelectOption} refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-8 pt-4 border-t text-center text-xs flex flex-wrap items-center justify-between gap-2 ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <p className="flex items-center gap-2">
          <span>© 2026 Central University Ghana • Miotso Main Campus</span>
          <span className="text-[10px] text-gray-500 font-mono">(Admin Shortcut: Shift + A)</span>
        </p>
        <div className="flex items-center gap-4 font-bold">
          <a href="http://central.edu.gh/" target="_blank" rel="noreferrer" className="text-[#CE1126] hover:underline flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>central.edu.gh</span>
          </a>
          <a href="https://ghs.gov.gh/" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>ghs.gov.gh</span>
          </a>
          <button onClick={onOpenAIChat} className="hover:text-[#CE1126] cursor-pointer">
            Ask Central AI
          </button>
        </div>
      </footer>

      {/* PROFILE PICTURE / AVATAR MODAL */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-left border ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-100' 
                  : 'bg-white border-red-100 text-slate-800'
              }`}
            >
              <button
                onClick={() => setShowAvatarModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Insert Your Profile Picture
                </h3>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Upload a photo from your computer or phone to display on your profile and marketplace listings.
                </p>
              </div>

              {avatarUpdateMsg && (
                <div className={`mb-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  isDark 
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{avatarUpdateMsg}</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center mb-5">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#CE1126] shadow-lg mb-3">
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-center gap-2 py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-full cursor-pointer shadow-md transition-all">
                  <Camera className="w-4 h-4" />
                  <span>Upload Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste photo URL..."
                    value={newAvatarInput}
                    onChange={(e) => setNewAvatarInput(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAvatarUrlSave}
                    className={`px-4 py-2 font-bold text-xs rounded-xl cursor-pointer ${
                      isDark ? 'bg-[#CE1126] hover:bg-[#A00D1D] text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Save
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'bg-red-950/40 hover:bg-red-900/50 border-red-800/80 text-red-300' 
                      : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#CE1126]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Added Profile Picture</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

