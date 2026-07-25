import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Tests basic database connection and counts the users table.
 */
export async function testDbConnection() {
  try {
    const userCount = await prisma.user.count();
    console.log(`[Database Connection] SUCCESS: Connected to Supabase PostgreSQL! User count: ${userCount}`);
    return { success: true, userCount };
  } catch (_error) {
    console.error('[Database Connection] ERROR: Failed to query Supabase PostgreSQL database:', _error);
    return { success: false, error: _error };
  }
}
