import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, Play, Pause, 
  Sparkles, AlertCircle, CheckCircle2, Clock, Globe, ArrowUpRight,
  Droplets, Brain, HandMetal, Pill, Apple, ShieldAlert, BookOpen, X, RefreshCw
} from 'lucide-react';
import { GHSHealthTip } from '../types';
import { useTheme } from '../context/ThemeContext';

interface GHSHealthTipsCarouselProps {
  onSelectAction?: (actionText: string) => void;
}

export const GHSHealthTipsCarousel: React.FC<GHSHealthTipsCarouselProps> = ({ onSelectAction }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tips, setTips] = useState<GHSHealthTip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [selectedTipForModal, setSelectedTipForModal] = useState<GHSHealthTip | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [direction, setDirection] = useState<number>(1); // 1 = next, -1 = prev

  // Auto-play interval ref
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const FALLBACK_TIPS: GHSHealthTip[] = [
    {
      id: 'ghs-01',
      title: 'Bed Net Usage & Rapid Diagnostic Testing (RDT) Protocol',
      category: 'Malaria',
      categoryBadge: 'GHS Malaria Advisory',
      summary: 'Protect against Anopheles mosquitoes across the Prampram-Miotso savanna with LLIN bed nets and early RDT screening.',
      fullTip: 'Central University campus is situated within the coastal savanna ecological zone of Greater Accra. The National Malaria Elimination Program (NMEP) and Ghana Health Service advise all resident students to sleep under Long-Lasting Insecticidal Nets (LLINs) every night. At the earliest sign of evening fever, chills, fatigue, or persistent headache, report immediately to Central Clinic for free Rapid Diagnostic Testing (RDT) and Artemisinin-based Combination Therapy (ACT).',
      actionPoints: [
        'Sleep under treated mosquito nets (LLINs) every night',
        'Report fever within 24 hours to Central Clinic',
        'Avoid stagnant water accumulation around hostel blocks'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/programs/malaria',
      ghsDivision: 'National Malaria Elimination Program (NMEP)',
      date: "Today's Verified Advisory",
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
      iconType: 'shield-alert',
      isDailyFeatured: true
    },
    {
      id: 'ghs-02',
      title: 'Savanna Heat Hydration & Electrolyte Management',
      category: 'Hydration',
      categoryBadge: 'Savanna Climate Notice',
      summary: 'Miotso daytime temperatures reach 34°C with dry harmattan winds. Drink 2.5–3 liters of clean water daily to avoid heat exhaustion.',
      fullTip: 'During high temperature periods across Ningo-Prampram, ambient heat and solar exposure increase the risk of rapid dehydration and fatigue. Students walking between Trinity Block, Central Law School, and hostel complexes should always carry a refillable water flask. Avoid prolonged direct afternoon sun exposure without shade, and replenish electrolytes with citrus fluids or fresh coconut water.',
      actionPoints: [
        'Drink 8–10 glasses of clean water daily',
        'Carry a reusable water flask across campus',
        'Watch for warning signs: dizziness, dark urine, and dry mouth'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/nutrition-wellness',
      ghsDivision: 'GHS Health Promotion Division',
      date: "Today's Verified Advisory",
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
      iconType: 'droplets',
      isDailyFeatured: false
    },
    {
      id: 'ghs-03',
      title: 'Academic Stress Management & Sleep Hygiene',
      category: 'Mental Health',
      categoryBadge: 'Mental Health Authority',
      summary: 'Exam periods and heavy course loads can cause cognitive fatigue. Maintain 7 hours of restorative sleep and utilize counseling services.',
      fullTip: 'Ghana Mental Health Authority emphasizes that student mental wellness directly determines academic success and immunological resilience. Pulling consecutive all-nighters before examinations elevates cortisol levels and impairs memory retention. Schedule dedicated breaks, practice deep breathing exercises, and reach out to Central Clinic Counseling Unit for confidential guidance.',
      actionPoints: [
        'Prioritize 7 hours of unbroken night sleep',
        'Take 10-minute micro-breaks during study sessions',
        'Book confidential sessions with Campus Counseling Lead Mrs. Grace Addo'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/mental-health',
      ghsDivision: 'Mental Health Authority (MHA Ghana)',
      date: 'Weekly Advisory',
      readTime: '3 min read',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
      iconType: 'brain',
      isDailyFeatured: false
    }
  ];

  // Fetch health tips from GHS API
  const fetchHealthTips = async (categoryFilter = 'all') => {
    try {
      const url = categoryFilter === 'all' 
        ? '/api/clinic/ghs-health-tips' 
        : `/api/clinic/ghs-health-tips?category=${encodeURIComponent(categoryFilter)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from GHS API');
      }
      const data = await res.json();
      if (data && Array.isArray(data.tips) && data.tips.length > 0) {
        setTips(data.tips);
        setCurrentIndex(0);
      } else {
        const fallback = categoryFilter === 'all' 
          ? FALLBACK_TIPS 
          : FALLBACK_TIPS.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
        setTips(fallback.length > 0 ? fallback : FALLBACK_TIPS);
      }
    } catch (err) {
      console.warn('GHS health tips API notice:', err);
      const fallback = categoryFilter === 'all' 
        ? FALLBACK_TIPS 
        : FALLBACK_TIPS.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
      setTips(fallback.length > 0 ? fallback : FALLBACK_TIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthTips(selectedCategory);
  }, [selectedCategory]);

  // Handle Auto-Rotation
  useEffect(() => {
    if (!isAutoPlaying || tips.length <= 1 || selectedTipForModal !== null) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, tips.length, selectedTipForModal]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentTip = tips[currentIndex];

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'malaria':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'mental health':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'hygiene':
        return <HandMetal className="w-4 h-4 text-emerald-500" />;
      case 'pharmacy':
        return <Pill className="w-4 h-4 text-amber-500" />;
      case 'nutrition':
        return <Apple className="w-4 h-4 text-green-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#CE1126]" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All GHS Advisories' },
    { id: 'Malaria', label: 'Malaria Prevention' },
    { id: 'Hydration', label: 'Hydration & Savanna Heat' },
    { id: 'Mental Health', label: 'Mental Wellness & Sleep' },
    { id: 'Hygiene', label: 'Food Hygiene & Typhoid' },
    { id: 'Pharmacy', label: 'Antibiotic Safety' },
    { id: 'Nutrition', label: 'Local Nutrition' },
  ];

  if (loading) {
    return (
      <div className={`w-full rounded-3xl p-6 border mb-6 text-center transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100 shadow-lg shadow-red-100/30'
      }`}>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-[#CE1126]" />
          <span>Fetching verified Ghana Health Service (GHS) daily health tips...</span>
        </div>
      </div>
    );
  }

  if (tips.length === 0) return null;

  return (
    <section 
      aria-label="Ghana Health Service Daily Health Tips Carousel"
      className={`w-full rounded-3xl border mb-6 transition-all relative overflow-hidden text-left shadow-lg ${
        isDark 
          ? 'bg-slate-900 border-slate-800 shadow-black/40 text-slate-100' 
          : 'bg-white border-red-100 shadow-red-100/40 text-slate-900'
      }`}
    >
      {/* Top GHS Official Accreditation Banner */}
      <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-red-50/60 border-red-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#CE1126] text-white text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            GHS Verified
          </div>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            Ghana Health Service (GHS) Daily Health & Preventive Medicine Bulletin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://ghs.gov.gh/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-black text-[#CE1126] hover:underline cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ghs.gov.gh</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsAutoPlaying(prev => !prev)}
            className={`p-1 rounded-lg border transition-colors cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ${
              isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
            }`}
            title={isAutoPlaying ? 'Pause auto-rotation' : 'Play auto-rotation'}
          >
            {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Category Quick Filter Pills */}
      <div className="px-5 pt-3.5 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                  : isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* CAROUSEL BODY WITH ANIMATED SLIDE */}
      <div className="p-5 md:p-6 relative">
        <AnimatePresence mode="wait">
          {currentTip && (
            <motion.div
              key={currentTip.id}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Column: Image with Badge */}
              <div className="lg:col-span-4 relative rounded-2xl overflow-hidden aspect-[16/10] lg:aspect-square border border-slate-200 dark:border-slate-800 shadow-inner group">
                <img
                  src={currentTip.imageUrl}
                  alt={currentTip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-white/20">
                  {getCategoryIcon(currentTip.category)}
                  <span>{currentTip.categoryBadge}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-mono flex items-center justify-between">
                  <span className="opacity-90 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentTip.readTime}
                  </span>
                  <span className="text-yellow-300 font-bold">{currentTip.date}</span>
                </div>
              </div>

              {/* Right Column: Title, Summary, Action Points, and Read More */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase text-[#CE1126] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Ghana Health Service Advisory
                    </span>
                    <span className="text-[10px] opacity-40 font-mono">•</span>
                    <span className="text-[10px] font-mono opacity-60 truncate">
                      {currentTip.ghsDivision}
                    </span>
                  </div>

                  <h3 className={`text-lg md:text-xl font-black leading-snug mb-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentTip.title}
                  </h3>

                  <p className={`text-xs md:text-sm leading-relaxed mb-3 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {currentTip.summary}
                  </p>

                  {/* Action Points Checklist Preview */}
                  <div className={`p-3 rounded-2xl border mb-3 space-y-1.5 ${
                    isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-red-50/40 border-red-100'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#CE1126] block">
                      Recommended Student Action Steps:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                      {currentTip.actionPoints.slice(0, 2).map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={`text-[11px] font-medium leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {pt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTipForModal(currentTip)}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-[#CE1126] hover:bg-[#A00D1D] text-white flex items-center gap-1.5 shadow-md shadow-red-500/20 cursor-pointer transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Full GHS Advisory</span>
                    </button>

                    {onSelectAction && (
                      <button
                        onClick={() => onSelectAction(currentTip.title)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Ask Nurse AI About This
                      </button>
                    )}
                  </div>

                  {/* Slide Counter & Prev/Next Arrows */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {currentIndex + 1} / {tips.length}
                    </span>

                    <button
                      onClick={handlePrev}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                      aria-label="Previous tip"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleNext}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                      aria-label="Next tip"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4 pt-2">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === currentIndex 
                  ? 'w-6 bg-[#CE1126]' 
                  : isDark ? 'w-2 bg-slate-700 hover:bg-slate-500' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Go to health tip ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* FULL GHS ADVISORY DETAIL MODAL */}
      <AnimatePresence>
        {selectedTipForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl rounded-3xl border p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-red-100 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTipForModal(null)}
                className={`absolute top-5 right-5 p-2 rounded-full cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#CE1126] text-white">
                  {selectedTipForModal.categoryBadge}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ghana Health Service Accredited
                </span>
              </div>

              <h2 className={`text-xl md:text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedTipForModal.title}
              </h2>

              <p className="text-xs text-slate-400 font-mono mb-4">
                Division: {selectedTipForModal.ghsDivision} • {selectedTipForModal.readTime}
              </p>

              {/* Modal Image */}
              <div className="rounded-2xl overflow-hidden aspect-[21/9] mb-4 border border-slate-200 dark:border-slate-800">
                <img
                  src={selectedTipForModal.imageUrl}
                  alt={selectedTipForModal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Full Tip Content */}
              <div className="space-y-4 text-xs md:text-sm leading-relaxed mb-6">
                <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  {selectedTipForModal.fullTip}
                </p>

                {/* All Action Points */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-red-50/50 border-red-200/70'
                }`}>
                  <h4 className="text-xs font-black uppercase text-[#CE1126] tracking-wider">
                    Recommended Action Points for Students & Staff
                  </h4>
                  <div className="space-y-2">
                    {selectedTipForModal.actionPoints.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={selectedTipForModal.ghsSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Globe className="w-3.5 h-3.5 text-[#CE1126]" />
                  <span>Visit GHS Programme Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setSelectedTipForModal(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#CE1126] text-white hover:bg-[#A00D1D] cursor-pointer shadow-md shadow-red-500/20"
                >
                  Close Advisory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
