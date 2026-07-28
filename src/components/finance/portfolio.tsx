"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Wallet, History, ArrowUpRight, ArrowDownRight, Loader2, ArrowRight } from 'lucide-react';

interface PortfolioProps {
  userId?: string;
  onRefreshTrigger?: number; // External refresh triggers
  onOpenTradeModal: () => void;
}

export const PortfolioSummary = ({ userId = 'mock-user', onRefreshTrigger, onOpenTradeModal }: PortfolioProps) => {
  const [portfolio, setPortfolio] = useState<{
    id: string;
    cashBalance: number;
    holdings: { symbol: string; shares: number }[];
    transactions: { id: string; symbol: string; type: string; shares: number; price: number; totalAmount: number; createdAt: string }[];
  } | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchPortfolioAndPrices = async () => {
    try {
      const [portRes, financeRes] = await Promise.all([
        fetch(`/api/portfolio?userId=${userId}`),
        fetch('/api/finance')
      ]);

      if (portRes.ok && financeRes.ok) {
        const portData = await portRes.json();
        const financeData = await financeRes.json();

        setPortfolio(portData);

        // Build simple quick lookup for current ticker prices
        const priceMap: Record<string, number> = {};
        if (Array.isArray(financeData)) {
          financeData.forEach((item: any) => {
            priceMap[item.symbol] = item.price;
          });
        }
        setPrices(priceMap);
      }
    } catch (_err) {
      console.error('Failed to load portfolio details:', _err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioAndPrices();
  }, [userId, onRefreshTrigger]);

  if (loading || !portfolio) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate current market value of holdings in real-time
  let totalHoldingsValue = 0;
  portfolio.holdings.forEach(hold => {
    const currentPrice = prices[hold.symbol] || 245.50; // Fallback to simulated median
    totalHoldingsValue += hold.shares * currentPrice;
  });

  const totalPortfolioValue = portfolio.cashBalance + totalHoldingsValue;

  return (
    <div className="space-y-6">
      {/* Portfolio Totals Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 shadow-lg">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-indigo-300" />
              <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">My Simulation Portfolio</span>
            </div>
            <Button size="sm" onClick={onOpenTradeModal} className="bg-blue-600 hover:bg-blue-500 font-bold border-0 text-white flex items-center">
              <span>Trade Ticket</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <p className="text-xs text-slate-400">Total Net Worth</p>
              <p className="text-3xl font-extrabold text-white">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Cash Balance</p>
              <p className="text-xl font-bold text-emerald-400">${portfolio.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Securities Value</p>
              <p className="text-xl font-bold text-indigo-300">${totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Securities Holdings List */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Active Holdings ({portfolio.holdings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {portfolio.holdings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No stock holdings. Click &quot;Trade Ticket&quot; above to place your first trade!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {portfolio.holdings.map((hold) => {
                  const currentPrice = prices[hold.symbol] || 245.50;
                  const marketValue = hold.shares * currentPrice;
                  return (
                    <div key={hold.symbol} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{hold.symbol}</p>
                        <p className="text-xs text-slate-500">{hold.shares} Shares @ ${currentPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-semibold text-slate-700">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions History List */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <History className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>Recent Transaction Log</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            {portfolio.transactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {portfolio.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{tx.symbol}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">${tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500">{tx.shares} Shares @ ${tx.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
