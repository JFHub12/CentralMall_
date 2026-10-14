import React from 'react';

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

/**
 * ActionTooltip
 * Ultra-minimalist cursor-hover floating tooltip for desktop (>= 1024px breakpoint).
 * Keeps mobile (< 1024px) clean and tap-friendly without sticky touch artifacts.
 */
export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  label,
  children,
  position = 'bottom',
  className = '',
}) => {
  return (
    <div className={`relative group inline-flex items-center justify-center ${className}`}>
      {children}
      {/* Floating Tooltip: Desktop cursor hover only (breakpoint: lg = 1024px) */}
      <div
        role="tooltip"
        className={`hidden lg:flex pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 items-center justify-center
          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out
          ${position === 'bottom' ? 'top-full mt-2.5' : 'bottom-full mb-2.5'}
        `}
      >
        <div className="relative bg-slate-900/95 text-white dark:bg-slate-800/95 dark:text-slate-100 text-[11px] font-bold tracking-tight px-3 py-1.5 rounded-xl shadow-2xl border border-white/10 dark:border-slate-700/80 backdrop-blur-md whitespace-nowrap">
          {label}
          {/* Caret arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-slate-800/95 border-white/10 dark:border-slate-700/80 ${
              position === 'bottom'
                ? '-top-1 border-t border-l'
                : '-bottom-1 border-b border-r'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
