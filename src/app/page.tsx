"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ValuationCard } from '@/components/finance/valuation-card';
import { FinancialChart } from '@/components/finance/charts';
import { DCFValuationCard } from '@/components/finance/dcf-valuation';
import { WatchlistWidget } from '@/components/finance/watchlist';
import { PortfolioSummary } from '@/components/finance/portfolio';
import { TradeModal } from '@/components/finance/trade-modal';
import { PortfolioRiskAnalytics } from '@/components/finance/risk-analytics';
import { PortfolioProvider } from '@/components/finance/portfolio-context';
import { FinancialDashboard } from '@/components/finance/dashboard-ui';
import { DynamicFinancialForm } from '@/components/finance/dynamic-financial-form';
import { Article } from '@/types/article';
import { FinancialData } from '@/types/finance';
import { TrendingUp, FileText, ArrowRight, Loader2, Search, Star, Briefcase, UserCheck } from 'lucide-react';

interface FinanceTickerWithHist extends FinancialData {
  historical: { date: string; price: number }[];
  freeCashFlow: number;
  outstandingShares: number;
  totalDebt: number;
  cashAndEquivalents: number;
}

export default function HomeFeed() {
  const [tickers, setTickers] = useState<FinanceTickerWithHist[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<FinanceTickerWithHist | null>(null);
  const [loading, setLoading] = useState(true);

  // Authenticated user ID (Multi-Tenancy)
  const [activeUserId, setActiveUserId] = useState<string>('mock-user');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Sync state for portfolio/watchlist
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<FinanceTickerWithHist | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setWithSearchError] = useState<string | null>(null);

  // Watchlist status for search result
  const [isSearchingWatched, setIsSearchingWatched] = useState(false);

  const fetchUserSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setActiveUserId(user.id);
        setUserEmail(user.email || null);
      }
    } catch (_err) {
      console.warn('Failed to retrieve user session, using mock sandbox:', _err);
    }
  };

  const fetchData = async () => {
    try {
      const [financeRes, articlesRes] = await Promise.all([
        fetch('/api/finance'),
        fetch('/api/articles')
      ]);

      const financeData = await financeRes.json();
      const articlesData = await articlesRes.json();

      setTickers(financeData);
      setArticles(articlesData);

      if (financeData && financeData.length > 0 && !selectedTicker) {
        setSelectedTicker(financeData[0]);
      }
    } catch (_error) {
      console.error('Error fetching dashboard feed data:', _error);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async (symbol: string) => {
    try {
      const res = await fetch(`/api/watchlist?userId=${activeUserId}`);
      if (res.ok) {
        const data = await res.json();
        const found = data.some((item: any) => item.symbol === symbol);
        setIsSearchingWatched(found);
      }
    } catch (_err) {
      console.error('Failed to verify watchlist status:', _err);
    }
  };

  useEffect(() => {
    fetchUserSession();
  }, []);

  useEffect(() => {
    fetchData();
  }, [refreshCounter]);

  useEffect(() => {
    if (searchResult) {
      checkWatchlistStatus(searchResult.symbol);
    }
  }, [searchResult, activeUserId, refreshCounter]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = searchQuery.trim().toUpperCase();
    if (!symbol) return;

    setSearchLoading(true);
    setWithSearchError(null);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/finance?q=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        const err = await res.json();
        setWithSearchError(err.error || 'Symbol not found in coverage list.');
      }
    } catch (_err) {
      setWithSearchError('Failed to query US Market Feed server.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleWatch = async (symbol: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUserId, symbol }),
      });
      if (res.ok) {
        setRefreshCounter(prev => prev + 1);
      }
    } catch (_err) {
      console.error('Failed to toggle watchlist:', _err);
    }
  };

  const handleSelectSymbol = async (symbol: string) => {
    try {
      const res = await fetch(`/api/finance?q=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicker(data);
      }
    } catch (_err) {
      console.error('Failed to load selected ticker details:', _err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading premium market data & analysis...</p>
      </div>
    );
  }

  return (
    <PortfolioProvider userId={activeUserId} refreshTrigger={refreshCounter}>
      <div className="space-y-12">
        {/* Active User Badge */}
        {userEmail && (
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 max-w-max text-xs text-blue-800 font-semibold shadow-sm">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Logged in as: <strong className="text-blue-900">{userEmail}</strong> (Isolated Multi-Tenant Session)</span>
          </div>
        )}

        {/* Hero Welcome */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Real-time Market Insights & Professional Analysis
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Get institutional-grade stock valuation dashboards paired with qualitative deep-dives from top analysts.
          </p>
        </div>

        {/* Foundational Live SaaS Dashboard Widgets (Section 1) */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Analytics Hub</h2>
          </div>
          <FinancialDashboard />
        </section>

        {/* Main workspace layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Side: Stocks, Charts, & Dynamic Financial Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Sector-Specific Dynamic Financial Input Form */}
            <DynamicFinancialForm />

            {/* US Stock / ETF Search Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">US Stock & ETF Finder</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search real-time US Equity/ETF quotes and automatically project interactive DCF valuations (e.g. AAPL, MSFT, TSLA, NVDA, SPY, QQQ).
              </p>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter ticker (e.g. TSLA, SPY)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md outline-none focus:border-blue-500 transition-colors text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center space-x-1"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
                </button>
              </form>

              {searchError && (
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{searchError}</p>
              )}

              {/* Search Result view block with Watch Toggle */}
              {searchResult && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="md:col-span-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase">Stock Quote Card</p>
                      <button
                        onClick={() => handleToggleWatch(searchResult.symbol)}
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition-all border ${
                          isSearchingWatched
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isSearchingWatched ? (
                          <>
                            <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                            <span>Watched</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <span>Watch</span>
                          </>
                        )}
                      </button>
                    </div>
                    <ValuationCard {...searchResult} />
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">{searchResult.symbol} Trend Price Chart</p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <FinancialChart symbol={searchResult.symbol} data={searchResult.historical} />
                      </div>
                    </div>
                    {/* Dynamic DCF Builder for Search Result */}
                    <DCFValuationCard
                      symbol={searchResult.symbol}
                      name={searchResult.name}
                      price={searchResult.price}
                      freeCashFlow={searchResult.freeCashFlow}
                      outstandingShares={searchResult.outstandingShares}
                      totalDebt={searchResult.totalDebt}
                      cashAndEquivalents={searchResult.cashAndEquivalents}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Interactive Stock valuation and Chart section */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Interactive Valuation Board</h2>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
                Click any stock card below to preview its historical trend line and custom valuation route model.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickers.map((ticker) => (
                  <div
                    key={ticker.symbol}
                    onClick={() => setSelectedTicker(ticker)}
                    className={`cursor-pointer transition-all ${
                      selectedTicker?.symbol === ticker.symbol
                        ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 transform scale-[1.02]'
                        : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <ValuationCard {...ticker} />
                  </div>
                ))}
              </div>

              {selectedTicker && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedTicker.symbol} Performance Trend
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTicker.name}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Past 5 Trading Days</span>
                    </div>
                    <FinancialChart symbol={selectedTicker.symbol} data={selectedTicker.historical} />
                  </div>

                  {/* Real-time interactive DCF valuation card for selected stock */}
                  <DCFValuationCard
                    symbol={selectedTicker.symbol}
                    name={selectedTicker.name}
                    price={selectedTicker.price}
                    freeCashFlow={selectedTicker.freeCashFlow}
                    outstandingShares={selectedTicker.outstandingShares}
                    totalDebt={selectedTicker.totalDebt}
                    cashAndEquivalents={selectedTicker.cashAndEquivalents}
                  />
                </div>
              )}
            </section>
          </div>

          {/* Right Side: Portfolio Summary, Risk Analytics & Watchlist Widget (1 Col) */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span>Active Workspace Portfolios</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track portfolios, calculate risk correlations, and trade US securities</p>
            </div>

            <PortfolioSummary
              userId={activeUserId}
              onOpenTradeModal={() => setIsTradeOpen(true)}
            />

            {/* Real-time multi-tenant Portfolio Risk & Correlation Analytics */}
            <PortfolioRiskAnalytics />

            <WatchlistWidget
              userId={activeUserId}
              onSelectSymbol={handleSelectSymbol}
              onRefreshTrigger={refreshCounter}
            />
          </div>
        </div>

        {/* Analytical Articles Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Latest Financial Analysis</h2>
            </div>
            <Link href="/dashboard" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center">
              Write an article <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500">
                    <span>Published on {new Date(article.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>By {article.author?.name || 'Guest Analyst'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link href={`/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3">
                    {article.content.replace(/[#*`\-]/g, '').slice(0, 150)}...
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    href={`/${article.slug}`}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center"
                  >
                    Read full analysis <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Trade Modal Component */}
        <TradeModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          userId={activeUserId}
          onSuccess={() => setRefreshCounter(prev => prev + 1)}
        />
      </div>
    </PortfolioProvider>
  );
}
