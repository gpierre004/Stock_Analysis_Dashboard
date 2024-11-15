import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export function useLatestPrices() {
  return useQuery({
    queryKey: ['latestPrices'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/prices/latest`);
      return data;
    },
    refetchInterval: 60000,
  });
}

export function useVolumeAnalysis(ticker: string) {
  return useQuery({
    queryKey: ['volumeAnalysis', ticker],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/analysis/volume/${ticker}`);
      return data;
    },
    refetchInterval: 60000,
  });
}

export function useTechnicalIndicators(ticker: string) {
  return useQuery({
    queryKey: ['technicalIndicators', ticker],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/analysis/technical/${ticker}`);
      return data;
    },
    refetchInterval: 60000,
  });
}

export function useCorrelations(tickers: string[]) {
  return useQuery({
    queryKey: ['correlations', tickers],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/analysis/correlations`, {
        params: { tickers: tickers.join(',') },
      });
      return data;
    },
    refetchInterval: 300000,
  });
}