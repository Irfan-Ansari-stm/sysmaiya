'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token && isAuthenticated) {
      fetchMe().finally(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401 || error?.response?.status === 403) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
