import React from 'react';
import { PriceChart } from './PriceChart';
import { VolumeAnalysis } from './VolumeAnalysis';
import { TechnicalSignals } from './TechnicalSignals';
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { useVolumeAnalysis, useTechnicalIndicators } from '../hooks/useStockData';

interface StockCardProps {
  ticker: string;
}

interface VolumeData {
  volume: number | null;
  avg_volume: number | null;
  vwap: number | null;
}

interface TechnicalData {
  current_price: number | null;
  price_change_20d: number | null;
  sma20: number | null;
}

export const StockCard = ({ ticker }: StockCardProps) => {
  const { 
    data: volumeData, 
    isLoading: volumeLoading, 
    error: volumeError,
    isError: isVolumeError
  } = useVolumeAnalysis(ticker);
  
  const { 
    data: technicalData, 
    isLoading: technicalLoading, 
    error: technicalError,
    isError: isTechnicalError
  } = useTechnicalIndicators(ticker);

  if (volumeLoading || technicalLoading) {
    return <LoadingCard />;
  }

  if (isVolumeError || isTechnicalError) {
    const error = volumeError || technicalError;
    return <ErrorCard message={error instanceof Error ? error.message : 'Unknown error'} ticker={ticker} />;
  }

  if (!volumeData || !technicalData) {
    return <ErrorCard message="No data available" ticker={ticker} />;
  }

  const { volume, avg_volume: avgVolume, vwap } = volumeData as VolumeData;
  const { current_price: price, price_change_20d: change, sma20 } = technicalData as TechnicalData;

  // Calculate support and resistance only if price is available
  const support = price !== null ? price * 0.95 : null;
  const resistance = price !== null ? price * 1.05 : null;

  // Determine trend based on price change
  const getTrend = (change: number | null): 'bullish' | 'bearish' | 'neutral' => {
    if (change === null) return 'neutral';
    return change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <PriceChart
        ticker={ticker}
        data={{
          price,
          change,
          sma20,
          volume
        }}
      />
      <VolumeAnalysis
        ticker={ticker}
        volume={volume}
        avgVolume={avgVolume}
        vwap={vwap}
      />
      <TechnicalSignals
        ticker={ticker}
        support={support}
        resistance={resistance}
        rsi={50} // This could be made nullable if RSI data is not always available
        trend={getTrend(change)}
      />
    </div>
  );
};

export default StockCard;
