import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { calculateSupportResistance } from '@/lib/technical-indicators';
import { DEFAULT_STOCKS } from '@/lib/finance-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toUpperCase();

    if (q) {
      console.log(`Searching stock/ETF ticker: ${q}`);

      const cacheKey = `finpublish:ticker_${q}`;
      const cachedItem = await redis.get(cacheKey);
      if (cachedItem) {
        console.log(`Serving query ticker ${q} from Upstash Redis Cache`);
        return NextResponse.json(cachedItem);
      }

      let dbItem = null;
      try {
        dbItem = await prisma.financialData.findUnique({
          where: { symbol: q }
        });
      } catch (_e) {
        console.warn('Database findUnique failed, using local list search:', _e);
      }

      let matched = dbItem
        ? {
            id: dbItem.id,
            symbol: dbItem.symbol,
            name: dbItem.name,
            price: dbItem.price,
            change: dbItem.change,
            changePercent: dbItem.changePercent,
            marketCap: dbItem.marketCap,
            peRatio: dbItem.peRatio,
            dividendYield: dbItem.dividendYield,
            freeCashFlow: dbItem.price * 10000000,        // Proportional proxy
            outstandingShares: 100000000,
            totalDebt: dbItem.price * 5000000,
            cashAndEquivalents: dbItem.price * 3000000,
            historical: [
              { date: 'Mon', price: dbItem.price * 0.98 },
              { date: 'Tue', price: dbItem.price * 1.01 },
              { date: 'Wed', price: dbItem.price * 0.99 },
              { date: 'Thu', price: dbItem.price * 1.02 },
              { date: 'Fri', price: dbItem.price },
            ]
          }
        : DEFAULT_STOCKS.find(item => item.symbol === q);

      if (!matched) {
        const isEtf = q.length === 3;
        matched = {
          symbol: q,
          name: isEtf ? `${q} Index Fund Trust` : `${q} Corporation Inc.`,
          price: 245.50,
          change: 1.45,
          changePercent: 0.59,
          marketCap: isEtf ? 150000000000 : 850000000000,
          peRatio: isEtf ? 22.1 : 28.5,
          dividendYield: isEtf ? 1.45 : 0.85,
          freeCashFlow: 5000000000,
          outstandingShares: 1000000000,
          totalDebt: 3000000000,
          cashAndEquivalents: 4000000000,
          historical: [
            { date: 'Mon', price: 240.2 },
            { date: 'Tue', price: 241.9 },
            { date: 'Wed', price: 238.5 },
            { date: 'Thu', price: 243.1 },
            { date: 'Fri', price: 245.50 },
          ]
        };
      }

      // Append Support & Resistance technical levels
      const levels = calculateSupportResistance(matched.price, matched.historical);
      const resultPayload = {
        ...matched,
        ...levels
      };

      try {
        await redis.set(cacheKey, resultPayload, { ex: 60 });
      } catch (_redisErr) {
        console.warn('Failed to save individual ticker to Redis Cache:', _redisErr);
      }

      return NextResponse.json(resultPayload);
    }

    const cachedData = await redis.get('finpublish:finance_data');
    if (cachedData) {
      console.log('Serving board finance data from Upstash Redis Cache');
      return NextResponse.json(cachedData);
    }

    let dbData;
    try {
      dbData = await prisma.financialData.findMany();
    } catch (_e) {
      console.warn('Database query failed for finance data, using local list:', _e);
    }

    const mappedList = dbData && dbData.length > 0
      ? dbData.map(item => {
          const matched = DEFAULT_STOCKS.find(d => d.symbol === item.symbol);
          return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent,
            marketCap: item.marketCap,
            peRatio: item.peRatio,
            dividendYield: item.dividendYield,
            freeCashFlow: matched?.freeCashFlow || item.price * 10000000,
            outstandingShares: matched?.outstandingShares || 100000000,
            totalDebt: matched?.totalDebt || item.price * 5000000,
            cashAndEquivalents: matched?.cashAndEquivalents || item.price * 3000000,
            historical: matched?.historical || [
              { date: 'Mon', price: item.price * 0.98 },
              { date: 'Tue', price: item.price * 1.01 },
              { date: 'Wed', price: item.price * 0.99 },
              { date: 'Thu', price: item.price * 1.02 },
              { date: 'Fri', price: item.price },
            ]
          };
        })
      : DEFAULT_STOCKS;

    // Calculate Support and Resistance for each board item
    const finalData = mappedList.map(item => {
      const levels = calculateSupportResistance(item.price, item.historical);
      return {
        ...item,
        ...levels
      };
    });

    try {
      await redis.set('finpublish:finance_data', finalData, { ex: 60 });
    } catch (_redisErr) {
      console.warn('Failed to save to Redis Cache:', _redisErr);
    }

    return NextResponse.json(finalData);
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
