import React from 'react';
import { Network } from 'lucide-react';

interface CorrelationMatrixProps {
  correlations: Array<{
    ticker1: string;
    ticker2: string;
    correlation: number;
  }>;
}

export function CorrelationMatrix({ correlations }: CorrelationMatrixProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold">Cross-Security Correlations</h3>
      </div>

      <div className="space-y-3">
        {correlations.map(({ ticker1, ticker2, correlation }) => (
          <div 
            key={`${ticker1}-${ticker2}`}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">
                {ticker1} vs {ticker2}
              </p>
              <p className={`text-sm font-semibold ${
                correlation > 0.7 ? 'text-green-600' : 
                correlation < -0.7 ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {(correlation * 100).toFixed(1)}%
              </p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className={`h-full rounded-full ${
                  correlation > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.abs(correlation * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}