import React from 'react';
import { GanttChartSquare } from 'lucide-react';
import StockCard from './StockCard';
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { CorrelationMatrix } from './CorrelationMatrix';
import { useLatestPrices, useCorrelations } from '../hooks/useStockData';
import { Link } from 'react-router-dom'; // Import Link for navigation

export const Dashboard = () => {
  const { 
    data: latestPrices, 
    isLoading: pricesLoading, 
    error: pricesError,
    isError: isPricesError
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
      const response = await fetch('http://localhost:3000/api/stock-prices', {
        method: 'GET', // Assuming the endpoint is a GET request
      });
      if (!response.ok) {
        throw new Error('Failed to update stock prices');
      }
      const result = await response.text();
      alert(result); // Show success message
    } catch (error) {
      console.error('Error updating stock prices:', error);
      alert('Error updating stock prices');
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
        <LoadingCard message={''} />
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
          <button 
            onClick={handleUpdatePrices} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Stock Prices
          </button>
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