import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MovingBackground } from './components/MovingBackground';
import { WelcomePage } from './components/WelcomePage';
import { AuthPage } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { ShopView } from './components/ShopView';
import { GPSView } from './components/GPSView';
import { ClinicView } from './components/ClinicView';
import { AIChatBotModal } from './components/AIChatBotModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { User } from './types';
import { Shield, Sparkles } from 'lucide-react';

function AppContent() {
  // Page Flow State: 1 = Welcome, 2 = Auth, 3 = Dashboard, 'shop' | 'gps' | 'clinic' = Sub Views
  const [currentPage, setCurrentPage] = useState<'welcome' | 'auth' | 'dashboard' | 'shop' | 'gps' | 'clinic'>('welcome');
  const { theme } = useTheme();
  
  // User Authentication State with localStorage session restoration
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('central_mall_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Search Query state passed from Dashboard
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [openSellDirectly, setOpenSellDirectly] = useState(false);

  // Global AI Chat Assistant Modal
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Admin Console State (Hidden until Shift + A is pressed)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('central_mall_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // PWA Install Prompt event & modal
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // Key refresh trigger for child views after admin modifications
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Capture PWA beforeinstallprompt & custom open events
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    const handleOpenPwaModal = () => setIsPwaModalOpen(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-pwa-install', handleOpenPwaModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenPwaModal);
    };
  }, []);

  // Global Keyboard Shortcut: Shift + A to reveal & open Admin Console
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is actively typing in a form input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Check for Shift + A combination
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminUnlocked(true);
        setIsAdminModalOpen((prev) => !prev);
        try {
          localStorage.setItem('central_mall_admin_unlocked', 'true');
        } catch {}

        setShortcutToast('🔐 Admin Console Shortcut (Shift + A) Activated');
        setTimeout(() => setShortcutToast(null), 3500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation Handlers
  const handleEnterFromWelcome = () => {
    if (user) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('auth');
    }
  };

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    try {
      localStorage.setItem('central_mall_active_user', JSON.stringify(loggedUser));
    } catch (e) {
      console.warn('Could not save user session', e);
    }
    setCurrentPage('dashboard');
  };

  const handleSelectDashboardOption = (option: 'shop' | 'gps' | 'clinic', query = '', openSellModal = false) => {
    setActiveSearchQuery(query);
    setOpenSellDirectly(openSellModal);
    setCurrentPage(option);
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('central_mall_active_user');
    } catch (e) {
      console.warn('Could not remove user session', e);
    }
    setCurrentPage('auth');
  };

  return (
    <div
      className={`relative min-h-screen font-sans transition-colors duration-300 overflow-x-hidden selection:bg-[#CE1126] selection:text-white ${
        theme === 'dark' ? 'bg-[#090D16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Animated Moving Background in School Red & White Theme */}
      <MovingBackground />

      {/* Main Page Routing */}
      <main className="relative z-10 min-h-screen">
        {currentPage === 'welcome' && (
          <WelcomePage onEnter={handleEnterFromWelcome} />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onLogin={handleLogin}
            onBackToWelcome={() => setCurrentPage('welcome')}
          />
        )}

        {currentPage === 'dashboard' && user && (
          <DashboardPage
            user={user}
            onSelectOption={handleSelectDashboardOption}
            onLogout={handleLogout}
            onOpenAIChat={() => setIsAIChatOpen(true)}
          />
        )}

        {currentPage === 'shop' && user && (
          <ShopView
            key={`shop-${refreshKey}`}
            user={user}
            initialSearchQuery={activeSearchQuery}
            initialOpenSellModal={openSellDirectly}
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'gps' && (
          <GPSView
            initialSearchQuery={activeSearchQuery}
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'clinic' && user && (
          <ClinicView
            key={`clinic-${refreshKey}`}
            user={user}
            onBackToDashboard={() => setCurrentPage('dashboard')}
          />
        )}
      </main>

      {/* Global AI Chat Assistant */}
      <AIChatBotModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        user={user}
      />

      {/* Admin Console Shortcut Toast */}
      {shortcutToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0a0a0f]/95 border-2 border-[#ff073a] text-rose-200 text-xs font-bold shadow-[0_0_30px_rgba(255,7,58,0.5)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff073a] animate-pulse" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Unlocked Admin Console Button (Hidden until Shift + A is pressed) */}
      {isAdminUnlocked && (
        <aside
          aria-label="Admin console navigation"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2"
        >
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#0a0a0f]/95 border-2 border-[#ff073a] text-white shadow-[0_0_25px_rgba(255,7,58,0.5)] hover:scale-105 active:scale-95 transition-all text-xs font-bold group"
            title="Open Central Mall Admin Console (Shift + A)"
          >
            <div className="w-5 h-5 rounded-lg bg-[#ff073a] flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">Admin Console</span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/60">
              Shift + A
            </span>
          </button>
          <button
            onClick={() => {
              setIsAdminUnlocked(false);
              try {
                localStorage.removeItem('central_mall_admin_unlocked');
              } catch {}
            }}
            className="p-2 rounded-xl bg-gray-950/90 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900 text-xs transition-colors"
            title="Hide Admin button until Shift + A is pressed"
          >
            ✕
          </button>
        </aside>
      )}

      {/* Master Admin Console Modal */}
      <AdminConsoleModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onProductsUpdated={() => setRefreshKey((prev) => prev + 1)}
        onNoticesUpdated={() => setRefreshKey((prev) => prev + 1)}
        pwaInstallPrompt={pwaPrompt}
      />

      {/* PWA (PAW) App Download & Favicon Suite Modal */}
      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        pwaInstallPrompt={pwaPrompt}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

