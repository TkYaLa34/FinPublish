import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback in-memory state for mock portfolios
let mockPortfolios: Record<string, { id: string; userId: string; cashBalance: number }> = {};
let mockTransactions: { id: string; portfolioId: string; symbol: string; type: string; shares: number; price: number; totalAmount: number; createdAt: string }[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Missing userId' }, { status: 401 });
    }

    try {
      // Find or create live portfolio for the authenticated user
      let portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: { transactions: { orderBy: { createdAt: 'desc' } } }
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            userId,
            cashBalance: 100000.0
          },
          include: { transactions: true }
        });
      }

      // Aggregate holdings
      const holdings: Record<string, number> = {};
      portfolio.transactions.forEach(tx => {
        if (tx.type === 'BUY') {
          holdings[tx.symbol] = (holdings[tx.symbol] || 0) + tx.shares;
        } else if (tx.type === 'SELL') {
          holdings[tx.symbol] = (holdings[tx.symbol] || 0) - tx.shares;
        }
      });

      const activeHoldings = Object.keys(holdings)
        .filter(symbol => holdings[symbol] > 0)
        .map(symbol => ({
          symbol,
          shares: holdings[symbol]
        }));

      return NextResponse.json({
        id: portfolio.id,
        userId: portfolio.userId,
        cashBalance: portfolio.cashBalance,
        holdings: activeHoldings,
        transactions: portfolio.transactions
      });
    } catch (_dbError) {
      console.warn('Database query failed for portfolio, using isolated mock store:', _dbError);

      if (!mockPortfolios[userId]) {
        mockPortfolios[userId] = {
          id: `mock-port-${Date.now()}`,
          userId,
          cashBalance: 100000.0
        };
      }

      const p = mockPortfolios[userId];
      const txs = mockTransactions.filter(t => t.portfolioId === p.id);

      // Aggregate holdings
      const holdings: Record<string, number> = {};
      txs.forEach(tx => {
        if (tx.type === 'BUY') {
          holdings[tx.symbol] = (holdings[tx.symbol] || 0) + tx.shares;
        } else if (tx.type === 'SELL') {
          holdings[tx.symbol] = (holdings[tx.symbol] || 0) - tx.shares;
        }
      });

      const activeHoldings = Object.keys(holdings)
        .filter(symbol => holdings[symbol] > 0)
        .map(symbol => ({
          symbol,
          shares: holdings[symbol]
        }));

      return NextResponse.json({
        id: p.id,
        userId: p.userId,
        cashBalance: p.cashBalance,
        holdings: activeHoldings,
        transactions: txs
      });
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
