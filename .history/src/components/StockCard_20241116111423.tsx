import React from 'react';
import { PriceChart } from './PriceChart';
import { VolumeAnalysis } from './VolumeAnalysis';
import { TechnicalSignals } from './TechnicalSignals';
import { LoadingCard } from './common/LoadingCard';
import { ErrorCard } from './common/ErrorCard';
import { useVolumeAnalysis, useTechnicalIndicators } from '../hooks/useStockData';

interface StockCardProps {
  ticker: string;
}

export function StockCard({ ticker }: StockCardProps) {
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

  const { volume, avg_volume: avgVolume, vwap } = volumeData;
  const { current_price: price, price_change_20d: change, sma20 } = technicalData;

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
        support={price * 0.95}
        resistance={price * 1.05}
        rsi={50}
        trend={change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral'}
      />
    </div>
  );
}