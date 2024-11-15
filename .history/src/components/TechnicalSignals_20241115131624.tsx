import React from 'react';
import { Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TechnicalSignalsProps {
  ticker: string;
  support: number;
  resistance: number;
  rsi: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export function TechnicalSignals({ ticker, support, resistance, rsi, trend }: TechnicalSignalsProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'bullish': return <ArrowUpRight className="w-5 h-5" />;
      case 'bearish': return <ArrowDownRight className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Technical Analysis - {ticker}</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Support</p>
            <p className="text-lg font-semibold">${support.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Resistance</p>
            <p className="text-lg font-semibold">${resistance.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">RSI</p>
            <p className="text-sm font-medium">{rsi.toFixed(1)}</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className={`h-full rounded-full ${
                rsi > 70 ? 'bg-red-500' : rsi < 30 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${rsi}%` }}
            />
          </div>
          <p className="text-xs mt-2 text-gray-500">
            {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Trend</p>
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <p className="text-lg font-semibold capitalize">{trend}</p>
          </div>
        </div>
      </div>
    </div>
  );
}