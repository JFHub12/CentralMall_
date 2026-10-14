import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Globe, ExternalLink, RefreshCw, Search, Sparkles, Filter, 
  Calendar, Building2, ChevronRight, X, AlertCircle, Bookmark, Check,
  Share2, ShieldCheck, Stethoscope, Navigation, ShoppingBag
} from 'lucide-react';
import { CampusNotice } from '../types';
import { useTheme } from '../context/ThemeContext';
import { PenBookLoading3D } from './PenBookLoading3D';

interface CampusUpdatesCardProps {
  onNavigateToOption?: (option: 'shop' | 'gps' | 'clinic', query?: string) => void;
}

export const CampusUpdatesCard: React.FC<CampusUpdatesCardProps> = ({ onNavigateToOption }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [notices, setNotices] = useState<CampusNotice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNotice, setActiveNotice] = useState<CampusNotice | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just Now');
  const [savedNoticeIds, setSavedNoticeIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const categories = ['All', 'Academic', 'Admissions', 'SRC', 'Clinic & Health', 'Administration', 'Events'];

  const fetchNotices = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/campus/notices');
      if (!res.ok) return;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      const data = await res.json();
      if (data && data.notices) {
        setNotices(data.notices);
        if (data.lastSyncTime) setLastSyncTime(data.lastSyncTime);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Filter notices by category and search
  const filteredNotices = notices.filter((notice) => {
    const matchesCategory = selectedCategory === 'All' || notice.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      notice.title.toLowerCase().includes(query) ||
      notice.summary.toLowerCase().includes(query) ||
      notice.source.toLowerCase().includes(query) ||
      notice.content.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const toggleSaveNotice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedNoticeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section 
      id="campus-updates-section"
      className={`rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all border text-left mb-8 relative overflow-hidden ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-black/50' 
          : 'bg-white border-red-100 shadow-red-100/50'
      }`}
    >
      {/* Top Background Gradient Aura */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-red-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#CE1126] to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#CE1126] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Official Feed
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300' 
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <Globe className="w-3 h-3 text-[#CE1126]" /> central.edu.gh
              </span>
            </div>
            <h2 className={`text-xl md:text-2xl font-black flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Campus Updates & Official Notices
            </h2>
          </div>
        </div>

        {/* Action Controls: Refresh & Official Website Link */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="http://central.edu.gh/"
            target="_blank"
            rel="noopener noreferrer"
            id="official-central-website-link"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#CE1126] hover:bg-[#A00D1D] text-white shadow-md shadow-red-500/20 transition-all cursor-pointer"
            title="Open official Central University website"
          >
            <span>Visit central.edu.gh</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => fetchNotices(true)}
            disabled={refreshing || loading}
            id="refresh-notices-button"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-red-50 border-slate-200 text-slate-700 hover:text-[#CE1126]'
            }`}
            title="Fetch latest updates from central.edu.gh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#CE1126]' : ''}`} />
            <span>{refreshing ? 'Fetching Updates...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 relative z-10">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-md shadow-red-500/20'
                  : isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium transition-colors focus:outline-none focus:border-[#CE1126] border ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notices Grid / List */}
      <div className="relative z-10">
        {loading ? (
          <PenBookLoading3D 
            message="Connecting to central.edu.gh official newsfeed..." 
            subMessage="Synchronizing live campus updates & official notices" 
          />
        ) : filteredNotices.length === 0 ? (
          <PenBookLoading3D 
            message="No campus updates or official notices at the moment" 
            subMessage="Check back soon for official announcements from Central University Ghana." 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotices.map((notice) => {
              const isSaved = savedNoticeIds.includes(notice.id);
              const isUrgent = notice.priority === 'urgent';
              const isImportant = notice.priority === 'important';

              return (
                <motion.article
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setActiveNotice(notice)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                    isUrgent
                      ? isDark 
                        ? 'bg-red-950/20 border-red-900/60 hover:border-red-500/80 shadow-md' 
                        : 'bg-red-50/50 border-red-200 hover:border-red-300 shadow-md'
                      : isDark
                        ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 shadow-md'
                        : 'bg-white border-slate-200/80 hover:border-red-200 shadow-md'
                  }`}
                >
                  {/* Left Priority Indicator Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    isUrgent ? 'bg-[#CE1126]' : isImportant ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />

                  <div>
                    {/* Notice Meta Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isUrgent 
                            ? 'bg-[#CE1126] text-white shadow-xs' 
                            : isImportant
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {notice.priority.toUpperCase()}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {notice.category}
                        </span>

                        {notice.isNew && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-white animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleSaveNotice(notice.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSaved 
                              ? 'text-amber-500 bg-amber-500/10' 
                              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title={isSaved ? 'Notice saved' : 'Bookmark notice'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500' : ''}`} />
                        </button>

                        <span className={`text-[11px] font-medium flex items-center gap-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {notice.date}
                        </span>
                      </div>
                    </div>

                    {/* Notice Title */}
                    <h3 className={`text-sm md:text-base font-black leading-snug mb-2 group-hover:text-[#CE1126] transition-colors ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {notice.title}
                    </h3>

                    {/* Notice Summary */}
                    <p className={`text-xs font-normal leading-relaxed line-clamp-2 mb-4 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {notice.summary}
                    </p>
                  </div>

                  {/* Notice Footer with Source & Link */}
                  <div className={`pt-3 border-t flex items-center justify-between text-xs gap-2 ${
                    isDark ? 'border-slate-700/60' : 'border-slate-100'
                  }`}>
                    <span className={`text-[11px] font-bold flex items-center gap-1 truncate ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <Building2 className="w-3 h-3 text-[#CE1126] shrink-0" />
                      <span className="truncate">{notice.source}</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={notice.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-extrabold text-[#CE1126] hover:underline flex items-center gap-0.5"
                        title="Open on official website"
                      >
                        <span>Official Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#CE1126] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Status Sync Bar */}
      <div className={`mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs relative z-10 ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified feeds from Academic Affairs, Vice-Chancellor Desk & Directorate of ICT</span>
        </div>
        <span className="font-mono text-[11px]">
          Last synched with central.edu.gh: <strong>{lastSyncTime}</strong>
        </span>
      </div>

      {/* FULL NOTICE DETAIL MODAL */}
      <AnimatePresence>
        {activeNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative text-left border overflow-hidden max-h-[90vh] flex flex-col justify-between ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-100' 
                  : 'bg-white border-red-100 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveNotice(null)}
                className={`absolute top-5 right-5 p-2 rounded-full cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto pr-1 space-y-4">
                {/* Header Tagging */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    activeNotice.priority === 'urgent'
                      ? 'bg-[#CE1126] text-white'
                      : activeNotice.priority === 'important'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {activeNotice.priority.toUpperCase()} NOTICE
                  </span>
                  
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {activeNotice.category}
                  </span>

                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Published: {activeNotice.date}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-black leading-tight text-[#CE1126]">
                  {activeNotice.title}
                </h2>

                {/* Meta details box */}
                <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-red-50/60 border-red-200/70'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Issuing Authority:</span>
                    <span className="font-black">{activeNotice.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Target Audience:</span>
                    <span className="font-black">{activeNotice.targetAudience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Official Link:</span>
                    <span className="font-mono text-[#CE1126] truncate max-w-[260px]">{activeNotice.officialLink}</span>
                  </div>
                </div>

                {/* Main Content Body */}
                <div className={`text-sm leading-relaxed space-y-3 pt-2 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <p className="font-medium">{activeNotice.summary}</p>
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {activeNotice.content}
                  </div>
                </div>

                {/* Contextual In-App Navigation Suggestions if applicable */}
                {onNavigateToOption && (
                  <div className="pt-2">
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Related Campus Quick-Actions:
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeNotice.category === 'Clinic & Health' && (
                        <button
                          onClick={() => {
                            setActiveNotice(null);
                            onNavigateToOption('clinic');
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Open School Clinic Desk</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveNotice(null);
                          onNavigateToOption('gps', activeNotice.category === 'Academic' ? 'Senate' : 'Clinic');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-red-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 text-[#CE1126]" />
                        <span>Locate Venue on GPS</span>
                      </button>

                      {activeNotice.category === 'Academic' && (
                        <button
                          onClick={() => {
                            setActiveNotice(null);
                            onNavigateToOption('shop', 'Textbook');
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-red-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                          <span>Browse Academic Textbooks</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className={`mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button
                  onClick={() => handleCopyLink(activeNotice.officialLink)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Notice Link'}</span>
                </button>

                <a
                  href={activeNotice.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#CE1126] hover:bg-[#A00D1D] text-white flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                >
                  <span>Open Full Memo on central.edu.gh</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
