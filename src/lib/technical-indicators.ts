export interface TechnicalLevels {
  s1: number;
  s2: number;
  s3: number;
  r1: number;
  r2: number;
  r3: number;
}

/**
 * Calculates S1/S2/S3 and R1/R2/R3 using Classic Pivot Point formulas from historical trend data.
 */
export function calculateSupportResistance(currentPrice: number, historical: { date: string; price: number }[]): TechnicalLevels {
  if (!historical || historical.length < 2) {
    // Generate logical mock levels relative to the current price if historical data is limited
    return {
      s1: Number((currentPrice * 0.985).toFixed(2)),
      s2: Number((currentPrice * 0.970).toFixed(2)),
      s3: Number((currentPrice * 0.950).toFixed(2)),
      r1: Number((currentPrice * 1.015).toFixed(2)),
      r2: Number((currentPrice * 1.030).toFixed(2)),
      r3: Number((currentPrice * 1.050).toFixed(2)),
    };
  }

  const prices = historical.map(h => h.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const close = currentPrice;

  // Pivot Point (PP)
  const pp = (high + low + close) / 3;

  // Supports & Resistances
  const r1 = (2 * pp) - low;
  const s1 = (2 * pp) - high;

  const r2 = pp + (high - low);
  const s2 = pp - (high - low);

  const r3 = high + 2 * (pp - low);
  const s3 = low - 2 * (high - pp);

  return {
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
  };
}
