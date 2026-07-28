import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, ShieldAlert, Zap } from 'lucide-react';

interface ValuationCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio?: number | null;
  dividendYield?: number | null;
  s1?: number;
  s2?: number;
  s3?: number;
  r1?: number;
  r2?: number;
  r3?: number;
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
  s1,
  s2,
  s3,
  r1,
  r2,
  r3,
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
      <CardContent className="space-y-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-gray-900">${price.toFixed(2)}</span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}
            {change.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
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

        {/* Support & Resistance Panel */}
        {s1 !== undefined && r1 !== undefined && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Technical Pivot S/R Levels</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* Resistance Levels */}
              <div className="bg-red-50/55 p-2 rounded-lg border border-red-100 space-y-1">
                <p className="font-bold text-red-800 flex items-center">
                  <Zap className="w-3 h-3 mr-0.5 text-red-500 fill-red-500" />
                  Resistances
                </p>
                <div className="flex justify-between text-red-700 font-semibold">
                  <span>R1 (Short)</span>
                  <span>${r1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-700 font-semibold">
                  <span>R2 (Mid)</span>
                  <span>${r2?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-700 font-semibold">
                  <span>R3 (Long)</span>
                  <span>${r3?.toFixed(2)}</span>
                </div>
              </div>

              {/* Support Levels */}
              <div className="bg-green-50/55 p-2 rounded-lg border border-green-100 space-y-1">
                <p className="font-bold text-green-800 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-0.5 text-green-600 fill-green-600" />
                  Supports
                </p>
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>S1 (Short)</span>
                  <span>${s1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>S2 (Mid)</span>
                  <span>${s2?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>S3 (Long)</span>
                  <span>${s3?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
