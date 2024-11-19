import React from 'react';
import { LineChart, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceChartProps {
  ticker: string;
  data: {
    price: number | null;
    change: number | null;
    sma20: number | null;
    volume: number | null;
  };
}

export function PriceChart({ ticker, data }: PriceChartProps) {
  const isPositive = (data.change ?? 0) >= 0;

  const formatNumber = (value: number | null, decimals: number = 2): string => {
    return value !== null ? value.toFixed(decimals) : 'N/A';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">{ticker}</h3>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">{formatNumber(data.change)}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-lg font-semibold">
              {data.price !== null ? `$${formatNumber(data.price)}` : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">SMA 20</p>
            <p className="text-lg font-semibold">
              {data.sma20 !== null ? `$${formatNumber(data.sma20)}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
