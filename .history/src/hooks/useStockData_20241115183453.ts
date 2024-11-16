import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3000/api';

interface StockPrice {
  CompanyTicker: string;
  adjustedClose: number;
  volume: number;
  date: string;
}

interface VolumeAnalysisData {
  CompanyTicker: string;
  volume: number;
  avg_volume: number;
  vwap: number;
}

interface TechnicalIndicatorData {
  CompanyTicker: string;
  current_price: number;
  price_change_20d: number;
  sma20: number;
  avg_volume: number;
}

interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

// Generic fetch function to handle API calls
const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${await response.text()}`);
  }
  return response.json();
};

// Constants for refetch intervals
const REFRESH_INTERVALS = {
  PRICE: 60000,    // 1 minute
  VOLUME: 60000,   // 1 minute
  TECHNICAL: 60000, // 1 minute
  CORRELATION: 300000 // 5 minutes
} as const;

export const useLatestPrices = () => {
  return useQuery<StockPrice[], Error>({
    queryKey: ['latestPrices'],
    queryFn: () => fetchData(`${API_BASE_URL}/prices/latest`),
    refetchInterval: REFRESH_INTERVALS.PRICE,
    retry: 3,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

export const useVolumeAnalysis = (ticker: string) => {
  return useQuery<VolumeAnalysisData, Error>({
    queryKey: ['volumeAnalysis', ticker],
    queryFn: () => fetchData(`${API_BASE_URL}/analysis/volume/${ticker}`),
    enabled: Boolean(ticker),
    refetchInterval: REFRESH_INTERVALS.VOLUME,
    retry: 3,
    staleTime: 30000,
  });
};

export const useTechnicalIndicators = (ticker: string) => {
  return useQuery<TechnicalIndicatorData, Error>({
    queryKey: ['technicalIndicators', ticker],
    queryFn: () => fetchData(`${API_BASE_URL}/analysis/technical/${ticker}`),
    enabled: Boolean(ticker),
    refetchInterval: REFRESH_INTERVALS.TECHNICAL,
    retry: 3,
    staleTime: 30000,
  });
};

export const useCorrelations = (tickers: string[]) => {
  return useQuery<CorrelationData[], Error>({
    queryKey: ['correlations', tickers],
    queryFn: async () => {
      if (!tickers.length) return [];
      return fetchData(
        `${API_BASE_URL}/analysis/correlations?tickers=${tickers.join(',')}`
      );
    },
    enabled: tickers.length > 0,
    refetchInterval: REFRESH_INTERVALS.CORRELATION,
    retry: 3,
    staleTime: 150000, // Consider correlation data stale after 2.5 minutes
  });
};

// Optional: Add environment variable check
if (process.env.NODE_ENV === 'development') {
  console.assert(API_BASE_URL, 'API_BASE_URL is not defined');
}