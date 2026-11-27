'use client';

import React from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      style={style}
    />
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="w-24 h-7" />
          <Skeleton className="w-32 h-3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="px-6 py-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }, (_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? 'w-36' : c === cols - 1 ? 'w-20' : 'w-28'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContestCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="flex gap-2">
              <Skeleton className="w-20 h-5 rounded-full" />
              <Skeleton className="w-24 h-5 rounded-full" />
            </div>
            <Skeleton className="w-56 h-5" />
            <Skeleton className="w-full max-w-md h-3" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-28 h-4" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Skeleton className="w-24 h-9 rounded-xl" />
            <Skeleton className="w-20 h-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
