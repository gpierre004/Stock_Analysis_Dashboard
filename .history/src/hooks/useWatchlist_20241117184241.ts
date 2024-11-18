import { useQuery } from '@tanstack/react-query';

export const useWatchlist = () => {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/watchlist');
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      return response.json();
    }
  });
};
