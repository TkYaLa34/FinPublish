"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { calculatePortfolioRisk, PortfolioRiskReport } from '@/lib/risk-calculator';

interface Holding {
  symbol: string;
  shares: number;
}

interface Transaction {
  id: string;
  symbol: string;
  type: string;
  shares: number;
  price: number;
  totalAmount: number;
  createdAt: string;
}

interface Portfolio {
  id: string;
  cashBalance: number;
  holdings: Holding[];
  transactions: Transaction[];
}

interface PortfolioContextType {
  portfolio: Portfolio | null;
  prices: Record<string, number>;
  riskReport: PortfolioRiskReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  totalPortfolioValue: number;
  totalHoldingsValue: number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ userId = 'mock-user', children, refreshTrigger = 0 }: { userId?: string, children: ReactNode, refreshTrigger?: number }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [historicalPrices, setHistoricalPrices] = useState<Record<string, { date: string; price: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [portRes, financeRes] = await Promise.all([
          fetch(`/api/portfolio?userId=${userId}`),
          fetch('/api/finance')
        ]);

        if (!portRes.ok || !financeRes.ok) {
          throw new Error('Failed to fetch portfolio or financial market data');
        }

        const portData = await portRes.json();
        const financeData = await financeRes.json();

        if (active) {
          setPortfolio(portData);

          const priceMap: Record<string, number> = {};
          const historicalMap: Record<string, { date: string; price: number }[]> = {};

          if (Array.isArray(financeData)) {
            financeData.forEach((item: any) => {
              priceMap[item.symbol] = item.price;
              historicalMap[item.symbol] = item.historical || [];
            });
          }

          setPrices(priceMap);
          setHistoricalPrices(historicalMap);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'An unexpected error occurred loading portfolio data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [userId, refreshCounter, refreshTrigger]);

  const totalHoldingsValue = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.holdings.reduce((sum, hold) => {
      const price = prices[hold.symbol] || 245.50; // Fallback to simulated median
      return sum + hold.shares * price;
    }, 0);
  }, [portfolio, prices]);

  const totalPortfolioValue = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.cashBalance + totalHoldingsValue;
  }, [portfolio, totalHoldingsValue]);

  // Calculate risk analytics using our risk calculator
  const riskReport = useMemo(() => {
    if (!portfolio || portfolio.holdings.length === 0) return null;
    try {
      return calculatePortfolioRisk(
        portfolio.holdings,
        prices,
        historicalPrices
      );
    } catch (err) {
      console.error('Failed to calculate portfolio risk:', err);
      return null;
    }
  }, [portfolio, prices, historicalPrices]);

  return (
    <PortfolioContext.Provider value={{
      portfolio,
      prices,
      riskReport,
      loading,
      error,
      refresh,
      totalPortfolioValue,
      totalHoldingsValue
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
