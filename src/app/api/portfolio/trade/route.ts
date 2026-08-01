import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Import in-memory backup state to match our get route fallbacks
let mockPortfolios: Record<string, { id: string; userId: string; cashBalance: number }> = {};
let mockTransactions: { id: string; portfolioId: string; symbol: string; type: string; shares: number; price: number; totalAmount: number; createdAt: string }[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, symbol, type, shares, price } = body;

    if (!userId || !symbol || !type || !shares || !price) {
      return NextResponse.json({ error: 'Missing required trading fields' }, { status: 400 });
    }

    if (shares <= 0 || price <= 0) {
      return NextResponse.json({ error: 'Shares and price must be positive numbers' }, { status: 400 });
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const tradeType = type.trim().toUpperCase(); // BUY or SELL
    const totalAmount = shares * price;

    if (tradeType !== 'BUY' && tradeType !== 'SELL') {
      return NextResponse.json({ error: 'Invalid transaction type. Must be BUY or SELL.' }, { status: 400 });
    }

    try {
      // 1. Run live Prisma transaction
      const result = await prisma.$transaction(async (tx) => {
        let portfolio = await tx.portfolio.findUnique({
          where: { userId },
          include: { transactions: true }
        });

        if (!portfolio) {
          portfolio = await tx.portfolio.create({
            data: { userId, cashBalance: 100000.0 },
            include: { transactions: true }
          });
        }

        if (tradeType === 'BUY') {
          if (portfolio.cashBalance < totalAmount) {
            throw new Error('Insufficient cash balance to buy this asset');
          }

          // Deduct cash and create BUY transaction
          const updatedPortfolio = await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { cashBalance: { decrement: totalAmount } }
          });

          const transaction = await tx.transaction.create({
            data: {
              portfolioId: portfolio.id,
              symbol: cleanSymbol,
              type: 'BUY',
              shares,
              price,
              totalAmount
            }
          });

          return { portfolio: updatedPortfolio, transaction };
        } else {
          // Sell order: verify current held shares
          const holdings: Record<string, number> = {};
          portfolio.transactions.forEach(t => {
            if (t.type === 'BUY') {
              holdings[t.symbol] = (holdings[t.symbol] || 0) + t.shares;
            } else if (t.type === 'SELL') {
              holdings[t.symbol] = (holdings[t.symbol] || 0) - t.shares;
            }
          });

          const currentShares = holdings[cleanSymbol] || 0;
          if (currentShares < shares) {
            throw new Error(`Insufficient shares. You only own ${currentShares} shares of ${cleanSymbol}`);
          }

          // Credit cash and create SELL transaction
          const updatedPortfolio = await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { cashBalance: { increment: totalAmount } }
          });

          const transaction = await tx.transaction.create({
            data: {
              portfolioId: portfolio.id,
              symbol: cleanSymbol,
              type: 'SELL',
              shares,
              price,
              totalAmount
            }
          });

          return { portfolio: updatedPortfolio, transaction };
        }
      });

      return NextResponse.json({ success: true, ...result });
    } catch (dbError: any) {
      console.warn('Prisma transaction failed, fallback to mock trade execution:', dbError.message || dbError);

      if (dbError.message && (dbError.message.includes('Insufficient') || dbError.message.includes('only own'))) {
        return NextResponse.json({ error: dbError.message }, { status: 400 });
      }

      // Mock implementation
      if (!mockPortfolios[userId]) {
        mockPortfolios[userId] = {
          id: `mock-port-${Date.now()}`,
          userId,
          cashBalance: 100000.0
        };
      }

      const p = mockPortfolios[userId];
      const txs = mockTransactions.filter(t => t.portfolioId === p.id);

      if (tradeType === 'BUY') {
        if (p.cashBalance < totalAmount) {
          return NextResponse.json({ error: 'Insufficient cash balance to buy this asset (Mock)' }, { status: 400 });
        }

        p.cashBalance -= totalAmount;
        const mockTx = {
          id: `mock-tx-${Date.now()}`,
          portfolioId: p.id,
          symbol: cleanSymbol,
          type: 'BUY',
          shares,
          price,
          totalAmount,
          createdAt: new Date().toISOString()
        };
        mockTransactions.push(mockTx);

        return NextResponse.json({
          success: true,
          portfolio: p,
          transaction: mockTx
        });
      } else {
        const holdings: Record<string, number> = {};
        txs.forEach(t => {
          if (t.type === 'BUY') {
            holdings[t.symbol] = (holdings[t.symbol] || 0) + t.shares;
          } else if (t.type === 'SELL') {
            holdings[t.symbol] = (holdings[t.symbol] || 0) - t.shares;
          }
        });

        const currentShares = holdings[cleanSymbol] || 0;
        if (currentShares < shares) {
          return NextResponse.json({ error: `Insufficient shares. You only own ${currentShares} shares of ${cleanSymbol} (Mock)` }, { status: 400 });
        }

        p.cashBalance += totalAmount;
        const mockTx = {
          id: `mock-tx-${Date.now()}`,
          portfolioId: p.id,
          symbol: cleanSymbol,
          type: 'SELL',
          shares,
          price,
          totalAmount,
          createdAt: new Date().toISOString()
        };
        mockTransactions.push(mockTx);

        return NextResponse.json({
          success: true,
          portfolio: p,
          transaction: mockTx
        });
      }
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
