"use client";

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Star, Loader2, StarOff, AlertCircle } from 'lucide-react';

interface WatchlistProps {
  userId?: string;
  onSelectSymbol: (symbol: string) => void;
  onRefreshTrigger?: number; // External refresh triggers
}

export const WatchlistWidget = ({ userId = 'mock-user', onSelectSymbol, onRefreshTrigger }: WatchlistProps) => {
  const [watchlist, setWatchlist] = useState<{ id: string; symbol: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`/api/watchlist?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data);
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
    fetchWatchlist();
  }, [userId, onRefreshTrigger]);

  const handleRemove = async (symbol: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symbol })
      });
      if (res.ok) {
        fetchWatchlist();
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
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onSelectSymbol(item.symbol)}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-sm tracking-wide">{item.symbol}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.symbol);
                  }}
                  className="p-1.5 h-auto text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50"
                  title="Remove from Watchlist"
                >
                  <StarOff className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
