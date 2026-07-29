"use client";

import { useEffect, useState } from 'react';
import { calculateDCF, DCFInputs } from '@/lib/dcf-calculator';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Zap, Brain, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2 } from 'lucide-react';

interface DCFValuationProps {
  symbol: string;
  name: string;
  price: number;
  freeCashFlow: number;
  outstandingShares: number;
  totalDebt: number;
  cashAndEquivalents: number;
}

export const DCFValuationCard = ({
  symbol,
  name,
  price,
  freeCashFlow,
  outstandingShares,
  totalDebt,
  cashAndEquivalents,
}: DCFValuationProps) => {
  // Configurable inputs
  const [growthRate, setGrowthRate] = useState<number>(8); // Passed as percentage (8 -> 0.08)
  const [discountRate, setDiscountRate] = useState<number>(10); // 10 -> 0.10
  const [terminalRate, setTerminalRate] = useState<number>(2.5); // 2.5 -> 0.025

  // Calculations state
  const [dcfResult, setDcfResult] = useState<any>(null);

  // AI Summary State
  const [aiData, setAiData] = useState<{ score: number; summary: string[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Run DCF model
  const runCalculation = () => {
    const inputs: DCFInputs = {
      freeCashFlow,
      outstandingShares,
      totalDebt,
      cashAndEquivalents,
      growthRate: growthRate / 100,
      discountRate: discountRate / 100,
      terminalGrowthRate: terminalRate / 100,
    };
    const result = calculateDCF(price, inputs);
    setDcfResult(result);
  };

  // Run AI analysis
  const fetchAIEvaluation = async (intrinsicVal: number, mos: number) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/finance/ai-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name,
          currentPrice: price,
          intrinsicValue: intrinsicVal,
          marginOfSafety: mos,
          freeCashFlow,
          totalDebt,
          cashAndEquivalents,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiData({
          score: data.score,
          summary: data.summary,
        });
      }
    } catch (_err) {
      console.error('Failed to fetch AI evaluation:', _err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    runCalculation();
    setAiData(null); // Reset AI on stock/parameter change
  }, [symbol, price, freeCashFlow, growthRate, discountRate, terminalRate]);

  const handleFetchAI = () => {
    if (dcfResult) {
      fetchAIEvaluation(dcfResult.intrinsicValue, dcfResult.marginOfSafety);
    }
  };

  if (!dcfResult) return null;

  const isPositive = dcfResult.marginOfSafety > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow border border-slate-200">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <span>AI Stock Valuation & DCF Model Builder</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">

        {/* Param Adjuster Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Growth Rate (Years 1-5)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                step={0.5}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 font-semibold"
              />
              <span className="text-sm text-slate-600 font-bold">%</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Discount Rate (WACC)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                step={0.5}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 font-semibold"
              />
              <span className="text-sm text-slate-600 font-bold">%</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Terminal Growth Rate</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={terminalRate}
                onChange={(e) => setTerminalRate(Number(e.target.value))}
                step={0.1}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 font-semibold"
              />
              <span className="text-sm text-slate-600 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* DCF Outputs Display Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Intrinsic Value */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Intrinsic Value</span>
            <p className="text-4xl font-extrabold text-blue-900 mt-2">${dcfResult.intrinsicValue.toFixed(2)}</p>
            <span className="text-[10px] text-blue-500 mt-1">Calculated Fair Value per share</span>
          </div>

          {/* Current Market Price */}
          <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Price</span>
            <p className="text-4xl font-extrabold text-slate-800 mt-2">${price.toFixed(2)}</p>
            <span className="text-[10px] text-slate-400 mt-1">Latest market quote price</span>
          </div>

          {/* Margin of Safety */}
          <div className={`border rounded-xl p-4 flex flex-col justify-between ${
            isPositive
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wide ${
              isPositive ? 'text-emerald-800' : 'text-red-800'
            }`}>Margin of Safety</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <p className={`text-4xl font-extrabold ${
                isPositive ? 'text-emerald-900' : 'text-red-900'
              }`}>{dcfResult.marginOfSafety.toFixed(1)}%</p>
              {isPositive ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
            </div>
            <span className={`text-[10px] mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? 'Undervalued (น่าซื้อสะสม)' : 'Overvalued (ราคาสูงเกินพื้นฐาน)'}
            </span>
          </div>
        </div>

        {/* AI Valuation Panel */}
        <div className="border-t border-slate-100 pt-6">
          {!aiData ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">ให้นักวิเคราะห์ AI ตรวจสอบและสรุปผลประเมินมูลค่าหุ้นตัวนี้</p>
              <Button type="button" onClick={handleFetchAI} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs flex items-center">
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    <span>กำลังวิเคราะห์...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-1.5 text-indigo-200" />
                    <span>เรียกใช้งาน AI automated Analyst</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-md animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-extrabold tracking-wide uppercase">AI Valuation Insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <div className="flex items-center bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded text-xs font-bold text-indigo-300">
                    <Zap className="w-3.5 h-3.5 text-indigo-400 mr-0.5 fill-indigo-400" />
                    <span>{aiData.score}/10</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <ul className="list-disc pl-4 space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  {aiData.summary.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
};
