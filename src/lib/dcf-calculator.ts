export interface DCFInputs {
  freeCashFlow: number;       // Annual Free Cash Flow in USD
  outstandingShares: number;  // Number of shares outstanding
  totalDebt: number;          // Total Debt on balance sheet in USD
  cashAndEquivalents: number; // Cash and short-term investments in USD
  growthRate?: number;        // Expected 5-year growth rate (default 8% -> 0.08)
  discountRate?: number;      // Discount rate / WACC (default 10% -> 0.10)
  terminalGrowthRate?: number; // Perpetual growth rate (default 2.5% -> 0.025)
}

export interface DCFOutputs {
  projectedFCF: number[];    // Projections for Years 1-5
  discountedFCF: number[];   // PV of Years 1-5
  terminalValue: number;      // Terminal Value at Year 5
  pvTerminalValue: number;    // PV of Terminal Value
  enterpriseValue: number;    // Enterprise Value
  equityValue: number;        // Equity Value
  intrinsicValue: number;     // Intrinsic value per share
  marginOfSafety: number;     // Margin of safety percentage
}

/**
 * Executes a 5-year Discounted Cash Flow (DCF) model calculation.
 */
export function calculateDCF(currentPrice: number, inputs: DCFInputs): DCFOutputs {
  const fcf = inputs.freeCashFlow;
  const shares = inputs.outstandingShares;
  const debt = inputs.totalDebt;
  const cash = inputs.cashAndEquivalents;

  const g = inputs.growthRate !== undefined ? inputs.growthRate : 0.08;
  const d = inputs.discountRate !== undefined ? inputs.discountRate : 0.10;
  const tg = inputs.terminalGrowthRate !== undefined ? inputs.terminalGrowthRate : 0.025;

  // Handle extreme/negative input edge cases gracefully
  const baseFCF = fcf <= 0 ? (currentPrice * shares * 0.04) : fcf; // Fallback to a proxy FCF of 4% of market cap if negative

  // 1. Project FCF for the next 5 years
  const projectedFCF: number[] = [];
  let tempFCF = baseFCF;
  for (let i = 0; i < 5; i++) {
    tempFCF = tempFCF * (1 + g);
    projectedFCF.push(tempFCF);
  }

  // 2. Discount Projected FCFs to Present Value
  const discountedFCF = projectedFCF.map((val, index) => {
    const year = index + 1;
    return val / Math.pow(1 + d, year);
  });

  const sumPVFCF = discountedFCF.reduce((sum, val) => sum + val, 0);

  // 3. Calculate Terminal Value (TV) at Year 5
  // Classic formula: TV = [FCF_5 * (1 + tg)] / (d - tg)
  const fcf5 = projectedFCF[4];
  const denominator = d - tg <= 0 ? 0.075 : d - tg; // Prevent division-by-zero or negative growth rates
  const terminalValue = (fcf5 * (1 + tg)) / denominator;

  // 4. Discount Terminal Value to Present Value
  const pvTerminalValue = terminalValue / Math.pow(1 + d, 5);

  // 5. Enterprise Value
  const enterpriseValue = sumPVFCF + pvTerminalValue;

  // 6. Equity Value
  // Equity Value = Enterprise Value + Cash - Debt
  const equityValue = enterpriseValue + cash - debt;

  // 7. Intrinsic Value per Share
  let intrinsicValue = equityValue / shares;
  if (isNaN(intrinsicValue) || intrinsicValue <= 0) {
    intrinsicValue = currentPrice * 0.5; // Resilient floor fallback
  }

  // 8. Margin of Safety (MOS)
  // MOS = ((Intrinsic Value - Current Price) / Intrinsic Value) * 100
  const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

  return {
    projectedFCF: projectedFCF.map(val => Number(val.toFixed(2))),
    discountedFCF: discountedFCF.map(val => Number(val.toFixed(2))),
    terminalValue: Number(terminalValue.toFixed(2)),
    pvTerminalValue: Number(pvTerminalValue.toFixed(2)),
    enterpriseValue: Number(enterpriseValue.toFixed(2)),
    equityValue: Number(equityValue.toFixed(2)),
    intrinsicValue: Number(intrinsicValue.toFixed(2)),
    marginOfSafety: Number(marginOfSafety.toFixed(2))
  };
}
