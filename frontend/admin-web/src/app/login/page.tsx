'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthApi } from '@/lib/api';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useNavigation } from '@/components/ui/NavigationLoader';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for auto-redirect via URL (cross-portal seamless transition)
  const { startNavigation } = useNavigation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const autoToken = params.get('autoToken') || params.get('token');
      const userData = params.get('userData');
      const redirect = params.get('redirect') || '/dashboard';
      if (autoToken && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          setAuth(user, autoToken);
          startNavigation('Opening admin dashboard...');
          router.replace(redirect);
        } catch (e) {
          // ignore parsing error
        }
      }
    }
  }, [setAuth, router, startNavigation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await adminAuthApi.login(identifier, password);

      // If this account is a student/candidate, seamlessly route to Candidate Portal
      if (result.targetPortal === 'student' || result.user.role === 'student' || result.user.role === 'candidate') {
        startNavigation('Redirecting to Candidate Portal...');
        const redirect = result.redirectPath || '/dashboard';
        const studentBaseUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ?? 'http://localhost:3000';
        const studentUrl = `${studentBaseUrl}/login?autoToken=${encodeURIComponent(result.accessToken)}&userData=${encodeURIComponent(JSON.stringify(result.user))}&redirect=${encodeURIComponent(redirect)}`;
        window.location.href = studentUrl;
        return;
      }

      // Role-based destination routing
      startNavigation('Opening admin dashboard...');
      setAuth(result.user, result.accessToken);
      const destination = result.redirectPath || '/dashboard';
      router.replace(destination);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Invalid credentials. Please verify your email and password.';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 sm:p-10 space-y-7 relative z-10">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img src="/logo.png" alt="HACKPRO" className="h-10 w-auto object-contain" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter your credentials to access your account
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Enter email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3760F8] focus:ring-2 focus:ring-[#3760F8]/20 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3760F8] focus:ring-2 focus:ring-[#3760F8]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#3760F8] hover:bg-[#284fd9] text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
