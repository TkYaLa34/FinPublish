"use client";

import { usePortfolio } from './portfolio-context';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Wallet, History, Loader2, ArrowRight } from 'lucide-react';

interface PortfolioProps {
  userId?: string;
  onRefreshTrigger?: number; // Kept for interface backward compatibility
  onOpenTradeModal: () => void;
}

export const PortfolioSummary = ({ onOpenTradeModal }: PortfolioProps) => {
  const { portfolio, prices, loading, totalPortfolioValue, totalHoldingsValue } = usePortfolio();

  if (loading || !portfolio) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Totals Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 shadow-lg dark:border dark:border-slate-800">
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
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">My Active Holdings ({portfolio.holdings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {portfolio.holdings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No stock holdings. Click &quot;Trade Ticket&quot; above to place your first trade!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {portfolio.holdings.map((hold) => {
                  const currentPrice = prices[hold.symbol] || 245.50;
                  const marketValue = hold.shares * currentPrice;
                  return (
                    <div key={hold.symbol} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{hold.symbol}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{hold.shares} Shares @ ${currentPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions History List */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
              <History className="w-4 h-4 mr-1.5 text-indigo-500" />
              <span>Recent Transaction Log</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            {portfolio.transactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {portfolio.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{tx.symbol}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">${tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{tx.shares} Shares @ ${tx.price.toFixed(2)}</p>
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
