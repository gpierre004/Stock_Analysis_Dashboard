import React from 'react';
import { LineChart as ChartIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  ticker: string;
  data: {
    price: number;
    change: number;
    sma20: number;
    volume: number;
  };
  historicalData: Array<{
    date: string;
    price: number;
    sma20: number;
  }>;
}

const PriceChart = ({ ticker, data, historicalData }: PriceChartProps) => {
  const isPositive = data.change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">{ticker}</h3>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">{data.change.toFixed(2)}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-40 bg-gray-50 rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="sma20" 
                stroke="#9ca3af" 
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
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
};

export default PriceChart;