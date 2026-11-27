'use client';

import React from 'react';

export interface PillTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface PillTabsProps<T extends string = string> {
  items: PillTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function PillTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  size = 'sm',
  className = '',
}: PillTabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100/80 rounded-xl gap-1 border border-slate-200/60 overflow-x-auto scrollbar-none ${className}`}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`
              flex items-center gap-1.5 rounded-lg font-bold transition-all whitespace-nowrap
              ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'}
              ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }
            `}
          >
            {item.icon && (
              <span className={isActive ? 'text-[#3760F8]' : 'text-slate-400'}>
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#3760F8] font-bold'
                    : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
