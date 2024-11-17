// src/components/Portfolio.tsx
import React from 'react';
import { GanttChartSquare } from 'lucide-react';
import { usePortfolioData } from '../hooks/useStockData'; // Custom hook to fetch portfolio data
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { Link } from 'react-router-dom'; // Import Link for navigation

const Portfolio = () => {
  const { data: portfolioData, isLoading, error, isError } = usePortfolioData();

  if (isLoading) {
    return <LoadingCard message={''} />;
  }

  if (isError) {
    return <ErrorCard message={error instanceof Error ? error.message : 'Error loading portfolio data'} />;
  }

  if (!portfolioData || portfolioData.length === 0) {
    return <ErrorCard message="No portfolio data available" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GanttChartSquare className="w-8 h-8 text-blue-600" />
            </div>
            <nav>
              <Link to="/" className="text-blue-600 hover:underline">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <h1 className="text-2xl font-bold mb-4">My Portfolio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioData.map((stock) => (
          <div key={stock.ticker} className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold">{stock.ticker}</h2>
            <p>Total Invested: ${Number(stock.total_invested).toFixed(2)}</p>
            <p>Current Value: ${Number(stock.market_value).toFixed(2)}</p>
            <p>Current Quantity: {Number(stock.current_quantity).toFixed(1)}</p>
            <p>Profit/Loss: ${Number(stock.total_profit_loss).toFixed(2)}</p>
            <p>ROI Percentage: %{Number(stock.roi_percentage).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio; // Ensure this is at the bottom