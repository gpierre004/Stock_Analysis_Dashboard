import React from 'react';
import { GanttChartSquare, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { usePortfolioData } from '../hooks/useStockData';
import LoadingCard from './common/LoadingCard';
import ErrorCard from './common/ErrorCard';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const getTrendIcon = (value) => {
    if (value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GanttChartSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
            </div>
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioData.map((stock) => (
            <Card key={stock.ticker} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{stock.ticker}</CardTitle>
                <Badge 
                  variant={Number(stock.roi_percentage) >= 0 ? "success" : "destructive"}
                  className={`${Number(stock.roi_percentage) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {Number(stock.roi_percentage).toFixed(2)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Invested</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        {formatCurrency(stock.total_invested)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Current Value</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        {formatCurrency(stock.market_value)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Quantity</span>
                      <span className="font-medium">{Number(stock.current_quantity).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Profit/Loss</span>
                      <span className={`font-medium flex items-center gap-1 
                        ${Number(stock.total_profit_loss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {getTrendIcon(stock.total_profit_loss)}
                        {formatCurrency(stock.total_profit_loss)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;