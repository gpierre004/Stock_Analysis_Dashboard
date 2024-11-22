import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PriceChart } from './components/PriceChart';
import { VolumeAnalysis } from './components/VolumeAnalysis';
import { TechnicalSignals } from './components/TechnicalSignals';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { GanttChartSquare, AlertCircle } from 'lucide-react';
import { useLatestPrices, useVolumeAnalysis, useTechnicalIndicators, useCorrelations } from './hooks/useStockData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: true,
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
  },
});

interface StockCardProps {
  ticker: string;
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message, ticker }: { message: string; ticker?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <div>{message || `Error loading data${ticker ? ` for ${ticker}` : ''}`}</div>
      </div>
    </div>
  );
}

function StockCard({ ticker }: StockCardProps) {
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

function Dashboard() {
  const { 
    data: latestPrices, 
    isLoading: pricesLoading, 
    error: pricesError,
    isError: isPricesError
  } = useLatestPrices();

  const tickers = React.useMemo(() => 
    latestPrices?.map(price => price.ticker) || [], 
    [latestPrices]
  );

  const { 
    data: correlations, 
    isLoading: correlationsLoading 
  } = useCorrelations(tickers);

  if (isPricesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorCard 
          message={pricesError instanceof Error ? pricesError.message : 'Error loading price data'} 
        />
      </div>
    );
  }

  if (pricesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard />
      </div>
    );
  }

  if (!latestPrices?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorCard message="No stock data available" />
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
          {latestPrices.map((price) => (
            <StockCard key={price.ticker} ticker={price.ticker} />
          ))}
        </div>

        {!correlationsLoading && correlations && correlations.length > 0 && (
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