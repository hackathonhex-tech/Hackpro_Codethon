'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@codeathon/shared';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigation } from '@/components/ui/NavigationLoader';
import { Eye, EyeOff, Loader2, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { startNavigation } = useNavigation();

  // Auto-redirect if token is passed via URL (cross-portal seamless transition)
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
          startNavigation('Loading dashboard...');
          router.replace(redirect);
        } catch (e) {
          // fallback if parsing fails
        }
      }
    }
  }, [setAuth, router, startNavigation]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError('');
    try {
      const result = await authApi.login(data.identifier, data.password);
      
      // Role-based portal navigation
      if (result.targetPortal === 'admin' || (result.user.role !== 'student' && result.user.role !== 'candidate')) {
        startNavigation('Redirecting to Admin Portal...');
        const redirect = result.redirectPath || '/dashboard';
        const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ?? 'http://localhost:3001';
        const adminUrl = `${adminBaseUrl}/login?autoToken=${encodeURIComponent(result.accessToken)}&userData=${encodeURIComponent(JSON.stringify(result.user))}&redirect=${encodeURIComponent(redirect)}`;
        window.location.href = adminUrl;
        return;
      }

      startNavigation('Entering Test Arena...');
      setAuth(result.user, result.accessToken);
      router.replace(result.redirectPath || '/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Invalid credentials. Please verify your email / Employee ID and password.';
      setServerError(msg);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidate Login</h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter your registered email / Employee ID and batch code to attend your test
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700">
              Registered Email or Employee ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="employee@company.com or EMP2026001"
                {...register('identifier')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 transition-all ${
                  errors.identifier ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white focus:border-[#3760F8]'
                }`}
              />
            </div>
            {errors.identifier && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password / Batch Code Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
              Batch Code / Access Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="e.g. BATCH2026"
                {...register('password')}
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 transition-all ${
                  errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white focus:border-[#3760F8]'
                }`}
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
            {errors.password && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
            )}
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
                <span>Entering Test Arena...</span>
              </>
            ) : (
              <span>Attend Test</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
