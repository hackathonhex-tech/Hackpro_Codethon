'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { NavigationProvider } from '@/components/ui/NavigationLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const user = await authApi.me();
        const token = sessionStorage.getItem('access_token') ?? '';
        setAuth(user, token);
      } catch {
        clearAuth();
      }
    };
    bootstrap();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient);
  return (
    <QueryClientProvider client={client}>
      <NavigationProvider>
        <AuthBootstrap>{children}</AuthBootstrap>
      </NavigationProvider>
    </QueryClientProvider>
  );
}
