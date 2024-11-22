import React from 'react';
import { GanttChartSquare } from 'lucide-react';
import StockCard from './StockCard';
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { CorrelationMatrix } from './CorrelationMatrix';
import { useLatestPrices, useCorrelations } from '../hooks/useStockData';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
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
};

export default Dashboard;