"use client";

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Star, Loader2, StarOff, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistProps {
  userId?: string;
  onSelectSymbol: (symbol: string) => void;
  onRefreshTrigger?: number; // External refresh triggers
}

interface WatchlistItemDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  s1: number;
  s2: number;
  s3: number;
  r1: number;
  r2: number;
  r3: number;
}

export const WatchlistWidget = ({ userId = 'mock-user', onSelectSymbol, onRefreshTrigger }: WatchlistProps) => {
  const [watchlist, setWatchlist] = useState<{ id: string; symbol: string }[]>([]);
  const [details, setDetails] = useState<Record<string, WatchlistItemDetail>>({});
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlistAndDetails = async () => {
    try {
      const res = await fetch(`/api/watchlist?userId=${userId}`);
      if (res.ok) {
        const listData = await res.json();
        setWatchlist(listData);

        // Fetch detailed real-time prices & technical support/resistance levels for each ticker
        const detailsMap: Record<string, WatchlistItemDetail> = {};
        await Promise.all(
          listData.map(async (item: { symbol: string }) => {
            try {
              const detailRes = await fetch(`/api/finance?q=${item.symbol}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                detailsMap[item.symbol] = detailData;
              }
            } catch (_err) {
              console.error(`Failed to fetch details for ${item.symbol}:`, _err);
            }
          })
        );
        setDetails(detailsMap);
      } else {
        setError('Failed to fetch watchlist');
      }
    } catch (_err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistAndDetails();
  }, [userId, onRefreshTrigger]);

  const handleRemove = async (symbol: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symbol })
      });
      if (res.ok) {
        fetchWatchlistAndDetails();
      }
    } catch (_err) {
      console.error('Failed to remove watchlist item:', _err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1.5" />
          <span>My Stock Watchlist ({watchlist.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4 flex items-center space-x-1.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {watchlist.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            No symbols watched. Search a stock above to watch it!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {watchlist.map((item) => {
              const d = details[item.symbol];
              const isExpanded = expandedSymbol === item.symbol;
              const isPositive = d ? d.change >= 0 : true;

              return (
                <div key={item.id} className="transition-colors hover:bg-slate-50/50">
                  {/* Summary Row */}
                  <div
                    className="px-4 py-3.5 flex items-center justify-between cursor-pointer"
                    onClick={() => onSelectSymbol(item.symbol)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm tracking-wide">{item.symbol}</span>
                        {d && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{d.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {d ? (
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-sm">${d.price.toFixed(2)}</p>
                          <span className={`inline-flex items-center text-[10px] font-bold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? '+' : ''}
                            {d.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                      )}

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSymbol(isExpanded ? null : item.symbol);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                          title="View Technical Pivot Levels"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(item.symbol);
                          }}
                          className="p-1 h-auto text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50"
                          title="Remove from Watchlist"
                        >
                          <StarOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Technical Levels Area */}
                  {isExpanded && d && (
                    <div className="px-4 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100/70 text-[10px] space-y-2">
                      <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">S/R Support Resistance Levels</p>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Resistances */}
                        <div className="space-y-1">
                          <p className="font-bold text-red-700">Resistances (R1-R3)</p>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="text-slate-500">R1 (Short-term)</span>
                            <span className="font-semibold text-slate-800">${d.r1.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="text-slate-500">R2 (Mid-term)</span>
                            <span className="font-semibold text-slate-800">${d.r2.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pb-0.5">
                            <span className="text-slate-500">R3 (Long-term)</span>
                            <span className="font-semibold text-slate-800">${d.r3.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Supports */}
                        <div className="space-y-1">
                          <p className="font-bold text-green-700">Supports (S1-S3)</p>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="text-slate-500">S1 (Short-term)</span>
                            <span className="font-semibold text-slate-800">${d.s1.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="text-slate-500">S2 (Mid-term)</span>
                            <span className="font-semibold text-slate-800">${d.s2.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pb-0.5">
                            <span className="text-slate-500">S3 (Long-term)</span>
                            <span className="font-semibold text-slate-800">${d.s3.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
