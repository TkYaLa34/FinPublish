"use client";

import { usePortfolio } from './portfolio-context';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RiskAnalyticsProps {
  userId?: string; // Kept for interface backward compatibility
  onRefreshTrigger?: number; // Kept for interface backward compatibility
}

export const PortfolioRiskAnalytics = () => {
  const { riskReport, loading, portfolio } = usePortfolio();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!riskReport || !portfolio) {
    return (
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
          No stock holdings in portfolio. Complete a trade transaction to generate Risk Analytics report.
        </CardContent>
      </Card>
    );
  }

  const symbols = Object.keys(riskReport.correlationMatrix);

  // Helper to get heat color class based on correlation value with Dark Mode support
  const getHeatmapColor = (val: number) => {
    if (val >= 0.7) return 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    if (val >= 0.3) return 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    if (val >= -0.3 && val <= 0.3) return 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Portfolio Risk & Core Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* Main Risk Indicators row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Beta */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Portfolio Beta</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{riskReport.portfolioBeta.toFixed(2)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {riskReport.portfolioBeta > 1.2
                  ? '⚡ Aggressive High Beta (เสี่ยงสูงกว่าตลาด)'
                  : riskReport.portfolioBeta >= 0.8
                  ? '📊 Market Aligned Beta (ระดับเดียวกับตลาด)'
                  : '🛡️ Defensive Low Beta (ผันผวนต่ำกว่าตลาด)'}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sharpe Ratio</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{riskReport.portfolioSharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {riskReport.portfolioSharpeRatio >= 2.0
                  ? '🌟 Excellent Risk-Adjusted Return (สัดส่วนผลตอบแทนเทียบความเสี่ยงดีเยี่ยม)'
                  : riskReport.portfolioSharpeRatio >= 1.0
                  ? '👍 Good Risk-Adjusted Return (ระดับคุ้มค่าการลงทุน)'
                  : '⚠️ Low Sharpe Ratio (ผลตอบแทนส่วนเกินต่ำเมื่อเทียบกับระดับความเสี่ยง)'}
              </p>
            </div>
          </div>

          {/* Correlation Matrix Heatmap */}
          {symbols.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pairwise Correlation Heatmap</p>
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
                <table className="min-w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-2 text-left">Ticker</th>
                      {symbols.map(s => (
                        <th key={s} className="px-3 py-2 text-sm">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {symbols.map(x => (
                      <tr key={x} className="text-xs">
                        <td className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30">{x}</td>
                        {symbols.map(y => {
                          const corr = riskReport.correlationMatrix[x]?.[y] ?? 0;
                          return (
                            <td
                              key={y}
                              className={`px-3 py-3 border dark:border-slate-800 font-semibold ${getHeatmapColor(corr)}`}
                            >
                              {corr.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 mr-1" /> High Pos Corr (&gt; 0.7)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 mr-1" /> Low/No Corr (Neutral)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mr-1" /> Negative Corr (&lt; -0.3)</span>
              </div>
            </div>
          )}

          {/* Individual Assets Risk Metrics Table */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Asset Risk Summary Breakdown</p>
            <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Asset</th>
                    <th className="px-4 py-2.5">Daily Volatility (Proxy)</th>
                    <th className="px-4 py-2.5">Asset Beta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {Object.keys(riskReport.assetMetrics).map(symbol => {
                    const metrics = riskReport.assetMetrics[symbol];
                    return (
                      <tr key={symbol} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{symbol}</td>
                        <td className="px-4 py-3">{metrics.volatility.toFixed(2)}%</td>
                        <td className="px-4 py-3">{metrics.beta.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
