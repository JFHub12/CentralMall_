import React from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

export type ClothingSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type ClothingColorKey = 'black' | 'slate' | 'navy' | 'white' | 'beige' | 'olive';

export interface ClothingColorOption {
  key: ClothingColorKey;
  label: string;
  hex: string;
  borderClass?: string;
  checkColor: string;
}

export const CLOTHING_COLORS: ClothingColorOption[] = [
  { key: 'black', label: 'Black', hex: '#141414', checkColor: 'text-white' },
  { key: 'slate', label: 'Slate', hex: '#455260', checkColor: 'text-white' },
  { key: 'navy', label: 'Navy', hex: '#1c2838', checkColor: 'text-white' },
  { key: 'white', label: 'White', hex: '#ffffff', borderClass: 'border border-slate-300 shadow-sm', checkColor: 'text-slate-900' },
  { key: 'beige', label: 'Beige', hex: '#e3dcd1', checkColor: 'text-slate-800' },
  { key: 'olive', label: 'Olive', hex: '#506336', checkColor: 'text-white' },
];

export const CLOTHING_SIZES: ClothingSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

interface ClothingFilterPanelProps {
  selectedSizes: ClothingSize[];
  selectedColor: ClothingColorKey | null;
  onToggleSize: (size: ClothingSize) => void;
  onSelectColor: (color: ClothingColorKey) => void;
  onClearFilters: () => void;
  totalFilteredCount?: number;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const ClothingFilterPanel: React.FC<ClothingFilterPanelProps> = ({
  selectedSizes,
  selectedColor,
  onToggleSize,
  onSelectColor,
  onClearFilters,
  totalFilteredCount,
  className = '',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const hasActiveFilters = selectedSizes.length > 0 || selectedColor !== null;

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      {/* Top Header matching reference image: FILTERS */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
            FILTERS
          </h2>
          {hasActiveFilters && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#CE1126] dark:text-red-400">
              {selectedSizes.length + (selectedColor ? 1 : 0)} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#CE1126] transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all size and colour filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: SIZE */}
      <div className="py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
            SIZE
          </h3>
          {selectedSizes.length > 0 && (
            <span className="text-[10px] text-slate-400 font-medium">
              {selectedSizes.join(', ')}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {CLOTHING_SIZES.map((size) => {
            const isChecked = selectedSizes.includes(size);
            return (
              <label
                key={size}
                className="flex items-center gap-3 cursor-pointer group select-none py-0.5"
                onClick={() => onToggleSize(size)}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-500'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-sm font-semibold tracking-wide transition-colors ${
                    isChecked
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900'
                  }`}
                >
                  {size}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: COLOUR */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
            COLOUR
          </h3>
          {selectedColor && (
            <span className="text-[10px] font-bold text-[#CE1126] capitalize">
              {selectedColor}
            </span>
          )}
        </div>

        {/* Circular swatches in exact sequence from mockup: Black, Slate, Navy, White, Beige, Olive */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {CLOTHING_COLORS.map((color) => {
            const isSelected = selectedColor === color.key;
            return (
              <button
                key={color.key}
                type="button"
                onClick={() => onSelectColor(color.key)}
                className={`relative w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  color.borderClass || ''
                } ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 shadow-md'
                    : 'hover:scale-110 hover:shadow-sm opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.label}${isSelected ? ' (Selected - Click to clear)' : ''}`}
                aria-label={`Filter by colour: ${color.label}`}
              >
                {isSelected && (
                  <Check className={`w-4 h-4 stroke-[2.5] ${color.checkColor}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtext copy matching the reference image */}
        <p className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          Select a colour or click any clothing swatch to view all styles in that shade.
        </p>
      </div>

      {/* Applied Filters Summary Footer */}
      {hasActiveFilters && (
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {typeof totalFilteredCount === 'number'
              ? `${totalFilteredCount} matching item${totalFilteredCount === 1 ? '' : 's'}`
              : 'Filtered results'}
          </span>
          <button
            onClick={onClearFilters}
            className="text-[#CE1126] font-bold hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
