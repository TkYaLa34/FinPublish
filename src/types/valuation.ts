export type SectorType = 'TECH' | 'FINANCIAL' | 'BIOTECH' | 'REIT' | 'OTHER';

export interface CompanyValuationInput {
  symbol: string;
  name: string;
  price: number;
  outstandingShares: number;
  growthRate?: number;         // e.g. 0.08
  discountRate?: number;       // e.g. 0.10
  terminalGrowthRate?: number; // e.g. 0.025

  // Tech & General Multiples Fallback
  freeCashFlow?: number;
  totalDebt?: number;
  cashAndEquivalents?: number;
  ebitda?: number;
  evToEbitdaMultiplier?: number; // e.g. 15

  // Financial (Banks) - Residual Income Model / Dividend Discount Model
  bookValue?: number;           // Book Value of Equity
  returnOnEquity?: number;      // ROE (e.g. 0.12)
  requiredReturn?: number;      // Cost of Equity (e.g. 0.10)
  dividendPerShare?: number;

  // Biotech - rNPV (Risk-adjusted Net Present Value)
  phaseSuccessProbability?: number; // e.g. 0.65
  projectedRevenue?: number;        // Expected peak sales
  launchYear?: number;
  approvalYear?: number;

  // REITs - Net Asset Value (NAV) & Dividend Discount Model (DDM)
  nav?: number;                 // Net Asset Value per share
  ffo?: number;                 // Funds From Operations
  capRate?: number;             // Capitalization Rate
}

export interface ValuationResult {
  symbol: string;
  name: string;
  currentPrice: number;
  intrinsicValue: number;
  marginOfSafety: number;
  modelUsed: string;
  sector: SectorType;
  breakdown: Record<string, any>;
}
