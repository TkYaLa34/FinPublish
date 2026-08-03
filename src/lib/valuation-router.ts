import { SectorType, CompanyValuationInput, ValuationResult } from '../types/valuation';
import { calculateDCF } from './dcf-calculator';

/**
 * Automatically routes a stock to its appropriate valuation model based on Sector.
 */
export function calculateIntrinsicValue(sector: SectorType, input: CompanyValuationInput): ValuationResult {
  const symbol = input.symbol || 'CUSTOM';
  const name = input.name || 'Custom Asset';
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
        modelUsed = 'Technology Multi-Year FCF Weighted Model';

        // Compute base FCF from multi-year FCF inputs if present
        let baseFCF = input.freeCashFlow ?? (price * shares * 0.04);
        if (input.multiYearFcf && input.multiYearFcf.length >= 3) {
          // Use the average of last years FCF to initialize FCF projection
          baseFCF = input.multiYearFcf.reduce((a, b) => a + b, 0) / input.multiYearFcf.length;
        }

        // Tech Sector uses: 70% 5-Year DCF + 30% EV/EBITDA Multiple model, adjusted by Operating Margin
        const marginMultiplier = input.operatingMargin ? (1 + input.operatingMargin) : 1.15;
        const dcfResult = calculateDCF(price, {
          freeCashFlow: baseFCF,
          outstandingShares: shares,
          totalDebt: input.totalDebt ?? 0,
          cashAndEquivalents: input.cashAndEquivalents ?? 0,
          growthRate: g,
          discountRate: d,
          terminalGrowthRate: tg
        });
        const dcfVal = dcfResult.intrinsicValue * marginMultiplier;

        const ebitda = input.ebitda ?? (baseFCF * 1.3);
        const mult = input.evToEbitdaMultiplier ?? 15;
        const enterpriseValue = ebitda * mult;
        const cash = input.cashAndEquivalents ?? 0;
        const debt = input.totalDebt ?? 0;
        const equityValue = enterpriseValue + cash - debt;
        let multipleVal = equityValue / shares;
        if (isNaN(multipleVal) || multipleVal <= 0) multipleVal = price * 0.7;

        intrinsicValue = (0.7 * dcfVal) + (0.3 * multipleVal);

        breakdown = {
          dcfValue: Number(dcfVal.toFixed(2)),
          multipleValue: Number(multipleVal.toFixed(2)),
          baseFcfUsed: Number(baseFCF.toFixed(2)),
          operatingMarginApplied: input.operatingMargin ? `${(input.operatingMargin * 100).toFixed(1)}%` : '15%'
        };
        break;
      }

      case 'SEMICONDUCTOR': {
        modelUsed = 'Semiconductor Cycle FCF & Margin Model';

        let baseFCF = input.freeCashFlow ?? (price * shares * 0.05);
        if (input.multiYearFcf && input.multiYearFcf.length >= 3) {
          baseFCF = input.multiYearFcf.reduce((a, b) => a + b, 0) / input.multiYearFcf.length;
        }

        // Semiconductor uses Gross Margin factor & CapEx penalty
        const marginFactor = input.grossMargin ? (input.grossMargin * 2) : 0.8;
        const capExPenalty = input.capEx ? (input.capEx / (price * shares)) : 0.05;

        const dcfResult = calculateDCF(price, {
          freeCashFlow: baseFCF * (1 + marginFactor - capExPenalty),
          outstandingShares: shares,
          totalDebt: input.totalDebt ?? 0,
          cashAndEquivalents: input.cashAndEquivalents ?? 0,
          growthRate: g,
          discountRate: d,
          terminalGrowthRate: tg
        });

        intrinsicValue = dcfResult.intrinsicValue;
        breakdown = {
          dcfValue: Number(dcfResult.intrinsicValue.toFixed(2)),
          grossMarginUsed: input.grossMargin ? `${(input.grossMargin * 100).toFixed(1)}%` : '40%',
          capExToCapRatio: Number(capExPenalty.toFixed(4)),
          baseFcfUsed: Number(baseFCF.toFixed(2))
        };
        break;
      }

      case 'FINANCIAL': {
        modelUsed = 'Residual Income Valuation Model';

        const roe = input.returnOnEquity ?? 0.12;
        const r = input.requiredReturn ?? 0.10;
        const bv = input.bookValue ?? (price * shares * 0.8);
        const div = input.dividendPerShare ?? 0;

        const perShareBV = bv / shares;
        // Residual Income formula per share + Dividend yield offset
        let resVal = perShareBV + ((roe - r) * perShareBV) / r + div;
        if (isNaN(resVal) || resVal <= 0) resVal = price * 0.8;

        intrinsicValue = resVal;
        breakdown = {
          bookValuePerShare: Number(perShareBV.toFixed(2)),
          returnOnEquity: roe,
          dividendCredit: div,
          requiredReturnRate: r
        };
        break;
      }

      case 'INSURANCE': {
        modelUsed = 'Insurance Embedded Value Model';

        const ev = input.embeddedValue ?? (price * shares * 0.9);
        const roe = input.returnOnEquity ?? 0.11;

        // Embedded Value + ROE future growth credit
        const perShareEV = ev / shares;
        let insVal = perShareEV * (1 + (roe - g));
        if (isNaN(insVal) || insVal <= 0) insVal = price * 0.85;

        intrinsicValue = insVal;
        breakdown = {
          embeddedValuePerShare: Number(perShareEV.toFixed(2)),
          returnOnEquityUsed: roe,
          impliedGrowthCredit: Number((roe - g).toFixed(4))
        };
        break;
      }

      case 'BIOTECH': {
        modelUsed = 'rNPV (Risk-Adjusted Net Present Value) Model';

        const prob = input.phaseSuccessProbability ?? 0.65;
        const revenue = input.projectedRevenue ?? (price * shares * 0.15);

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
        modelUsed = 'REIT NAV & FFO Multiples Valuation';

        const nav = input.nav ?? price;
        const ffo = input.affo ?? input.ffo ?? (price * shares * 0.08); // Prefer AFFO if available
        const occupancy = input.occupancyRate ?? 0.95;
        const dpu = input.distributionPerUnit ?? 0;

        let ffoMultipleVal = (ffo * 15 * occupancy) / shares;
        if (isNaN(ffoMultipleVal) || ffoMultipleVal <= 0) ffoMultipleVal = price * 0.9;

        // Weighted Average + Dividend credit
        intrinsicValue = ((0.6 * nav) + (0.4 * ffoMultipleVal)) * occupancy + dpu;
        breakdown = {
          netAssetValuePerShare: Number(nav.toFixed(2)),
          ffoMultipleValue: Number(ffoMultipleVal.toFixed(2)),
          occupancyFactor: occupancy,
          dpuIncluded: dpu
        };
        break;
      }

      case 'UTILITIES': {
        modelUsed = 'Regulated Utilities EBITDA & Leverage Model';

        const ebitda = input.ebitda ?? (price * shares * 0.10);
        const debt = input.totalDebt ?? (price * shares * 0.40);
        const capEx = input.capEx ?? (price * shares * 0.05);

        // Utilities use 10x EBITDA multiple, heavily penalizing high debt leverage
        const enterpriseValue = ebitda * 10;
        const netCapExDebtAdj = capEx - (debt * 0.05);
        const equityValue = enterpriseValue + netCapExDebtAdj;
        let utilVal = equityValue / shares;

        if (isNaN(utilVal) || utilVal <= 0) utilVal = price * 0.8;

        intrinsicValue = utilVal;
        breakdown = {
          regulatedEbitdaValue: Number((ebitda * 10).toFixed(2)),
          netDebtAndCapExOffset: Number(netCapExDebtAdj.toFixed(2)),
          debtLeverageRatio: Number((debt / (price * shares)).toFixed(2))
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
