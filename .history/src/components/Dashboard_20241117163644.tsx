import React, { useState } from 'react';
import { GanttChartSquare } from 'lucide-react';
import StockCard from './StockCard';
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { CorrelationMatrix } from './CorrelationMatrix';
import { useLatestPrices, useCorrelations } from '../hooks/useStockData';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const { 
    data: latestPrices, 
    isLoading: pricesLoading, 
    error: pricesError,
    isError: isPricesError,
    refetch: refetchPrices
  } = useLatestPrices();

  const tickers = React.useMemo(() => 
    latestPrices?.map(price => price.CompanyTicker) || [], 
    [latestPrices]
  );

  const { 
    data: correlations, 
    isLoading: correlationsLoading 
  } = useCorrelations(tickers);

  const handleUpdatePrices = async () => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      console.log('Starting price update...');
      const response = await fetch('http://localhost:3000/api/stock-prices/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update stock prices: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update response:', result);
      
      if (result.success) {
        alert(result.message);
        // Refresh the price data after successful update
        await refetchPrices();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating stock prices:', error);
      setUpdateError(error instanceof Error ? error.message : 'Error updating stock prices');
      alert(error instanceof Error ? error.message : 'Error updating stock prices');
    } finally {
      setIsUpdating(false);
    }
  };

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
        <LoadingCard message="Loading price data..." />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GanttChartSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Stock Analysis Dashboard</h1>
            </div>
            <nav>
              <Link to="/portfolio" className="text-blue-600 hover:underline">
                Portfolio
              </Link>
            </nav>
          </div>
          <div className="mt-4 space-y-2">
            <button 
              onClick={handleUpdatePrices} 
              disabled={isUpdating}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200`}
            >
              {isUpdating ? 'Updating Prices...' : 'Update Stock Prices'}
            </button>
            {updateError && (
              <div className="text-red-600 text-sm">{updateError}</div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPrices.map((price) => (
            <StockCard key={price.CompanyTicker} ticker={price.CompanyTicker} />
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