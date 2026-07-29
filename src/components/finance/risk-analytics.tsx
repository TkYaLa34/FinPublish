"use client";

import { useEffect, useState } from 'react';
import { calculatePortfolioRisk, PortfolioRiskReport } from '@/lib/risk-calculator';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, ShieldAlert, TrendingUp, HelpCircle, BarChart2 } from 'lucide-react';

interface RiskAnalyticsProps {
  userId?: string;
  onRefreshTrigger?: number;
}

export const PortfolioRiskAnalytics = ({ userId = 'mock-user', onRefreshTrigger }: RiskAnalyticsProps) => {
  const [report, setReport] = useState<PortfolioRiskReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRiskReport = async () => {
    try {
      const [portRes, financeRes] = await Promise.all([
        fetch(`/api/portfolio?userId=${userId}`),
        fetch('/api/finance')
      ]);

      if (portRes.ok && financeRes.ok) {
        const portData = await portRes.ok ? await portRes.json() : null;
        const financeData = await financeRes.ok ? await financeRes.json() : [];

        if (portData && portData.holdings && portData.holdings.length > 0) {
          // Extract current price list
          const pricesMap: Record<string, number> = {};
          const historicalPricesMap: Record<string, { date: string; price: number }[]> = {};

          financeData.forEach((item: any) => {
            pricesMap[item.symbol] = item.price;
            historicalPricesMap[item.symbol] = item.historical;
          });

          const result = calculatePortfolioRisk(
            portData.holdings,
            pricesMap,
            historicalPricesMap
          );
          setReport(result);
        } else {
          setReport(null);
        }
      }
    } catch (_err) {
      console.error('Failed to compute risk report:', _err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskReport();
  }, [userId, onRefreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-xs text-slate-400 italic">
          No stock holdings in portfolio. Complete a trade transaction to generate Risk Analytics report.
        </CardContent>
      </Card>
    );
  }

  const symbols = Object.keys(report.correlationMatrix);

  // Helper to get heat color class based on correlation value
  const getHeatmapColor = (val: number) => {
    if (val >= 0.7) return 'bg-red-100 text-red-800 border-red-200';
    if (val >= 0.3) return 'bg-orange-50 text-orange-800 border-orange-200';
    if (val >= -0.3 && val <= 0.3) return 'bg-slate-50 text-slate-700 border-slate-200';
    return 'bg-green-50 text-green-800 border-green-200';
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Portfolio Risk & Core Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* Main Risk Indicators row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Beta */}
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Portfolio Beta</span>
              <p className="text-3xl font-extrabold text-slate-900">{report.portfolioBeta.toFixed(2)}</p>
              <p className="text-xs text-slate-500">
                {report.portfolioBeta > 1.2
                  ? '⚡ Aggressive High Beta (เสี่ยงสูงกว่าตลาด)'
                  : report.portfolioBeta >= 0.8
                  ? '📊 Market Aligned Beta (ระดับเดียวกับตลาด)'
                  : '🛡️ Defensive Low Beta (ผันผวนต่ำกว่าตลาด)'}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sharpe Ratio</span>
              <p className="text-3xl font-extrabold text-slate-900">{report.portfolioSharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-slate-500">
                {report.portfolioSharpeRatio >= 2.0
                  ? '🌟 Excellent Risk-Adjusted Return (สัดส่วนผลตอบแทนเทียบความเสี่ยงดีเยี่ยม)'
                  : report.portfolioSharpeRatio >= 1.0
                  ? '👍 Good Risk-Adjusted Return (ระดับคุ้มค่าการลงทุน)'
                  : '⚠️ Low Sharpe Ratio (ผลตอบแทนส่วนเกินต่ำเมื่อเทียบกับระดับความเสี่ยง)'}
              </p>
            </div>
          </div>

          {/* Correlation Matrix Heatmap */}
          {symbols.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pairwise Correlation Heatmap</p>
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="min-w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                      <th className="px-4 py-2 text-left">Ticker</th>
                      {symbols.map(s => (
                        <th key={s} className="px-3 py-2 text-sm">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {symbols.map(x => (
                      <tr key={x} className="text-xs">
                        <td className="px-4 py-3 text-left font-bold text-slate-700 bg-slate-50/50">{x}</td>
                        {symbols.map(y => {
                          const corr = report.correlationMatrix[x]?.[y] ?? 0;
                          return (
                            <td
                              key={y}
                              className={`px-3 py-3 border font-semibold ${getHeatmapColor(corr)}`}
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
              <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-200 mr-1" /> High Pos Corr (&gt; 0.7)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200 mr-1" /> Low/No Corr (Neutral)</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-green-50 border border-green-200 mr-1" /> Negative Corr (&lt; -0.3)</span>
              </div>
            </div>
          )}

          {/* Individual Assets Risk Metrics Table */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asset Risk Summary Breakdown</p>
            <div className="overflow-hidden border border-slate-100 rounded-lg">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Asset</th>
                    <th className="px-4 py-2.5">Daily Volatility (Proxy)</th>
                    <th className="px-4 py-2.5">Asset Beta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {Object.keys(report.assetMetrics).map(symbol => {
                    const metrics = report.assetMetrics[symbol];
                    return (
                      <tr key={symbol}>
                        <td className="px-4 py-3 font-bold text-slate-900">{symbol}</td>
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
