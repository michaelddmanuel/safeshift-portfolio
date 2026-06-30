import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client. Conservative defaults: short stale window so data
 * feels live, no refetch storms on window focus, and a single retry.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
