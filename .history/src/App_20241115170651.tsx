import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PriceChart } from './components/PriceChart';
import { VolumeAnalysis } from './components/VolumeAnalysis';
import { TechnicalSignals } from './components/TechnicalSignals';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { BarChart } from 'lucide-react';
//import { GanttChartSquare } from 'lucide-react/dist/esm/icons/gantt-chart-square';
import { useLatestPrices, useVolumeAnalysis, useTechnicalIndicators, useCorrelations } from './hooks/useStockData';

const queryClient = new QueryClient();

function Dashboard() {
  const { data: latestPrices, isLoading: pricesLoading, error: pricesError } = useLatestPrices();
  const tickers = latestPrices?.map(price => price.ticker) || [];
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
        <div className="text-gray-600">Loading...</div>
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
            <StockCard key={price.ticker} ticker={price.ticker} />
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

function StockCard({ ticker }: { ticker: string }) {
  const { data: volumeData } = useVolumeAnalysis(ticker);
  const { data: technicalData } = useTechnicalIndicators(ticker);

  if (!volumeData || !technicalData) return null;

  const { volume, avg_volume: avgVolume, vwap } = volumeData;
  const { current_price: price, price_change_20d: change, sma20 } = technicalData;

  return (
    <>
      <PriceChart
        ticker={ticker}
        data={{ price, change, sma20, volume }}
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
    </>
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