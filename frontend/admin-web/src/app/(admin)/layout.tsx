'use client';
import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { adminAuthApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { useNavigation } from '@/components/ui/NavigationLoader';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Network,
  ClipboardCheck,
  SendHorizontal,
  UserCog,
  ShieldCheck,
  ScrollText,
  LogOut,
  Code2,
  Eye,
  UserCheck,
  Mail,
  Award,
  BarChart3,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permission?: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { href: '/contests', label: 'Contests', icon: Trophy, permission: 'contests.view' },
  { href: '/attendance', label: 'Attendance', icon: UserCheck, permission: 'attendance.view' },
  { href: '/invitations', label: 'Invitations', icon: Mail, permission: 'contests.view' },
  { href: '/participants', label: 'Participants', icon: Users, permission: 'participants.view' },
  { href: '/teams', label: 'Teams', icon: Network, permission: 'team_access.view' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Award, permission: 'leaderboard.view' },
  { href: '/submissions', label: 'Submissions', icon: SendHorizontal, permission: 'submissions.view' },
  { href: '/rubrics', label: 'Rubrics', icon: ClipboardCheck, permission: 'rubrics.view' },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3, permission: 'reports.view' },
  { href: '/users', label: 'Staff Users', icon: UserCog, superAdminOnly: true },
  { href: '/roles', label: 'Access Roles', icon: ShieldCheck, superAdminOnly: true },
];

const ROUTE_RULES: { prefix: string; permission?: string; superAdminOnly?: boolean }[] = [
  { prefix: '/users', superAdminOnly: true },
  { prefix: '/roles', superAdminOnly: true },
  { prefix: '/contests', permission: 'contests.view' },
  { prefix: '/assignments', permission: 'team_access.view' },
  { prefix: '/attendance', permission: 'attendance.view' },
  { prefix: '/invitations', permission: 'contests.view' },
  { prefix: '/participants', permission: 'participants.view' },
  { prefix: '/teams', permission: 'team_access.view' },
  { prefix: '/leaderboard', permission: 'leaderboard.view' },
  { prefix: '/submissions', permission: 'submissions.view' },
  { prefix: '/rubrics', permission: 'rubrics.view' },
  { prefix: '/reports', permission: 'reports.view' },
  { prefix: '/dashboard', permission: 'dashboard.view' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, clearAuth, isSuperAdmin, initAuth } = useAdminAuthStore();
  const { startNavigation } = useNavigation();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      startNavigation('Redirecting to login...');
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router, startNavigation]);

  const logoutMutation = useMutation({
    mutationFn: () => {
      startNavigation('Signing out...');
      return adminAuthApi.logout();
    },
    onSettled: () => {
      clearAuth();
      router.push('/login');
    },
  });

  const superAdmin = isSuperAdmin();
  const isAdmin = user?.role === 'admin';

  // Strict role-based navigation filtering
  const visibleNavItems = useMemo(() => {
    if (superAdmin) return NAV_ITEMS;
    if (isAdmin) return NAV_ITEMS.filter((item) => !item.superAdminOnly);

    // Sub-roles (e.g. Proctor Monitor, Question Setter, Evaluator)
    const userPermissions = (user?.permissions as string[]) || [];
    return NAV_ITEMS.filter((item) => {
      if (item.superAdminOnly) return false;
      if (!item.permission) return true;
      return userPermissions.includes(item.permission);
    });
  }, [superAdmin, isAdmin, user]);

  // Route authorization check
  const isRouteAuthorized = useMemo(() => {
    if (superAdmin) return true;

    const matchedRule = ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix));
    if (!matchedRule) return true; // Allowed by default if no restrictive rule exists

    if (matchedRule.superAdminOnly) return false;
    if (isAdmin) return true;

    if (matchedRule.permission) {
      const userPermissions = (user?.permissions as string[]) || [];
      return userPermissions.includes(matchedRule.permission);
    }
    return true;
  }, [superAdmin, isAdmin, user, pathname]);

  // Auto-redirect from /dashboard if the sub-role does not have dashboard.view
  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === '/dashboard') {
      const canViewDashboard = superAdmin || isAdmin || (user?.permissions as string[] || []).includes('dashboard.view');
      if (!canViewDashboard && visibleNavItems.length > 0) {
        router.replace(visibleNavItems[0].href);
      }
    }
  }, [isLoading, isAuthenticated, pathname, superAdmin, isAdmin, user, visibleNavItems, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 shadow-xs print:hidden">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HACKPRO" className="h-9 w-auto max-w-[120px] object-contain rounded" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">HACKPRO</span>
                <span className="w-2 h-2 rounded-full bg-[#3760F8]" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Admin Console
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#3760F8] font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#3760F8]' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3760F8]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#3760F8] flex items-center justify-center text-white font-semibold text-xs shadow-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">{user?.name || 'Administrator'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#3760F8]/10 text-[#3760F8] border border-[#3760F8]/20 truncate">
                  {user?.roleName || (user?.isSuperAdmin ? 'Super Admin' : (user?.role === 'admin' ? 'Admin' : 'Staff'))}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || 'admin@hackpro.dev'}</p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 print:bg-white print:overflow-visible">
        {!isRouteAuthorized ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
              Access Restricted
            </h2>
            <p className="text-sm text-slate-500 max-w-md text-center mb-6">
              Your assigned role <span className="font-semibold text-slate-700">({user?.roleName || user?.role || 'Staff'})</span> does not have authorization to view this section ({pathname}).
            </p>
            {visibleNavItems.length > 0 && (
              <Link
                href={visibleNavItems[0].href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3760F8] hover:bg-[#284cd1] text-white font-medium text-sm transition-all shadow-sm shadow-[#3760F8]/20"
              >
                <span>Go to {visibleNavItems[0].label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
