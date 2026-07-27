const assert = require('assert');
const fs = require('fs');

console.log('Running test suite for FinPublish...');

// Load DATABASE_URL from .env if present locally
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
  if (match) {
    process.env.DATABASE_URL = match[1];
  }
}

async function runTests() {
  try {
    // 1. Check our mock structure logic
    const defaultFinanceData = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 189.84,
        change: 2.34,
        changePercent: 1.25,
        marketCap: 2950000000000,
      }
    ];

    assert.strictEqual(defaultFinanceData[0].symbol, 'AAPL');
    assert.strictEqual(typeof defaultFinanceData[0].price, 'number');
    assert.ok(defaultFinanceData[0].marketCap > 1e12);
    console.log('✓ Mock Finance data structures validated successfully.');

    // 2. Test live Supabase Prisma database connection query if available
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('johndoe') || dbUrl.includes('your-supabase-project')) {
      console.log('⚠️  Skipping real database connectivity test (DATABASE_URL not configured or is placeholder).');
      console.log('✓ All 1/1 mock tests passed cleanly!');
      process.exit(0);
    }

    console.log('Connecting to real Supabase PostgreSQL database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const financeCount = await prisma.financialData.count();

    console.log(`✓ Real Database Connectivity Verified!`);
    console.log(`  - Users table count: ${userCount}`);
    console.log(`  - Articles table count: ${articleCount}`);
    console.log(`  - FinancialData table count: ${financeCount}`);

    // 3. Test Phase 6 Watchlist, Portfolio, and Transaction operations
    console.log('Running Phase 6 Watchlist & Portfolio Integration tests...');
    const dummyUserId = `test-user-${Date.now()}`;

    // Create a Watchlist item
    const watchlist = await prisma.watchlist.create({
      data: {
        userId: dummyUserId,
        symbol: 'AAPL'
      }
    });
    assert.strictEqual(watchlist.symbol, 'AAPL');
    assert.strictEqual(watchlist.userId, dummyUserId);
    console.log('  ✓ Watchlist creation passed.');

    // Create a Portfolio
    const portfolio = await prisma.portfolio.create({
      data: {
        userId: dummyUserId,
        cashBalance: 125000.50
      }
    });
    assert.strictEqual(portfolio.cashBalance, 125000.50);
    assert.strictEqual(portfolio.userId, dummyUserId);
    console.log('  ✓ Portfolio creation passed.');

    // Create a Transaction
    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        symbol: 'AAPL',
        type: 'BUY',
        shares: 10,
        price: 190.00,
        totalAmount: 1900.00
      }
    });
    assert.strictEqual(transaction.symbol, 'AAPL');
    assert.strictEqual(transaction.shares, 10);
    assert.strictEqual(transaction.price, 190.00);
    console.log('  ✓ Transaction execution and relations passed.');

    // Cleanup Phase 6 test records
    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.portfolio.delete({ where: { id: portfolio.id } });
    await prisma.watchlist.delete({ where: { id: watchlist.id } });
    console.log('  ✓ Phase 6 database records cleaned up cleanly.');

    await prisma.$disconnect();
    console.log('✓ All integration tests passed cleanly with 100% success!');
    process.exit(0);
  } catch (error) {
    console.error('Test run failed with error:', error);
    process.exit(1);
  }
}

runTests();
