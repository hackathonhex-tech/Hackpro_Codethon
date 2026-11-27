'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@codeathon/shared';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigation } from '@/components/ui/NavigationLoader';
import { Eye, EyeOff, Loader2, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

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
        const adminBaseUrl =
          process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ??
          (typeof window !== 'undefined' && window.location.hostname.includes('hackpro.in')
            ? 'https://admin.hackpro.in'
            : 'http://localhost:3001');
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
        (err?.message?.includes('Network Error')
          ? 'Network or server connection error. Please try again.'
          : 'Invalid credentials. Please verify your email / Employee ID and password.');
      setServerError(msg);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex justify-center">
            <img src="/logo.png" alt="HACKPRO" className="h-12 w-auto object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Candidate Login</h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Enter your registered email / Employee ID and batch access key to begin your test.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-200">
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
                className={`w-full pl-10 pr-4 h-11 sm:h-12 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 transition-all ${
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
                className={`w-full pl-10 pr-11 h-11 sm:h-12 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 transition-all ${
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
            className="w-full mt-2 h-11 sm:h-12 px-4 rounded-xl bg-gradient-to-r from-[#3760F8] to-[#254EDB] hover:from-[#2B54E8] hover:to-[#1E43CA] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entering Test Arena...</span>
              </>
            ) : (
              <>
                <span>Attend Test</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
