import React from 'react';
import { LineChart } from 'lucide-react/dist/esm/icons/line-chart';
import { TrendingUp } from 'lucide-react/dist/esm/icons/trending-up';
import { TrendingDown } from 'lucide-react/dist/esm/icons/trending-down';

interface PriceChartProps {
  ticker: string;
  data: {
    price: number;
    change: number;
    sma20: number;
    volume: number;
  };
}

export function PriceChart({ ticker, data }: PriceChartProps) {
  const isPositive = data.change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">{ticker}</h3>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">{data.change.toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
          {/* Use an alternative icon here */}
          <div className="w-8 h-8 text-gray-400"> {/* Placeholder for icon */} </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-lg font-semibold">${data.price.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">SMA 20</p>
            <p className="text-lg font-semibold">${data.sma20.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
