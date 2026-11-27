import React from 'react';

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size];
  return (
    <svg className={`animate-spin text-[#3760F8] ${s} ${className}`} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.15" />
      <path d="M 18 4 A 14 14 0 0 1 32 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingOverlay({ message = '' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 backdrop-blur-[1px]">
      <div className="relative flex items-center justify-center p-3">
        <div className="absolute w-12 h-12 rounded-full bg-blue-500/10 blur-sm pointer-events-none" />
        <Spinner size="md" />
      </div>
    </div>
  );
}
