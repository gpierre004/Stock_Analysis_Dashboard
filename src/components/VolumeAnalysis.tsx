import React from 'react';
import { BarChart2 } from 'lucide-react/dist/esm/icons/bar-chart-2';

interface VolumeAnalysisProps {
  ticker: string;
  volume: number;
  avgVolume: number;
  vwap: number;
}

export function VolumeAnalysis({ ticker, volume, avgVolume, vwap }: VolumeAnalysisProps) {
  const volumeRatio = volume / avgVolume;
  const isHighVolume = volumeRatio > 1.5;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Volume Analysis - {ticker}</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Current Volume</p>
            <p className="text-lg font-semibold">{(volume / 1000000).toFixed(2)}M</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Avg Volume</p>
            <p className="text-lg font-semibold">{(avgVolume / 1000000).toFixed(2)}M</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Volume vs Average</p>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${isHighVolume ? 'bg-purple-600' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(volumeRatio * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm mt-2 font-medium">
            {isHighVolume ? 'Unusual Volume Detected' : 'Normal Volume'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">VWAP</p>
          <p className="text-lg font-semibold">${vwap.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}