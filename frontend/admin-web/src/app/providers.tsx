'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { adminAuthApi } from '@/lib/api';
import { NavigationProvider } from '@/components/ui/NavigationLoader';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AdminAuthBootstrap() {
  const { setAuth, clearAuth, setLoading } = useAdminAuthStore();

  useEffect(() => {
    setLoading(true);
    adminAuthApi
      .me()
      .then((user) => {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_access_token') || '' : '';
        setAuth(user, token);
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <AdminAuthBootstrap />
        {children}
      </NavigationProvider>
    </QueryClientProvider>
  );
}
