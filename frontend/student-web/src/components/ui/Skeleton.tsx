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

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Header Placeholder */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-28 h-8 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <div className="rounded-3xl bg-slate-900/90 p-8 space-y-4 shadow-sm relative overflow-hidden">
        <div className="space-y-2 max-w-md">
          <Skeleton className="w-24 h-4 bg-slate-800" />
          <Skeleton className="w-64 h-8 bg-slate-800" />
          <Skeleton className="w-96 h-4 bg-slate-800" />
        </div>
        <div className="pt-2 flex items-center gap-3">
          <Skeleton className="w-36 h-10 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Assessment Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-40 h-8 rounded-xl" />
          </div>

          <div className="flex gap-2 pb-2">
            <Skeleton className="w-20 h-7 rounded-lg" />
            <Skeleton className="w-20 h-7 rounded-lg" />
            <Skeleton className="w-24 h-7 rounded-lg" />
          </div>

          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="w-16 h-5 rounded-full" />
                    <Skeleton className="w-20 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="w-56 h-5" />
                  <Skeleton className="w-full max-w-sm h-3" />
                </div>
                <div className="flex gap-4 pt-1">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-20 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Candidate Profile Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-16 h-4 rounded-full" />
            </div>
            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-1.5 w-full flex flex-col items-center">
                <Skeleton className="w-36 h-5" />
                <Skeleton className="w-48 h-3" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2">
              <Skeleton className="w-full h-8 rounded-xl" />
              <Skeleton className="w-full h-8 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContestEntrySkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6 text-center">
          <div className="flex justify-center">
            <Skeleton className="w-16 h-16 rounded-2xl" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="w-72 h-7" />
            <Skeleton className="w-96 h-4" />
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1 flex flex-col items-center">
              <Skeleton className="w-16 h-3" />
              <Skeleton className="w-12 h-5" />
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Skeleton className="w-16 h-3" />
              <Skeleton className="w-12 h-5" />
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Skeleton className="w-16 h-3" />
              <Skeleton className="w-12 h-5" />
            </div>
          </div>

          <div className="space-y-2 text-left p-4 rounded-2xl border border-slate-200">
            <Skeleton className="w-32 h-4 mb-2" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-3/4 h-3" />
          </div>

          <div className="flex justify-center pt-2">
            <Skeleton className="w-48 h-12 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttemptSkeleton() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D1117] font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-[#161B22] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="w-24 h-6 bg-slate-800" />
          <Skeleton className="w-40 h-4 bg-slate-800" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-28 h-8 rounded-full bg-slate-800" />
          <Skeleton className="w-20 h-8 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Question Pane */}
        <div className="w-full lg:w-1/2 h-full bg-white border-r border-slate-200 p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-16 h-5 rounded-md" />
          </div>
          <Skeleton className="w-64 h-6" />
          <div className="space-y-2 pt-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
          <div className="pt-4 space-y-3">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-full h-20 rounded-xl" />
          </div>
        </div>

        {/* Right Editor Pane */}
        <div className="hidden lg:flex flex-1 flex-col bg-[#0D1117] overflow-hidden">
          <div className="h-10 bg-[#161B22] border-b border-slate-800 px-4 flex items-center justify-between">
            <Skeleton className="w-32 h-5 bg-slate-800" />
            <Skeleton className="w-28 h-6 rounded-md bg-slate-800" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            <Skeleton className="w-48 h-4 bg-slate-800/80" />
            <Skeleton className="w-64 h-4 bg-slate-800/80" />
            <Skeleton className="w-80 h-4 bg-slate-800/80" />
            <Skeleton className="w-56 h-4 bg-slate-800/80" />
          </div>
          <div className="h-12 bg-[#161B22] border-t border-slate-800 px-4 flex items-center justify-between">
            <Skeleton className="w-24 h-4 bg-slate-800" />
            <div className="flex gap-2">
              <Skeleton className="w-20 h-7 rounded-lg bg-slate-800" />
              <Skeleton className="w-20 h-7 rounded-lg bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6 text-center">
          <div className="flex justify-center">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="w-64 h-7" />
            <Skeleton className="w-48 h-4" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5 flex flex-col items-center">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-12 h-6" />
              </div>
            ))}
          </div>
          <div className="flex justify-center pt-2">
            <Skeleton className="w-40 h-10 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
