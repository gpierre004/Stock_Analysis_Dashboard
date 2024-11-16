

// ErrorCard.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  ticker?: string;
}

export function ErrorCard({ message, ticker }: ErrorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <div>{message || `Error loading data${ticker ? ` for ${ticker}` : ''}`}</div>
      </div>
    </div>
  );
}