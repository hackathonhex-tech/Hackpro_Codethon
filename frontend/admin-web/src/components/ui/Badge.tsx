import React from 'react';

type Color = 'blue' | 'primary' | 'neon' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  className?: string;
  dot?: boolean;
}

const colorMap: Record<Color, string> = {
  primary: 'bg-[#EEF2FF] text-[#3760F8] border border-[#C7D2FE]',
  blue: 'bg-[#EEF2FF] text-[#3760F8] border border-[#C7D2FE]',
  neon: 'bg-slate-100 text-slate-800 border border-slate-200 font-semibold',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-rose-50 text-rose-700 border border-rose-200',
  gray: 'bg-slate-100 text-slate-700 border border-slate-200',
  purple: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  orange: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const dotColorMap: Record<Color, string> = {
  primary: 'bg-[#3760F8]',
  blue: 'bg-[#3760F8]',
  neon: 'bg-slate-600',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
  gray: 'bg-slate-500',
  purple: 'bg-indigo-500',
  orange: 'bg-amber-500',
};

export function Badge({ children, color = 'gray', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-tight ${colorMap[color]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[color]}`} />}
      {children}
    </span>
  );
}
