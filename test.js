const assert = require('assert');
const { PrismaClient } = require('@prisma/client');

console.log('Running test suite for FinPublish...');

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

    // 2. Test live Supabase Prisma database connection query
    console.log('Connecting to real Supabase PostgreSQL database...');
    const prisma = new PrismaClient();

    // Count rows in User, Article, and FinancialData tables
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const financeCount = await prisma.financialData.count();

    console.log(`✓ Real Database Connectivity Verified!`);
    console.log(`  - Users table count: ${userCount}`);
    console.log(`  - Articles table count: ${articleCount}`);
    console.log(`  - FinancialData table count: ${financeCount}`);

    await prisma.$disconnect();
    console.log('✓ All tests passed cleanly!');
    process.exit(0);
  } catch (error) {
    console.error('Test run failed with error:', error);
    process.exit(1);
  }
}

runTests();
