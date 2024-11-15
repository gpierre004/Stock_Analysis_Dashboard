export interface StockPrice {
  id: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
  companyTicker: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  rsi: number;
  volumeSMA: number;
  priceChange: number;
  volatility: number;
}

export interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
}