export interface FinancialData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio?: number | null;
  dividendYield?: number | null;
  updatedAt: Date | string;
}

export interface HistoricalPrice {
  date: string;
  price: number;
}
