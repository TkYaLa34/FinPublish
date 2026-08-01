"use client";

import React, { ReactNode } from 'react';
import { usePortfolio } from './portfolio-context';
import { TrendingUp, BarChart3, ShieldAlert, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ============================================================================
// REUSABLE DASHBOARD UI COMPONENTS (SECTION 4)
// ============================================================================

/**
 * Custom wrapper component that creates a responsive grid:
 * - Desktop: 4 columns
 * - Tablet: 2 columns
 * - Mobile: 1 column
 * Uses spacing consistent with premium dashboards (16-24px).
 */
export const DashboardGrid = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {children}
    </div>
  );
};

/**
 * Text-styling component for uniform high-contrast, readable metrics.
 * Ensures strict contrast in both light and dark modes.
 */
export const MetricValue = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white ${className}`}>
      {children}
    </span>
  );
};

/**
 * Premium StatusBadge with modern subtle border-and-background design.
 */
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

export const StatusBadge = ({ label, variant }: StatusBadgeProps) => {
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    neutral: 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[variant]} transition-colors duration-150`}>
      {label}
    </span>
  );
};

/**
 * Reusable Dashboard Card component.
 * Adheres to WCAG contrast, handles semantic HTML, subtle shadows, rounded borders,
 * and maintains proper typography sizing.
 */
interface DashboardCardProps {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: ReactNode;
  badge?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const DashboardCard = ({ title, value, subtitle, icon, badge, trend }: DashboardCardProps) => {
  return (
    <div className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200"
         role="region"
         aria-label={title}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide truncate">
          {title}
        </h3>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-150 flex-shrink-0">
          {icon}
        </div>
      </div>

      {/* Main Metric & Status Row */}
      <div className="mt-4 flex items-baseline justify-between space-x-2 flex-wrap">
        <div className="flex items-baseline space-x-2">
          {value}
          {trend && (
            <span className={`inline-flex items-center text-xs font-bold ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.value}
            </span>
          )}
        </div>
        {badge && <div className="mt-1 sm:mt-0">{badge}</div>}
      </div>

      {/* Subtitle / Context info */}
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 truncate">
        {subtitle}
      </p>
    </div>
  );
};

// ============================================================================
// INTEGRATED ACTIVE FINANCIAL DASHBOARD (SECTIONS 2, 3, 5)
// ============================================================================

export const FinancialDashboard = () => {
  const { totalPortfolioValue, riskReport, loading, error, portfolio } = usePortfolio();

  if (loading) {
    return (
      <DashboardGrid>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse h-[140px]">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-32 mt-4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-40 mt-3"></div>
          </div>
        ))}
      </DashboardGrid>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50 rounded-xl text-sm font-semibold flex items-center justify-center">
        Failed to load quantitative dashboard metrics: {error}
      </div>
    );
  }

  // Calculate Net Worth / Total Value metrics
  const netWorthStr = `$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Quick dynamic analysis for badges/trends
  const cashPercent = portfolio && totalPortfolioValue > 0
    ? ((portfolio.cashBalance / totalPortfolioValue) * 100).toFixed(0)
    : "100";

  // Beta summary
  const beta = riskReport ? riskReport.portfolioBeta : 1.00;
  let betaLabel = "Defensive";
  let betaVariant: BadgeVariant = "success";
  if (beta > 1.2) {
    betaLabel = "Aggressive";
    betaVariant = "danger";
  } else if (beta >= 0.8) {
    betaLabel = "Market Neutral";
    betaVariant = "info";
  }

  // Sharpe Ratio summary
  const sharpe = riskReport ? riskReport.portfolioSharpeRatio : 0.00;
  let sharpeLabel = "Standard";
  let sharpeVariant: BadgeVariant = "neutral";
  if (sharpe >= 2.0) {
    sharpeLabel = "Excellent";
    sharpeVariant = "success";
  } else if (sharpe >= 1.0) {
    sharpeLabel = "Good";
    sharpeVariant = "info";
  } else if (sharpe < 0.5 && sharpe !== 0) {
    sharpeLabel = "Low Return";
    sharpeVariant = "warning";
  }

  // Risk Level summary
  let riskLabel = "Low Risk";
  let riskVariant: BadgeVariant = "success";
  if (beta > 1.2 && sharpe < 1.0) {
    riskLabel = "High Speculative";
    riskVariant = "danger";
  } else if (beta > 1.0 || sharpe < 0.8) {
    riskLabel = "Moderate Vol";
    riskVariant = "warning";
  } else if (portfolio?.holdings.length === 0) {
    riskLabel = "Cash Only";
    riskVariant = "neutral";
  }

  return (
    <DashboardGrid>
      {/* 1. Total Portfolio Value Card */}
      <DashboardCard
        title="Total Net Worth"
        value={<MetricValue>{netWorthStr}</MetricValue>}
        subtitle={`Assets backed with ${cashPercent}% Cash cushion`}
        icon={<TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        badge={<StatusBadge label="Simulated" variant="info" />}
      />

      {/* 2. Portfolio Beta Card */}
      <DashboardCard
        title="Portfolio Beta"
        value={<MetricValue>{beta.toFixed(2)}</MetricValue>}
        subtitle="Volatility factor relative to SPY proxy"
        icon={<BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        badge={<StatusBadge label={betaLabel} variant={betaVariant} />}
      />

      {/* 3. Sharpe Ratio Card */}
      <DashboardCard
        title="Sharpe Ratio"
        value={<MetricValue>{sharpe.toFixed(2)}</MetricValue>}
        subtitle="Expected excess returns per volatility unit"
        icon={<Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        badge={<StatusBadge label={sharpeLabel} variant={sharpeVariant} />}
      />

      {/* 4. Risk Level Card */}
      <DashboardCard
        title="Portfolio Risk Status"
        value={<MetricValue>{portfolio?.holdings.length === 0 ? "None" : riskLabel}</MetricValue>}
        subtitle={`Analyzing ${portfolio?.holdings.length || 0} active US equity positions`}
        icon={<ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        badge={<StatusBadge label={portfolio?.holdings.length === 0 ? "Inert" : "Active"} variant={portfolio?.holdings.length === 0 ? "neutral" : "success"} />}
      />
    </DashboardGrid>
  );
};
