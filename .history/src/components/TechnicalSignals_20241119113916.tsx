import React from 'react';
import { Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TechnicalSignalsProps {
  ticker: string;
  support: number | null;
  resistance: number | null;
  rsi: number | null;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export function TechnicalSignals({ ticker, support, resistance, rsi, trend }: TechnicalSignalsProps) {
  const formatNumber = (value: number | null, decimals: number = 2): string => {
    return value !== null ? value.toFixed(decimals) : 'N/A';
  };

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

  const getRsiStatus = (rsi: number | null) => {
    if (rsi === null) return { text: 'N/A', color: 'bg-gray-500' };
    if (rsi > 70) return { text: 'Overbought', color: 'bg-red-500' };
    if (rsi < 30) return { text: 'Oversold', color: 'bg-green-500' };
    return { text: 'Neutral', color: 'bg-blue-500' };
  };

  const rsiStatus = getRsiStatus(rsi);

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
            <p className="text-lg font-semibold">
              {support !== null ? `$${formatNumber(support)}` : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Resistance</p>
            <p className="text-lg font-semibold">
              {resistance !== null ? `$${formatNumber(resistance)}` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">RSI</p>
            <p className="text-sm font-medium">{formatNumber(rsi, 1)}</p>
          </div>
          {rsi !== null ? (
            <>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-full rounded-full ${rsiStatus.color}`}
                  style={{ width: `${Math.min(Math.max(rsi, 0), 100)}%` }}
                />
              </div>
              <p className="text-xs mt-2 text-gray-500">{rsiStatus.text}</p>
            </>
          ) : (
            <p className="text-xs mt-2 text-gray-500">RSI data unavailable</p>
          )}
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
