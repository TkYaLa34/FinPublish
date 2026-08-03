export const DEFAULT_STOCKS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 189.84,
    change: 2.34,
    changePercent: 1.25,
    marketCap: 2950000000000,
    peRatio: 28.4,
    dividendYield: 0.51,
    freeCashFlow: 104300000000,       // $104.3B FCF
    outstandingShares: 15400000000,   // 15.4B shares
    totalDebt: 111000000000,          // $111B debt
    cashAndEquivalents: 73000000000,  // $73B cash
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
    freeCashFlow: 4400000000,         // $4.4B FCF
    outstandingShares: 3180000000,    // 3.18B shares
    totalDebt: 3000000000,            // $3B debt
    cashAndEquivalents: 26000000000,  // $26B cash
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
    freeCashFlow: 63000000000,        // $63B FCF
    outstandingShares: 7430000000,    // 7.43B shares
    totalDebt: 106000000000,          // $106B debt
    cashAndEquivalents: 80000000000,  // $80B cash
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
    freeCashFlow: 27000000000,        // $27B FCF
    outstandingShares: 2460000000,    // 2.46B shares
    totalDebt: 11000000000,           // $11B debt
    cashAndEquivalents: 26000000000,  // $26B cash
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
    freeCashFlow: 15000000000,        // $15B FCF Proxy
    outstandingShares: 960000000,     // 960M shares Proxy
    totalDebt: 0,
    cashAndEquivalents: 4500000000,   // Cash reserve
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
    freeCashFlow: 8000000000,         // $8B FCF Proxy
    outstandingShares: 510000000,     // 510M shares Proxy
    totalDebt: 0,
    cashAndEquivalents: 2500000000,
    historical: [
      { date: 'Mon', price: 451.2 },
      { date: 'Tue', price: 455.0 },
      { date: 'Wed', price: 450.8 },
      { date: 'Thu', price: 456.4 },
      { date: 'Fri', price: 462.15 },
    ]
  }
];
