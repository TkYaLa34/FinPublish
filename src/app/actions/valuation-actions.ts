"use server";

import { prisma } from '@/lib/prisma';
import { SectorType } from '@/types/valuation';

interface SaveValuationPayload {
  userId: string;
  symbol: string;
  name: string;
  sector: SectorType;
  currentPrice: number;
  intrinsicValue: number;
  marginOfSafety: number;
  modelUsed: string;
  breakdown: Record<string, any>;
}

// In-memory fallback for local development or if database table hasn't been migrated
let mockValuationsCache: Array<SaveValuationPayload & { id: string; createdAt: string }> = [];

export async function saveCustomValuation(payload: SaveValuationPayload) {
  try {
    const valuation = await prisma.customValuation.create({
      data: {
        userId: payload.userId,
        symbol: payload.symbol,
        name: payload.name,
        sector: payload.sector,
        currentPrice: payload.currentPrice,
        intrinsicValue: payload.intrinsicValue,
        marginOfSafety: payload.marginOfSafety,
        modelUsed: payload.modelUsed,
        breakdown: payload.breakdown
      }
    });

    return { success: true, id: valuation.id, data: valuation };
  } catch (err: any) {
    console.warn('Database save failed for custom valuation, using in-memory fallback:', err.message);

    const mockRecord = {
      id: `mock-val-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload
    };

    mockValuationsCache.push(mockRecord);
    return { success: true, id: mockRecord.id, data: mockRecord };
  }
}

export async function getCustomValuations(userId: string) {
  try {
    const list = await prisma.customValuation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, list };
  } catch (err: any) {
    console.warn('Database findMany failed for custom valuations, retrieving from in-memory fallback:', err.message);
    const list = mockValuationsCache.filter(item => item.userId === userId);
    return { success: true, list };
  }
}
