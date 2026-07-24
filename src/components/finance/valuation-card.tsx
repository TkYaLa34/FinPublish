import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ValuationCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio?: number | null;
  dividendYield?: number | null;
}

export const ValuationCard = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  marketCap,
  peRatio,
  dividendYield,
}: ValuationCardProps) => {
  const isPositive = change >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">{name}</p>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-gray-900">${price.toFixed(2)}</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}
            {change.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-400">Market Cap</p>
            <p className="text-sm font-semibold text-gray-700">${(marketCap / 1e9).toFixed(2)}B</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">P/E Ratio</p>
            <p className="text-sm font-semibold text-gray-700">{peRatio ? peRatio.toFixed(1) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Div Yield</p>
            <p className="text-sm font-semibold text-gray-700">{dividendYield ? `${dividendYield.toFixed(2)}%` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? 'Bullish' : 'Bearish'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
