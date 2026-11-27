'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
    if (token || isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3760F8] border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Entering HACKPRO…</p>
      </div>
    </div>
  );
}
