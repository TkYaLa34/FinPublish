import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let mockWatchlist: { id: string; userId: string; symbol: string }[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Missing userId' }, { status: 401 });
    }

    try {
      const dbWatchlist = await prisma.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(dbWatchlist);
    } catch (_dbError) {
      console.warn('Database query failed for watchlist, using isolated mock store:', _dbError);
      const filtered = mockWatchlist.filter(w => w.userId === userId);
      return NextResponse.json(filtered);
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, symbol } = body;

    if (!userId || !symbol) {
      return NextResponse.json({ error: 'Missing userId or symbol' }, { status: 400 });
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    try {
      const existing = await prisma.watchlist.findUnique({
        where: {
          userId_symbol: { userId, symbol: cleanSymbol }
        }
      });

      if (existing) {
        await prisma.watchlist.delete({
          where: { id: existing.id }
        });
        return NextResponse.json({ success: true, action: 'removed', symbol: cleanSymbol });
      }

      const newWatch = await prisma.watchlist.create({
        data: {
          userId,
          symbol: cleanSymbol
        }
      });
      return NextResponse.json({ success: true, action: 'added', data: newWatch });
    } catch (_dbError) {
      console.warn('Database write failed for watchlist, using isolated mock store:', _dbError);

      const existingIndex = mockWatchlist.findIndex(
        w => w.userId === userId && w.symbol === cleanSymbol
      );

      if (existingIndex !== -1) {
        mockWatchlist.splice(existingIndex, 1);
        return NextResponse.json({ success: true, action: 'removed', symbol: cleanSymbol });
      }

      const newMock = {
        id: `mock-watch-${Date.now()}`,
        userId,
        symbol: cleanSymbol
      };
      mockWatchlist.push(newMock);
      return NextResponse.json({ success: true, action: 'added', data: newMock });
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
