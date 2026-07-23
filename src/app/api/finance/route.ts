import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

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
  }
];

export async function GET() {
  try {
    const cachedData = await redis.get('finpublish:finance_data');
    if (cachedData) {
      console.log('Serving finance data from Upstash Redis Cache');
      return NextResponse.json(cachedData);
    }

    let dbData;
    try {
      dbData = await prisma.financialData.findMany();
    } catch (e) {
      console.warn('Database query failed for finance data, using local list:', e);
    }

    const finalData = dbData && dbData.length > 0
      ? dbData.map(item => {
          const matched = defaultFinanceData.find(d => d.symbol === item.symbol);
          return {
            ...item,
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

    try {
      await redis.set('finpublish:finance_data', finalData, { ex: 60 });
    } catch (redisErr) {
      console.warn('Failed to save to Redis Cache:', redisErr);
    }

    return NextResponse.json(finalData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
