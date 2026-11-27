'use client';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#3760F8] text-white hover:bg-[#254EDB] active:bg-[#1D40B8] shadow-sm hover:shadow-[0_4px_14px_rgba(55,96,248,0.3)] focus:ring-[#3760F8]/40 border border-transparent',
  secondary:
    'bg-[#D3FE4F] text-[#0B0F19] hover:bg-[#C2F038] active:bg-[#A4D817] font-semibold shadow-sm hover:shadow-[0_4px_14px_rgba(211,254,79,0.4)] focus:ring-[#D3FE4F]/50 border border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus:ring-rose-500/40 border border-transparent',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100/80 active:bg-slate-200 focus:ring-slate-400/40 border border-transparent',
  outline:
    'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs focus:ring-[#3760F8]/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
  md: 'px-4 py-2 text-sm rounded-xl min-h-[44px]',
  lg: 'px-6 py-2.5 text-base rounded-xl min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
    </button>
  );
}
