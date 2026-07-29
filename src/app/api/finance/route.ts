import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { calculateSupportResistance } from '@/lib/technical-indicators';

const defaultFinanceData = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 189.84,
    change: 2.34,
    changePercent: 1.25,
    marketCap: 2950000000000,
    peRatio: 28.4,
    dividendYield: 0.51,
    historical: [
      { date: 'Mon', price: 185.2 },
      { date: 'Tue', price: 186.9 },
      { date: 'Wed', price: 184.5 },
      { date: 'Thu', price: 187.5 },
      { date: 'Fri', price: 189.84 },
    ]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 178.47,
    change: -5.12,
    changePercent: -2.79,
    marketCap: 568000000000,
    peRatio: 45.2,
    dividendYield: 0,
    historical: [
      { date: 'Mon', price: 185.0 },
      { date: 'Tue', price: 182.1 },
      { date: 'Wed', price: 183.5 },
      { date: 'Thu', price: 180.2 },
      { date: 'Fri', price: 178.47 },
    ]
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.60,
    change: 4.88,
    changePercent: 1.19,
    marketCap: 3090000000000,
    peRatio: 35.8,
    dividendYield: 0.72,
    historical: [
      { date: 'Mon', price: 408.3 },
      { date: 'Tue', price: 410.5 },
      { date: 'Wed', price: 409.1 },
      { date: 'Thu', price: 412.0 },
      { date: 'Fri', price: 415.60 },
    ]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 875.12,
    change: 18.54,
    changePercent: 2.16,
    marketCap: 2180000000000,
    peRatio: 72.4,
    dividendYield: 0.02,
    historical: [
      { date: 'Mon', price: 840.1 },
      { date: 'Tue', price: 852.3 },
      { date: 'Wed', price: 848.0 },
      { date: 'Thu', price: 865.2 },
      { date: 'Fri', price: 875.12 },
    ]
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    price: 540.23,
    change: 3.12,
    changePercent: 0.58,
    marketCap: 520000000000,
    peRatio: 24.2,
    dividendYield: 1.32,
    historical: [
      { date: 'Mon', price: 532.5 },
      { date: 'Tue', price: 534.2 },
      { date: 'Wed', price: 531.0 },
      { date: 'Thu', price: 537.1 },
      { date: 'Fri', price: 540.23 },
    ]
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust Series 1',
    price: 462.15,
    change: 5.75,
    changePercent: 1.26,
    marketCap: 240000000000,
    peRatio: 32.1,
    dividendYield: 0.58,
    historical: [
      { date: 'Mon', price: 451.2 },
      { date: 'Tue', price: 455.0 },
      { date: 'Wed', price: 450.8 },
      { date: 'Thu', price: 456.4 },
      { date: 'Fri', price: 462.15 },
    ]
  }
];

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
            historical: [
              { date: 'Mon', price: dbItem.price * 0.98 },
              { date: 'Tue', price: dbItem.price * 1.01 },
              { date: 'Wed', price: dbItem.price * 0.99 },
              { date: 'Thu', price: dbItem.price * 1.02 },
              { date: 'Fri', price: dbItem.price },
            ]
          }
        : defaultFinanceData.find(item => item.symbol === q);

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
          const matched = defaultFinanceData.find(d => d.symbol === item.symbol);
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
            historical: matched?.historical || [
              { date: 'Mon', price: item.price * 0.98 },
              { date: 'Tue', price: item.price * 1.01 },
              { date: 'Wed', price: item.price * 0.99 },
              { date: 'Thu', price: item.price * 1.02 },
              { date: 'Fri', price: item.price },
            ]
          };
        })
      : defaultFinanceData;

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
