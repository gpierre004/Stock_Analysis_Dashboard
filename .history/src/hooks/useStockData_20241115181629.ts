// src/hooks/useStockData.ts
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

export const useLatestPrices = () => {
  return useQuery<StockPrice[]>({
    queryKey: ['latestPrices'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/prices/latest`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useVolumeAnalysis = (ticker: string) => {
  return useQuery<VolumeAnalysisData>({
    queryKey: ['volumeAnalysis', ticker],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/analysis/volume/${ticker}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!ticker,
    refetchInterval: 60000,
  });
};

export const useTechnicalIndicators = (ticker: string) => {
  return useQuery<TechnicalIndicatorData>({
    queryKey: ['technicalIndicators', ticker],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/analysis/technical/${ticker}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: !!ticker,
    refetchInterval: 60000,
  });
};

export const useCorrelations = (tickers: string[]) => {
  return useQuery<CorrelationData[]>({
    queryKey: ['correlations', tickers],
    queryFn: async () => {
      if (!tickers.length) return [];
      const response = await fetch(
        `${API_BASE_URL}/analysis/correlations?tickers=${tickers.join(',')}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled: tickers.length > 0,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

