import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PriceChart } from './components/PriceChart';
import { VolumeAnalysis } from './components/VolumeAnalysis';
import { TechnicalSignals } from './components/TechnicalSignals';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { GanttChartSquare } from 'lucide-react';
import { useLatestPrices, useVolumeAnalysis, useTechnicalIndicators, useCorrelations } from './hooks/useStockData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
    },
  },
});

interface StockCardProps {
  ticker: string;
}

function StockCard({ ticker }: StockCardProps) {
  const { data: volumeData, isLoading: volumeLoading, error: volumeError } = useVolumeAnalysis(ticker);
  //const { data: technicalData, isLoading: technicalLoading, error: technicalError } = useTechnicalIndicators(ticker);

  if (volumeLoading || technicalLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse flex space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (volumeError || technicalError) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-600">Error loading data for {ticker}</div>
      </div>
    );
  }
/*
  if (!volumeData || !technicalData) return null;

  const { volume, avg_volume: avgVolume, vwap } = volumeData;
  const { current_price: price, price_change_20d: change, sma20 } = technicalData;

  return (
    <div className="space-y-6">
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
        rsi={50} // Note: Add RSI calculation to backend if needed
        trend={change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral'}
      />
    </div>
  );
}
*/
function Dashboard() {
  const { data: latestPrices, isLoading: pricesLoading, error: pricesError } = useLatestPrices();
  const tickers = latestPrices?.map(price => price.CompanyTicker) || [];
  const { data: correlations, isLoading: correlationsLoading } = useCorrelations(tickers);

  if (pricesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error loading data. Please try again later.</div>
      </div>
    );
  }

  if (pricesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GanttChartSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Stock Analysis Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPrices?.map((price) => (
            <StockCard key={price.CompanyTicker} ticker={price.CompanyTicker} />
          ))}
        </div>

        {!correlationsLoading && correlations && (
          <div className="mt-6">
            <CorrelationMatrix correlations={correlations} />
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;