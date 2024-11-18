import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:5000/api';

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
  price_change_20d: number | null;
  sma20: number;
  avg_volume: number;
}

interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

//Portfolio-related
interface PortfolioStock {
  ticker: string;
  total_invested: number;
  market_value: number;
  total_profit_loss: number;
  current_quantity : number;
  roi_percentage : number;
}

// Error handling with specific error types
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic fetch function with improved error handling
const fetchData = async <T>(url: string): Promise<T> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(response.status, errorText);
    }
    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

// Constants for refetch intervals
const REFRESH_INTERVALS = {
  PRICE: 60000,    // 1 minute
  VOLUME: 60000,   // 1 minute
  TECHNICAL: 60000, // 1 minute
  CORRELATION: 300000 // 5 minutes
} as const;

export const useLatestPrices = () => {
  return useQuery<StockPrice[], APIError>({
    queryKey: ['latestPrices'],
    queryFn: () => fetchData(`${API_BASE_URL}/prices/latest`),
    refetchInterval: REFRESH_INTERVALS.PRICE,
    retry: 3,
    staleTime: 30000,
    select: (data) => data.map(price => ({
      ...price,
      adjustedClose: Number(price.adjustedClose),
      volume: Number(price.volume)
    }))
  });
};

export const useVolumeAnalysis = (ticker: string) => {
  return useQuery<VolumeAnalysisData, APIError>({
    queryKey: ['volumeAnalysis', ticker],
    queryFn: () => fetchData(`${API_BASE_URL}/analysis/volume/${ticker}`),
    enabled: Boolean(ticker),
    refetchInterval: REFRESH_INTERVALS.VOLUME,
    retry: 3,
    staleTime: 30000,
    select: (data) => ({
      ...data,
      volume: Number(data.volume),
      avg_volume: Number(data.avg_volume),
      vwap: Number(data.vwap)
    })
  });
};

export const useTechnicalIndicators = (ticker: string) => {
  return useQuery<TechnicalIndicatorData, APIError>({
    queryKey: ['technicalIndicators', ticker],
    queryFn: () => fetchData(`${API_BASE_URL}/analysis/technical/${ticker}`),
    enabled: Boolean(ticker),
    refetchInterval: REFRESH_INTERVALS.TECHNICAL,
    retry: 3,
    staleTime: 30000,
    select: (data) => ({
      ...data,
      current_price: Number(data.current_price),
      price_change_20d: data.price_change_20d !== null ? Number(data.price_change_20d) : null,
      sma20: Number(data.sma20),
      avg_volume: Number(data.avg_volume)
    })
  });
};

export const useCorrelations = (tickers: string[]) => {
  return useQuery<CorrelationData[], APIError>({
    queryKey: ['correlations', tickers],
    queryFn: async () => {
      if (!tickers.length) return [];
      return fetchData(`${API_BASE_URL}/analysis/correlations?tickers=${tickers.join(',')}`);
    },
    enabled: tickers.length > 0,
    refetchInterval: REFRESH_INTERVALS.CORRELATION,
    retry: 3,
    staleTime: 150000,
    select: (data) => data.map(correlation => ({
      ...correlation,
      correlation: Number(correlation.correlation)
    }))
  });
};

// Porfolio related
export const usePortfolioData = () => {
  return useQuery<PortfolioStock[], Error>({
    queryKey: ['portfolioData'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/portfolio`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const data = await response.json();
      console.log('Portfolio Data:', data); // Log the data
      return data;
    },
    staleTime: 30000,
  });
};