import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('cu_mall_theme') as Theme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      // Default to dark theme or user system preference
      return 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('cu_mall_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme === 'dark' ? 'dark' : 'light'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      id="theme-toggle-button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className={`relative inline-flex items-center gap-2 p-2 rounded-full border transition-all cursor-pointer select-none ${
        theme === 'dark'
          ? 'bg-slate-800/90 text-amber-300 border-slate-700 hover:bg-slate-700/90 hover:border-amber-400/40 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#CE1126] shadow-sm'
      } ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-300 fill-amber-300/20" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        )}
      </motion.div>
      {showLabel && (
        <span className="text-xs font-bold capitalize mr-1">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
