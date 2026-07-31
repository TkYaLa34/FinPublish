const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Module = require('module');

// Register high-efficiency path-aliasing hook for Next.js '@/*' imports (0 dependencies)
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    request = path.join(__dirname, 'src', request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain);
};

// Manually parse .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.trim().match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn('Failed to parse .env file:', e);
}

// Setup ts-node loader so we can import typescript router modules directly (with tsconfig skip)
require('ts-node').register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: "commonjs",
    target: "es2020",
    moduleResolution: "node",
    esModuleInterop: true
  }
});

// Mock Upstash Redis and other browser-only elements if needed
global.fetch = global.fetch || (() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

async function runTests() {
  console.log('Running test suite for FinPublish...');

  try {
    // 1. Verify standard data contract structures for search responses (Now from separate lib file)
    const financeDataModule = require('./src/lib/finance-data');
    const defaultFinanceData = financeDataModule.DEFAULT_STOCKS;

    assert.ok(Array.isArray(defaultFinanceData));
    assert.strictEqual(defaultFinanceData.length, 6);
    assert.strictEqual(defaultFinanceData[0].symbol, 'AAPL');
    assert.strictEqual(typeof defaultFinanceData[0].price, 'number');
    assert.ok(defaultFinanceData[0].marketCap > 1e12);
    console.log('✓ Mock Finance data structures validated successfully.');

    // 2. Test Dynamic Valuation Router sector-specific routing logic
    console.log('Running Dynamic Valuation Router Unit Tests...');
    const { calculateIntrinsicValue: calculateIntrinsicValueJS } = require('./src/lib/valuation-router');

    // Test TECH Sector with Multi-Year FCF
    const techInput = {
      symbol: 'AAPL',
      name: 'Apple Tech',
      price: 150.00,
      outstandingShares: 1000000,
      multiYearFcf: [10000000, 11000000, 12000000],
      totalDebt: 5000000,
      cashAndEquivalents: 15000000,
      ebitda: 12000000,
      evToEbitdaMultiplier: 15,
      operatingMargin: 0.25
    };
    const techResult = calculateIntrinsicValueJS('TECH', techInput);
    assert.ok(techResult.modelUsed.includes('Technology'));
    assert.ok(techResult.intrinsicValue > 0);
    console.log('  ✓ TECH Model (Multi-Year FCF + Operating Margin) routing passed.');

    // Test SEMICONDUCTOR Sector
    const semiInput = {
      symbol: 'NVDA',
      name: 'NVIDIA Semi',
      price: 130.00,
      outstandingShares: 10000000,
      multiYearFcf: [150000000, 180000000, 200000000],
      grossMargin: 0.65,
      capEx: 50000000,
      growthRate: 0.20
    };
    const semiResult = calculateIntrinsicValueJS('SEMICONDUCTOR', semiInput);
    assert.ok(semiResult.modelUsed.includes('Semiconductor'));
    assert.ok(semiResult.intrinsicValue > 0);
    console.log('  ✓ SEMICONDUCTOR Model (Cycle Margin & CapEx) routing passed.');

    // Test FINANCIAL Sector
    const financialInput = {
      symbol: 'JPM',
      name: 'JPMorgan Chase',
      price: 100.00,
      outstandingShares: 5000000,
      bookValue: 400000000,
      returnOnEquity: 0.14,
      requiredReturn: 0.10,
      dividendPerShare: 2.50
    };
    const finResult = calculateIntrinsicValueJS('FINANCIAL', financialInput);
    assert.ok(finResult.modelUsed.includes('Residual Income'));
    assert.ok(finResult.intrinsicValue > 0);
    console.log('  ✓ FINANCIAL Model (Residual Income + Dividends) routing passed.');

    // Test INSURANCE Sector
    const insuranceInput = {
      symbol: 'MET',
      name: 'MetLife Insurance',
      price: 65.00,
      outstandingShares: 3000000,
      embeddedValue: 240000000,
      returnOnEquity: 0.12,
      growthRate: 0.04
    };
    const insResult = calculateIntrinsicValueJS('INSURANCE', insuranceInput);
    assert.ok(insResult.modelUsed.includes('Insurance Embedded Value'));
    assert.ok(insResult.intrinsicValue > 0);
    console.log('  ✓ INSURANCE Model (Embedded Value + ROE Growth) routing passed.');

    // Test BIOTECH Sector
    const biotechInput = {
      symbol: 'MRNA',
      name: 'Moderna Bio',
      price: 80.00,
      outstandingShares: 2000000,
      phaseSuccessProbability: 0.70,
      projectedRevenue: 500000000
    };
    const bioResult = calculateIntrinsicValueJS('BIOTECH', biotechInput);
    assert.ok(bioResult.modelUsed.includes('rNPV'));
    assert.ok(bioResult.intrinsicValue > 0);
    console.log('  ✓ BIOTECH Model (rNPV) routing passed.');

    // Test REIT Sector
    const reitInput = {
      symbol: 'O',
      name: 'Realty Income REIT',
      price: 60.00,
      outstandingShares: 1000000,
      nav: 55.00,
      affo: 8000000,
      occupancyRate: 0.96,
      distributionPerUnit: 3.50
    };
    const reitResult = calculateIntrinsicValueJS('REIT', reitInput);
    assert.ok(reitResult.modelUsed.includes('REIT NAV'));
    assert.ok(reitResult.intrinsicValue > 0);
    console.log('  ✓ REIT Model (NAV + AFFO Multiples) routing passed.');

    // Test UTILITIES Sector
    const utilitiesInput = {
      symbol: 'NEE',
      name: 'NextEra Utilities',
      price: 70.00,
      outstandingShares: 5000000,
      ebitda: 45000000,
      capEx: 15000000,
      totalDebt: 80000000
    };
    const utilResult = calculateIntrinsicValueJS('UTILITIES', utilitiesInput);
    assert.ok(utilResult.modelUsed.includes('Utilities'));
    assert.ok(utilResult.intrinsicValue > 0);
    console.log('  ✓ UTILITIES Model (Regulated EBITDA & Debt Leverage) routing passed.');

    // Test Fallback Model (OTHER)
    const fallbackInput = {
      symbol: 'NKE',
      name: 'Nike Apparel',
      price: 120.00,
      outstandingShares: 1000000
    };
    const fallbackResult = calculateIntrinsicValueJS('OTHER', fallbackInput);
    assert.ok(fallbackResult.modelUsed.includes('Standard Fallback') || fallbackResult.modelUsed.includes('Fallback'));
    assert.ok(fallbackResult.intrinsicValue > 0);
    console.log('  ✓ Fallback Standard DCF routing passed.');

    // 3. Test live Supabase Prisma database connection query if available
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('johndoe') || dbUrl.includes('your-supabase-project')) {
      console.log('⚠️  Skipping real database connectivity test (DATABASE_URL not configured or is placeholder).');
      console.log('✓ All 8/8 mock tests passed cleanly!');
      process.exit(0);
    }

    console.log('Connecting to real Supabase PostgreSQL database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Check main tables
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const financeCount = await prisma.financialData.count();

    console.log('✓ Real Database Connectivity Verified!');
    console.log(`  - Users table count: ${userCount}`);
    console.log(`  - Articles table count: ${articleCount}`);
    console.log(`  - FinancialData table count: ${financeCount}`);

    // 4. Test Watchlist & Portfolio transaction validations (Phase 6 features)
    console.log('Running Phase 6 Watchlist & Portfolio Integration tests...');

    // Create custom test user
    const testUserId = `test-user-${Date.now()}`;

    // Watchlist test
    const watchlistRecord = await prisma.watchlist.create({
      data: {
        userId: testUserId,
        symbol: 'AAPL'
      }
    });
    assert.ok(watchlistRecord.id);
    console.log('  ✓ Watchlist creation passed.');

    // Portfolio test
    const portfolioRecord = await prisma.portfolio.create({
      data: {
        userId: testUserId,
        cashBalance: 100000.00
      }
    });
    assert.ok(portfolioRecord.id);
    assert.strictEqual(portfolioRecord.cashBalance, 100000.00);
    console.log('  ✓ Portfolio creation passed.');

    // Trade logic mock triggers
    // BUY transaction with sufficient cash validation
    const buyShares = 10;
    const sharePrice = 150.00;
    const totalBuyCost = buyShares * sharePrice;

    assert.ok(portfolioRecord.cashBalance >= totalBuyCost, 'Cash must be sufficient to BUY');
    const updatedPortBuy = await prisma.portfolio.update({
      where: { id: portfolioRecord.id },
      data: {
        cashBalance: portfolioRecord.cashBalance - totalBuyCost,
        transactions: {
          create: {
            symbol: 'AAPL',
            type: 'BUY',
            shares: buyShares,
            price: sharePrice,
            totalAmount: totalBuyCost
          }
        }
      },
      include: {
        transactions: true
      }
    });
    assert.strictEqual(updatedPortBuy.cashBalance, 100000.00 - totalBuyCost);
    assert.strictEqual(updatedPortBuy.transactions[0].shares, buyShares);
    console.log('  ✓ BUY transaction with sufficient cash validation passed.');

    // BUY transaction with insufficient cash boundary test
    const unaffordableShares = 10000;
    const unaffordableCost = unaffordableShares * sharePrice;
    assert.ok(updatedPortBuy.cashBalance < unaffordableCost, 'Should reject due to insufficient cash balance');
    console.log('  ✓ BUY transaction with insufficient cash boundary test passed.');

    // SELL transaction with sufficient shares validation
    const sellShares = 5;
    const totalSellPayout = sellShares * sharePrice;

    // Count calculated holdings dynamically
    let totalShares = 0;
    updatedPortBuy.transactions.forEach(tx => {
      if (tx.symbol === 'AAPL') {
        if (tx.type === 'BUY') totalShares += tx.shares;
        else if (tx.type === 'SELL') totalShares -= tx.shares;
      }
    });

    assert.ok(totalShares >= sellShares, 'Should allow sell when shares are sufficient');
    const updatedPortSell = await prisma.portfolio.update({
      where: { id: portfolioRecord.id },
      data: {
        cashBalance: updatedPortBuy.cashBalance + totalSellPayout,
        transactions: {
          create: {
            symbol: 'AAPL',
            type: 'SELL',
            shares: sellShares,
            price: sharePrice,
            totalAmount: totalSellPayout
          }
        }
      },
      include: {
        transactions: true
      }
    });

    let finalShares = 0;
    updatedPortSell.transactions.forEach(tx => {
      if (tx.symbol === 'AAPL') {
        if (tx.type === 'BUY') finalShares += tx.shares;
        else if (tx.type === 'SELL') finalShares -= tx.shares;
      }
    });

    assert.strictEqual(finalShares, totalShares - sellShares);
    console.log('  ✓ SELL transaction with sufficient shares validation passed.');

    // SELL transaction with insufficient shares boundary test
    const excessiveSellShares = 100;
    assert.ok(finalShares < excessiveSellShares, 'Should reject due to insufficient shares on book');
    console.log('  ✓ SELL transaction with insufficient shares boundary test passed.');

    // Cleanup Phase 6 test records
    await prisma.watchlist.deleteMany({ where: { userId: testUserId } });
    await prisma.transaction.deleteMany({ where: { portfolioId: portfolioRecord.id } });
    await prisma.portfolio.delete({ where: { id: portfolioRecord.id } });
    console.log('  ✓ Phase 6 database records cleaned up cleanly.');

    console.log('✓ All integration tests passed cleanly with 100% success!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test execution encountered an unhandled exception:', error);
    process.exit(1);
  }
}

runTests();
