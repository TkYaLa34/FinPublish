"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ValuationCard } from '@/components/finance/valuation-card';
import { FinancialChart } from '@/components/finance/charts';
import { Article } from '@/types/article';
import { FinancialData } from '@/types/finance';
import { TrendingUp, FileText, ArrowRight, Loader2 } from 'lucide-react';

interface FinanceTickerWithHist extends FinancialData {
  historical: { date: string; price: number }[];
}

export default function HomeFeed() {
  const [tickers, setTickers] = useState<FinanceTickerWithHist[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<FinanceTickerWithHist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [financeRes, articlesRes] = await Promise.all([
          fetch('/api/finance'),
          fetch('/api/articles')
        ]);

        const financeData = await financeRes.json();
        const articlesData = await articlesRes.json();

        setTickers(financeData);
        setArticles(articlesData);

        if (financeData && financeData.length > 0) {
          setSelectedTicker(financeData[0]);
        }
      } catch (_error) {
        console.error('Error fetching dashboard feed data:', _error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading premium market data & analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Real-time Market Insights & Professional Analysis
        </h1>
        <p className="text-lg text-slate-600">
          Get institutional-grade stock valuation dashboards paired with qualitative deep-dives from top analysts.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Interactive Valuation Board</h2>
        </div>

        <p className="text-sm text-slate-500 -mt-2">
          Click any stock card below to preview its historical trend line.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tickers.map((ticker) => (
            <div
              key={ticker.symbol}
              onClick={() => setSelectedTicker(ticker)}
              className={`cursor-pointer transition-all ${
                selectedTicker?.symbol === ticker.symbol
                  ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-[1.02]'
                  : 'hover:-translate-y-0.5'
              }`}
            >
              <ValuationCard {...ticker} />
            </div>
          ))}
        </div>

        {selectedTicker && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTicker.symbol} Performance Trend
                </h3>
                <p className="text-xs text-slate-500">{selectedTicker.name}</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Past 5 Trading Days</span>
            </div>
            <FinancialChart symbol={selectedTicker.symbol} data={selectedTicker.historical} />
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Latest Financial Analysis</h2>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center">
            Write an article <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Published on {new Date(article.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By {article.author?.name || 'Guest Analyst'}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  <Link href={`/${article.slug}`}>{article.title}</Link>
                </h3>
                <p className="text-slate-600 text-sm line-clamp-3">
                  {article.content.replace(/[#*`\-]/g, '').slice(0, 150)}...
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/${article.slug}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
                >
                  Read full analysis <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
