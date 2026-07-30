import { SectorType, CompanyValuationInput, ValuationResult } from '../types/valuation';
import { calculateDCF } from './dcf-calculator';

/**
 * Automatically routes a stock to its appropriate valuation model based on Sector.
 */
export function calculateIntrinsicValue(sector: SectorType, input: CompanyValuationInput): ValuationResult {
  const symbol = input.symbol;
  const name = input.name;
  const price = input.price;
  const shares = input.outstandingShares;

  const g = input.growthRate ?? 0.08;
  const d = input.discountRate ?? 0.10;
  const tg = input.terminalGrowthRate ?? 0.025;

  let intrinsicValue = price * 0.5; // Default floor fallback
  let modelUsed = 'Standard 5-Year DCF Model';
  let breakdown: Record<string, any> = {};

  try {
    switch (sector) {
      case 'TECH': {
        // Tech Sector uses: 70% 5-Year DCF + 30% EV/EBITDA Multiple model
        modelUsed = 'Tech Weighted Model (70% DCF + 30% EV/EBITDA)';

        // 1. DCF fair value
        const dcfResult = calculateDCF(price, {
          freeCashFlow: input.freeCashFlow ?? (price * shares * 0.04),
          outstandingShares: shares,
          totalDebt: input.totalDebt ?? 0,
          cashAndEquivalents: input.cashAndEquivalents ?? 0,
          growthRate: g,
          discountRate: d,
          terminalGrowthRate: tg
        });
        const dcfVal = dcfResult.intrinsicValue;

        // 2. EBITDA Multiple fair value
        const ebitda = input.ebitda ?? (input.freeCashFlow ? input.freeCashFlow * 1.3 : price * shares * 0.05);
        const mult = input.evToEbitdaMultiplier ?? 15;
        const enterpriseValue = ebitda * mult;
        const cash = input.cashAndEquivalents ?? 0;
        const debt = input.totalDebt ?? 0;
        const equityValue = enterpriseValue + cash - debt;
        let multipleVal = equityValue / shares;
        if (isNaN(multipleVal) || multipleVal <= 0) multipleVal = price * 0.7;

        // Weighted Average
        intrinsicValue = (0.7 * dcfVal) + (0.3 * multipleVal);

        breakdown = {
          dcfValue: Number(dcfVal.toFixed(2)),
          multipleValue: Number(multipleVal.toFixed(2)),
          ebitdaUsed: Number(ebitda.toFixed(2)),
          multiplierUsed: mult
        };
        break;
      }

      case 'FINANCIAL': {
        // Financials use: Residual Income Model
        modelUsed = 'Residual Income Valuation Model';

        const roe = input.returnOnEquity ?? 0.12;
        const r = input.requiredReturn ?? 0.10;
        const bv = input.bookValue ?? (price * shares * 0.8); // Total Book Value

        const perShareBV = bv / shares;
        // Residual Income formula per share: IntrinsicValue = perShareBV + ( (roe - r) * perShareBV ) / r
        let resVal = perShareBV + ((roe - r) * perShareBV) / r;
        if (isNaN(resVal) || resVal <= 0) resVal = price * 0.8;

        intrinsicValue = resVal;
        breakdown = {
          bookValuePerShare: Number(perShareBV.toFixed(2)),
          returnOnEquity: roe,
          requiredReturnRate: r
        };
        break;
      }

      case 'BIOTECH': {
        // Biotech uses: rNPV (Risk-adjusted Net Present Value)
        modelUsed = 'rNPV (Risk-Adjusted Net Present Value) Model';

        const prob = input.phaseSuccessProbability ?? 0.65;
        const revenue = input.projectedRevenue ?? (price * shares * 0.15); // Peak Sales Projection

        // Discount peak sales at Year 5, then risk adjust
        const pvRevenue = revenue / Math.pow(1 + d, 5);
        const rNPV = pvRevenue * prob;
        let rNPVPerShare = rNPV / shares;

        if (isNaN(rNPVPerShare) || rNPVPerShare <= 0) rNPVPerShare = price * 0.45;

        intrinsicValue = rNPVPerShare;
        breakdown = {
          peakSalesProjected: Number(revenue.toFixed(2)),
          successProbability: prob,
          discountedPresentValue: Number(pvRevenue.toFixed(2))
        };
        break;
      }

      case 'REIT': {
        // REITs use: Net Asset Value (NAV) & Dividend Discount Model (DDM)
        modelUsed = 'REIT NAV & FFO Multiples Valuation';

        const nav = input.nav ?? price; // NAV per share
        const ffo = input.ffo ?? (price * shares * 0.08); // Funds From Operations

        // Multiples value
        let ffoMultipleVal = (ffo * 15) / shares;
        if (isNaN(ffoMultipleVal) || ffoMultipleVal <= 0) ffoMultipleVal = price * 0.9;

        // Weighted Average
        intrinsicValue = (0.6 * nav) + (0.4 * ffoMultipleVal);
        breakdown = {
          netAssetValuePerShare: Number(nav.toFixed(2)),
          ffoMultipleValue: Number(ffoMultipleVal.toFixed(2)),
          ffoUsed: Number(ffo.toFixed(2))
        };
        break;
      }

      default: {
        // Fallback: Standard DCF Model
        modelUsed = 'Standard 5-Year DCF (Fallback)';
        const dcfResult = calculateDCF(price, {
          freeCashFlow: input.freeCashFlow ?? (price * shares * 0.04),
          outstandingShares: shares,
          totalDebt: input.totalDebt ?? 0,
          cashAndEquivalents: input.cashAndEquivalents ?? 0,
          growthRate: g,
          discountRate: d,
          terminalGrowthRate: tg
        });
        intrinsicValue = dcfResult.intrinsicValue;
        breakdown = {
          freeCashFlowUsed: Number((input.freeCashFlow ?? (price * shares * 0.04)).toFixed(2))
        };
        break;
      }
    }
  } catch (error) {
    console.error('Valuation routing failed, reverting to standard fallback DCF:', error);
    // Silent Fallback
    const dcfResult = calculateDCF(price, {
      freeCashFlow: input.freeCashFlow ?? (price * shares * 0.04),
      outstandingShares: shares,
      totalDebt: input.totalDebt ?? 0,
      cashAndEquivalents: input.cashAndEquivalents ?? 0,
      growthRate: g,
      discountRate: d,
      terminalGrowthRate: tg
    });
    intrinsicValue = dcfResult.intrinsicValue;
  }

  // Margin of Safety calculation
  const marginOfSafety = ((intrinsicValue - price) / intrinsicValue) * 100;

  return {
    symbol,
    name,
    currentPrice: price,
    intrinsicValue: Number(intrinsicValue.toFixed(2)),
    marginOfSafety: Number(marginOfSafety.toFixed(2)),
    modelUsed,
    sector,
    breakdown
  };
}
