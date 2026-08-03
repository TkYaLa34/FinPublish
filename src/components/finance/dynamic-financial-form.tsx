"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SectorType, CompanyValuationInput, ValuationResult } from '@/types/valuation';
import { calculateIntrinsicValue } from '@/lib/valuation-router';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from './dashboard-ui';
import { ValuationBadge } from './valuation-badge';
import { ConfidenceIndicator } from './confidence-indicator';
import { Calculator, HelpCircle, ArrowUpRight, ArrowDownRight, CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react';

// ============================================================================
// CONFIGURATION-DRIVEN SCHEMA DEFINITIONS (SECTION 1 & 2) - FULLY LOCALIZED
// ============================================================================

export interface FormFieldSchema {
  name: keyof CompanyValuationInput;
  label: string;
  type: 'number' | 'percentage' | 'currency' | 'multiyear';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  description: string;
  required?: boolean;
}

export interface ValuationModelConfig {
  id: string;
  name: string;
  fields: FormFieldSchema[];
}

export interface SubSectorConfig {
  id: string;
  name: string;
  modelId: string;
}

export interface SectorConfig {
  id: SectorType;
  name: string;
  subSectors: SubSectorConfig[];
}

export const SECTORS: SectorConfig[] = [
  {
    id: 'TECH',
    name: 'เทคโนโลยี (Technology)',
    subSectors: [
      { id: 'tech_software', name: 'ซอฟต์แวร์ และ คลาวด์เซอร์วิส', modelId: 'tech_multi_year' },
      { id: 'tech_internet', name: 'แพลตฟอร์มอินเทอร์เน็ต', modelId: 'tech_multi_year' },
    ]
  },
  {
    id: 'SEMICONDUCTOR',
    name: 'เซมิคอนดักเตอร์ (Semiconductor)',
    subSectors: [
      { id: 'semi_foundry', name: 'โรงงานผลิตชิป และการประกอบ (Foundry)', modelId: 'semi_multi_year' },
      { id: 'semi_design', name: 'ผู้ออกแบบชิป (Fabless)', modelId: 'semi_multi_year' },
    ]
  },
  {
    id: 'FINANCIAL',
    name: 'บริการทางการเงิน และธนาคาร (Financials)',
    subSectors: [
      { id: 'fin_banking', name: 'ธนาคารพาณิชย์', modelId: 'financial_bank' },
      { id: 'fin_assets', name: 'บริษัทหลักทรัพย์จัดการกองทุน', modelId: 'financial_bank' },
    ]
  },
  {
    id: 'INSURANCE',
    name: 'ประกันภัย (Insurance)',
    subSectors: [
      { id: 'ins_life', name: 'ประกันชีวิต และบำนาญ', modelId: 'insurance_ev' },
      { id: 'ins_pnc', name: 'ประกันวินาศภัย', modelId: 'insurance_ev' },
    ]
  },
  {
    id: 'REIT',
    name: 'กองทรัสต์เพื่อการลงทุนในอสังหาริมทรัพย์ (REIT)',
    subSectors: [
      { id: 'reit_residential', name: 'อสังหาริมทรัพย์เพื่อการอยู่อาศัย', modelId: 'reit_advanced' },
      { id: 'reit_commercial', name: 'อสังหาริมทรัพย์เพื่อการพาณิชย์ และสำนักงาน', modelId: 'reit_advanced' },
    ]
  },
  {
    id: 'UTILITIES',
    name: 'สาธารณูปโภค (Utilities)',
    subSectors: [
      { id: 'util_power', name: 'โรงไฟฟ้า และการส่งจ่ายพลังงาน', modelId: 'utilities_regulated' },
      { id: 'util_water', name: 'การประปา และระบบการจัดการน้ำ', modelId: 'utilities_regulated' },
    ]
  },
  {
    id: 'OTHER',
    name: 'กลุ่มอุตสาหกรรมอื่นๆ',
    subSectors: [
      { id: 'other_retail', name: 'ค้าปลีก และสินค้าอุปโภคบริโภค', modelId: 'other_generic' },
      { id: 'other_mfg', name: 'โรงงานอุตสาหกรรม และการผลิต', modelId: 'other_generic' },
    ]
  }
];

export const VALUATION_MODELS: Record<string, ValuationModelConfig> = {
  tech_multi_year: {
    id: 'tech_multi_year',
    name: 'Technology Multi-Year FCF & Operating Margin Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 150, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 10000000, min: 1000, required: true, description: 'จำนวนหุ้นจดทะเบียนทั้งหมดที่ถือโดยผู้ถือหุ้น' },
      { name: 'multiYearFcf', label: 'กระแสเงินสดอิสระย้อนหลังรายปี ($)', type: 'multiyear', defaultValue: [75000000, 85000000, 98000000], required: true, description: 'ประวัติกระแสเงินสดอิสระ (ต้องการข้อมูลอย่างน้อย 3 ปีย้อนหลัง)' },
      { name: 'growthRate', label: 'อัตราการเติบโตของรายได้ (Revenue Growth Rate)', type: 'percentage', defaultValue: 0.12, min: -0.2, max: 1.0, required: true, description: 'อัตราการเติบโตของรายได้ที่คาดการณ์แบบทบต้น' },
      { name: 'operatingMargin', label: 'อัตรากำไรจากการดำเนินงาน (Operating Margin %)', type: 'percentage', defaultValue: 0.22, min: 0.0, max: 0.95, required: true, description: 'สัดส่วนกำไรจากการดำเนินงาน (EBIT) เทียบกับรายได้รวม' },
      { name: 'terminalGrowthRate', label: 'Terminal Growth Rate', type: 'percentage', defaultValue: 0.025, min: 0.0, max: 0.08, required: true, description: 'อัตราการเติบโตของธุรกิจไปสู่อนาคตอย่างไม่มีที่สิ้นสุด' },
      { name: 'discountRate', label: 'Discount Rate / WACC', type: 'percentage', defaultValue: 0.09, min: 0.02, max: 0.4, required: true, description: 'อัตราผลตอบแทนขั้นต่ำที่ผู้ลงทุนต้องการ / ต้นทุนเฉลี่ยของเงินทุน' }
    ]
  },
  semi_multi_year: {
    id: 'semi_multi_year',
    name: 'Semiconductor Cyclical Gross Margin & CapEx Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 120, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 8000000, min: 1000, required: true, description: 'จำนวนหุ้นจดทะเบียนทั้งหมด' },
      { name: 'multiYearFcf', label: 'กระแสเงินสดอิสระย้อนหลังรายปี ($)', type: 'multiyear', defaultValue: [120000000, 140000000, 95000000], required: true, description: 'กระแสเงินสดสะท้อนตามรอบวัฏจักรเซมิคอนดักเตอร์' },
      { name: 'grossMargin', label: 'grossMargin (%)', type: 'percentage', defaultValue: 0.52, min: 0.05, max: 0.95, required: true, description: 'Hardware fabrication and packaging gross profitability margin.' },
      { name: 'capEx', label: 'Capital Expenditures (CapEx) ($)', type: 'currency', defaultValue: 45000000, required: true, description: 'เงินทุนในการจัดหาห้องคลีนรูมและเครื่องจักรผลิตชิปขั้นสูง (Lithography)' },
      { name: 'growthRate', label: 'Semiconductor Revenue Growth', type: 'percentage', defaultValue: 0.15, min: -0.5, max: 1.5, required: true, description: 'Forecasted cyclic revenue growth rate.' },
      { name: 'terminalGrowthRate', label: 'Terminal Growth Rate', type: 'percentage', defaultValue: 0.025, min: 0.0, max: 0.08, required: true, description: 'Perpetual growth factor.' },
      { name: 'discountRate', label: 'Discount Rate / WACC', type: 'percentage', defaultValue: 0.10, min: 0.02, max: 0.4, required: true, description: 'The required rate of return multiplier.' }
    ]
  },
  financial_bank: {
    id: 'financial_bank',
    name: 'Commercial Bank Book Value & Residual Income Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 45, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 5000000, min: 1000, required: true, description: 'Outstanding share volume.' },
      { name: 'bookValue', label: 'Book Value ($)', type: 'currency', defaultValue: 250000000, required: true, description: 'Total common equity / net book value on the balance sheet.' },
      { name: 'returnOnEquity', label: 'Return on Equity (ROE)', type: 'percentage', defaultValue: 0.13, min: -0.5, max: 1.0, required: true, description: 'Net income divided by common book equity.' },
      { name: 'dividendPerShare', label: 'Dividend Per Share ($)', type: 'currency', defaultValue: 1.80, description: 'Total annualized dividend payout per common share.' },
      { name: 'requiredReturn', label: 'Cost of Equity / Required Return', type: 'percentage', defaultValue: 0.10, min: 0.02, max: 0.4, required: true, description: 'Minimum expected rate of return for equity investors.' },
      { name: 'growthRate', label: 'Expected Growth Rate', type: 'percentage', defaultValue: 0.04, min: -0.1, max: 0.15, description: 'Perpetual growth of the bank residual income asset base.' }
    ]
  },
  insurance_ev: {
    id: 'insurance_ev',
    name: 'Insurance Embedded Value Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 60, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 4000000, min: 1000, required: true, description: 'Outstanding share volume.' },
      { name: 'embeddedValue', label: 'Embedded Value (EV) ($)', type: 'currency', defaultValue: 280000000, required: true, description: 'Net asset value of the insurance operations plus present value of active in-force business.' },
      { name: 'returnOnEquity', label: 'Return on Equity (ROE)', type: 'percentage', defaultValue: 0.12, min: -0.2, max: 0.8, required: true, description: 'Operating return on capital.' },
      { name: 'dividendPerShare', label: 'Dividend Payout ($)', type: 'currency', defaultValue: 1.50, description: 'Annualized dividend stream.' },
      { name: 'growthRate', label: 'Growth Rate', type: 'percentage', defaultValue: 0.035, min: -0.05, max: 0.12, description: 'The long-term growth rate of life/annuity portfolios.' }
    ]
  },
  reit_advanced: {
    id: 'reit_advanced',
    name: 'REIT Net Asset Value & AFFO Multiple Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 80, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 15000000, min: 1000, required: true, description: 'Total shares outstanding.' },
      { name: 'nav', label: 'Net Asset Value (NAV) Per Share ($)', type: 'currency', defaultValue: 85, required: true, description: 'Calculated fair asset value of properties minus liabilities per share.' },
      { name: 'occupancyRate', label: 'Occupancy Rate (%)', type: 'percentage', defaultValue: 0.94, min: 0.4, max: 1.0, required: true, description: 'Percentage of leased real-estate space across portfolios.' },
      { name: 'affo', label: 'Adjusted Funds From Operations (AFFO) ($)', type: 'currency', defaultValue: 120000000, required: true, description: 'Cash FFO adjusted for capital lease maintenance and recurring tenant improvements.' },
      { name: 'distributionPerUnit', label: 'Distribution Per Unit (DPU) ($)', type: 'currency', defaultValue: 4.20, description: 'Annualized dividend distribution per REIT share.' },
      { name: 'growthRate', label: 'Expected Growth Rate', type: 'percentage', defaultValue: 0.03, min: -0.05, max: 0.12, description: 'Long term compound growth of rent agreements.' }
    ]
  },
  utilities_regulated: {
    id: 'utilities_regulated',
    name: 'Regulated Utilities EBITDA & CapEx Blueprint',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 55, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 12000000, min: 1000, required: true, description: 'Outstanding share volume.' },
      { name: 'ebitda', label: 'Utility EBITDA ($)', type: 'currency', defaultValue: 180000000, required: true, description: 'Regulated utility earnings before interest, tax, and depreciation.' },
      { name: 'capEx', label: 'Infrastructure CapEx ($)', type: 'currency', defaultValue: 65000000, required: true, description: 'Reinvestment in utility grids and pipeline assets.' },
      { name: 'totalDebt', label: 'Utility Debt Liabilities ($)', type: 'currency', defaultValue: 450000000, required: true, description: 'Total outstanding utilities bonds and liabilities.' },
      { name: 'growthRate', label: 'Regulated Assets Growth Rate', type: 'percentage', defaultValue: 0.025, min: -0.05, max: 0.10, description: 'Regulated tariff growth factor.' }
    ]
  },
  other_generic: {
    id: 'other_generic',
    name: 'Other Sectors DCF Blueprint with Custom Fields',
    fields: [
      { name: 'price', label: 'ราคาหุ้นปัจจุบัน ($)', type: 'currency', defaultValue: 50, min: 0.1, required: true, description: 'ราคาซื้อขายปัจจุบันในตลาดต่อหนึ่งหุ้น' },
      { name: 'outstandingShares', label: 'จำนวนหุ้นทั้งหมด (Outstanding Shares)', type: 'number', defaultValue: 10000000, min: 1000, required: true, description: 'Outstanding shares.' },
      { name: 'freeCashFlow', label: 'Base Year Free Cash Flow ($)', type: 'currency', defaultValue: 40000000, required: true, description: 'Operating cash flow minus CapEx.' },
      { name: 'growthRate', label: 'Annual Growth Rate', type: 'percentage', defaultValue: 0.07, min: -0.2, max: 1.0, required: true, description: 'Annual compound growth rate.' },
      { name: 'terminalGrowthRate', label: 'Terminal Growth Rate', type: 'percentage', defaultValue: 0.02, min: 0.0, max: 0.08, required: true, description: 'Growth into infinity.' },
      { name: 'discountRate', label: 'Discount Rate / WACC', type: 'percentage', defaultValue: 0.10, min: 0.02, max: 0.4, required: true, description: 'Cost of capital.' }
    ]
  }
};

// ============================================================================
// REUSABLE TYPED INPUT COMPONENTS (SECTION 3) - THAI TEXT
// ============================================================================

interface BaseInputProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  description: string;
  required?: boolean;
}

export const FinancialInput = React.memo(({ label, value, onChange, error, description, required }: BaseInputProps) => (
  <div className="space-y-1.5 flex flex-col w-full">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
        <div className="group relative ml-1 inline-flex items-center justify-center cursor-help">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 font-normal leading-normal whitespace-normal">
            {description}
          </span>
        </div>
      </span>
      {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
        onChange(val);
      }}
      className={`w-full px-3 py-2 border rounded-md outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 dark:focus:border-indigo-400 ${
        error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700'
      }`}
    />
  </div>
));
FinancialInput.displayName = 'FinancialInput';

export const PercentageInput = React.memo(({ label, value, onChange, error, description, required }: BaseInputProps) => {
  const displayVal = typeof value === 'number' ? Math.round(value * 1000) / 10 : 0;

  return (
    <div className="space-y-1.5 flex flex-col w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
          {label}
          {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
          <div className="group relative ml-1 inline-flex items-center justify-center cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 font-normal leading-normal whitespace-normal">
              {description}
            </span>
          </div>
        </span>
        <div className="flex items-center space-x-2">
          {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{displayVal}%</span>
        </div>
      </div>
      <div className="flex items-center space-x-3 h-9">
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={typeof value === 'number' ? value : 0.10}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
        />
      </div>
    </div>
  );
});
PercentageInput.displayName = 'PercentageInput';

interface MultiYearProps {
  label: string;
  value: number[];
  onChange: (val: number[]) => void;
  error?: string;
  description: string;
}

export const MultiYearListInput = React.memo(({ label, value = [], onChange, error, description }: MultiYearProps) => {
  const [newValStr, setNewValStr] = useState('');

  const handleAdd = () => {
    const val = parseFloat(newValStr);
    if (!isNaN(val) && val > 0) {
      onChange([...value, val]);
      setNewValStr('');
    }
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3 flex flex-col w-full bg-slate-50/50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
          {label}
          <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
          <div className="group relative ml-1 inline-flex items-center justify-center cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 font-normal leading-normal whitespace-normal">
              {description}
            </span>
          </div>
        </span>
        {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
      </div>

      {/* Inputs Dynamic Years List */}
      <div className="flex flex-wrap gap-2">
        {value.map((fcf, idx) => (
          <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold rounded-md shadow-sm">
            <span>ปีที่ {idx + 1}: ${fcf.toLocaleString()}</span>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="ลบปีนี้ออก"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="number"
          placeholder="ระบุตัวเลข เช่น 95000000"
          value={newValStr}
          onChange={(e) => setNewValStr(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-md outline-none focus:border-indigo-500"
        />
        <Button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มมูลค่าของปีถัดไป</span>
        </Button>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">กรุณาเรียงลำดับกระแสเงินสดตามปีประวัติศาสตร์อย่างถูกต้อง (ต้องการข้อมูลอย่างน้อย 3 ปี)</p>
    </div>
  );
});
MultiYearListInput.displayName = 'MultiYearListInput';

// ============================================================================
// VALUE FORMATTING HEURISTIC FOR BREAKDOWN VALUES (USER REQUEST)
// ============================================================================
const formatBreakdownValue = (key: string, value: any): string => {
  if (typeof value !== 'number') return String(value);

  const keyLower = key.toLowerCase();

  // Format multipliers/ratios with 'x' suffix instead of '$' (User Request)
  if (keyLower.includes('multiplier') || keyLower.includes('multiple') || keyLower.includes('ratio')) {
    return `${value.toLocaleString()}x`;
  }

  // Format rates, probabilities, and margins as percentages
  if (keyLower.includes('rate') || keyLower.includes('margin') || keyLower.includes('probability') || keyLower.includes('percent') || (value > 0 && value < 1)) {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Format monetary values
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ============================================================================
// MAIN COMPONENT (SECTIONS 4, 5, 6, 7, 8, 9) - THAI TERMINOLOGY
// ============================================================================

export const DynamicFinancialForm = () => {
  // Selector States
  const [selectedSectorId, setSelectedSectorId] = useState<SectorType>('TECH');
  const [selectedSubSectorId, setSelectedSubSectorId] = useState<string>('tech_software');
  const [selectedModelId, setSelectedModelId] = useState<string>('tech_multi_year');

  const activeSector = useMemo(() => {
    return SECTORS.find(s => s.id === selectedSectorId) || SECTORS[0];
  }, [selectedSectorId]);

  const activeSubSector = useMemo(() => {
    return activeSector.subSectors.find(ss => ss.id === selectedSubSectorId) || activeSector.subSectors[0];
  }, [activeSector, selectedSubSectorId]);

  const activeModel = useMemo(() => {
    return VALUATION_MODELS[selectedModelId] || VALUATION_MODELS['tech_multi_year'];
  }, [selectedModelId]);

  // Form Field Value States
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  // Form Field Validation Error States (Section 4)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // HIGH-PERFORMANCE NON-CASCADE STATE SYNC: Single state changes instead ofchained useEffect hooks (Section 8)
  const handleSectorChange = useCallback((sectorId: SectorType) => {
    setSelectedSectorId(sectorId);
    const sectorConfig = SECTORS.find(s => s.id === sectorId) || SECTORS[0];
    const subSectorConfig = sectorConfig.subSectors[0];
    setSelectedSubSectorId(subSectorConfig.id);
    setSelectedModelId(subSectorConfig.modelId);
  }, []);

  const handleSubSectorChange = useCallback((subSectorId: string) => {
    setSelectedSubSectorId(subSectorId);
    const subSectorConfig = activeSector.subSectors.find(ss => ss.id === subSectorId);
    if (subSectorConfig) {
      setSelectedModelId(subSectorConfig.modelId);
    }
  }, [activeSector]);

  // Load configuration-driven default values while preserving unrelated values once per model swap (Section 6)
  useEffect(() => {
    setFormInputs(prev => {
      const updatedInputs = { ...prev };
      activeModel.fields.forEach(field => {
        if (updatedInputs[field.name as string] === undefined) {
          updatedInputs[field.name as string] = field.defaultValue;
        }
      });
      return updatedInputs;
    });
    setFormErrors({});
  }, [selectedModelId]);

  // Real-time Validation Engine (Section 4) - THAI MESSAGES
  const validateField = useCallback((name: string, value: any, schema: FormFieldSchema): string => {
    if (schema.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
      return `กรุณากรอกข้อมูลในช่อง "${schema.label}" (จำเป็นต้องกรอก)`;
    }

    if (schema.type === 'multiyear') {
      if (!Array.isArray(value) || value.length < 3) {
        return 'จำเป็นต้องระบุกระแสเงินสดอิสระรายปีย้อนหลังอย่างน้อย 3 ปี เพื่อให้ได้ข้อมูลที่ครบวัฏจักร';
      }
    }

    if (schema.type === 'percentage') {
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        return 'อัตราส่วนหรืออัตราร้อยละต้องมีค่าอยู่ระหว่าง 0% ถึง 100% เท่านั้น';
      }
    }

    if (schema.type === 'currency' || schema.type === 'number') {
      if (typeof value === 'number' && value < 0) {
        return 'ข้อมูลตัวเลขต้องมีค่ามากกว่าศูนย์หรือเป็นจำนวนบวกเท่านั้น';
      }
      if (schema.min !== undefined && typeof value === 'number' && value < schema.min) {
        return `ค่าของข้อมูล "${schema.label}" ต้องมีค่าไม่ต่ำกว่า ${schema.min}`;
      }
    }

    return '';
  }, []);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormInputs(prev => ({
      ...prev,
      [name]: value
    }));

    const schema = activeModel.fields.find(f => f.name === name);
    if (schema) {
      const err = validateField(name, value, schema);
      setFormErrors(prev => ({
        ...prev,
        [name]: err
      }));
    }
  }, [activeModel, validateField]);

  // Determine if form state passes all required field validations (Section 7)
  const isFormValid = useMemo(() => {
    // Check if any schema field has errors
    const hasFieldErrors = activeModel.fields.some(field => {
      const val = formInputs[field.name as string];
      const err = validateField(field.name as string, val, field);
      return err !== '';
    });
    return !hasFieldErrors;
  }, [activeModel, formInputs, validateField]);

  // Dynamic Valuation Router Integration (Section 7)
  const valuationResult = useMemo<ValuationResult | null>(() => {
    if (!isFormValid) return null;

    const payload: CompanyValuationInput = {
      symbol: 'CUSTOM',
      name: `Custom ${activeSector.name} Project`,
      price: formInputs['price'] ?? 100,
      outstandingShares: formInputs['outstandingShares'] ?? 1000000,
      growthRate: formInputs['growthRate'],
      discountRate: formInputs['discountRate'],
      terminalGrowthRate: formInputs['terminalGrowthRate'],
      freeCashFlow: formInputs['freeCashFlow'],
      totalDebt: formInputs['totalDebt'],
      cashAndEquivalents: formInputs['cashAndEquivalents'],
      ebitda: formInputs['ebitda'],
      evToEbitdaMultiplier: formInputs['evToEbitdaMultiplier'],
      bookValue: formInputs['bookValue'],
      returnOnEquity: formInputs['returnOnEquity'],
      requiredReturn: formInputs['requiredReturn'],
      dividendPerShare: formInputs['dividendPerShare'],
      embeddedValue: formInputs['embeddedValue'],
      nav: formInputs['nav'],
      occupancyRate: formInputs['occupancyRate'],
      affo: formInputs['affo'],
      distributionPerUnit: formInputs['distributionPerUnit'],
      capEx: formInputs['capEx'],
      operatingMargin: formInputs['operatingMargin'],
      grossMargin: formInputs['grossMargin'],
      multiYearFcf: formInputs['multiYearFcf']
    };

    return calculateIntrinsicValue(selectedSectorId, payload);
  }, [formInputs, selectedSectorId, isFormValid, activeSector]);

  // Calculate dynamic evaluation confidence score based on data density
  const confidenceScore = useMemo(() => {
    if (selectedSectorId === 'TECH' || selectedSectorId === 'SEMICONDUCTOR') {
      const fcfList = formInputs['multiYearFcf'] || [];
      if (fcfList.length >= 5) return 95;
      if (fcfList.length >= 4) return 85;
      return 75;
    }
    if (selectedSectorId === 'BIOTECH') {
      const prob = formInputs['phaseSuccessProbability'] ?? 0.65;
      return Math.round(prob * 100);
    }
    if (selectedSectorId === 'REIT') {
      const occ = formInputs['occupancyRate'] ?? 0.95;
      return Math.round(occ * 100);
    }
    return 85; // High fallback for standard utilities/banking book models
  }, [formInputs, selectedSectorId]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors"
          role="form"
          aria-label="Sector-Specific Valuation form">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>ศูนย์วิเคราะห์ประเมินมูลค่าตามรายกลุ่มอุตสาหกรรม (Multi-Sector Valuation Lab)</span>
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          คำนวณมูลค่าหุ้นโดยใช้โมเดลเฉพาะเจาะจงที่ถูกออกแบบตามอุตสาหกรรมเป้าหมาย เช่น อสังหาริมทรัพย์, ประกันภัย, ซอฟต์แวร์ และธนาคารพาณิชย์
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Step 1: Sector / SubSector Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-850 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">กลุ่มอุตสาหกรรมเป้าหมาย</label>
            <select
              value={selectedSectorId}
              onChange={(e) => handleSectorChange(e.target.value as SectorType)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-md outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            >
              {SECTORS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">กลุ่มย่อยอุตสาหกรรม</label>
            <select
              value={selectedSubSectorId}
              onChange={(e) => handleSubSectorChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-md outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            >
              {activeSector.subSectors.map(ss => (
                <option key={ss.id} value={ss.id}>{ss.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">โมเดลประเมินมูลค่าที่เลือกใช้</label>
            <div className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeModel.name}
            </div>
          </div>
        </div>

        {/* Step 2: Dynamically Render Valid Fields Only (Section 2 & 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {activeModel.fields.map(field => {
            const val = formInputs[field.name as string];
            const err = formErrors[field.name as string];

            if (field.type === 'multiyear') {
              return (
                <div key={field.name as string} className="md:col-span-2">
                  <MultiYearListInput
                    label={field.label}
                    value={val || []}
                    onChange={(newVal) => handleFieldChange(field.name as string, newVal)}
                    error={err}
                    description={field.description}
                  />
                </div>
              );
            }

            if (field.type === 'percentage') {
              return (
                <PercentageInput
                  key={field.name as string}
                  label={field.label}
                  value={val}
                  onChange={(newVal) => handleFieldChange(field.name as string, newVal)}
                  error={err}
                  description={field.description}
                  required={field.required}
                />
              );
            }

            return (
              <FinancialInput
                key={field.name as string}
                label={field.label}
                value={val === undefined ? '' : val}
                onChange={(newVal) => handleFieldChange(field.name as string, newVal)}
                error={err}
                description={field.description}
                required={field.required}
              />
            );
          })}
        </div>

        {/* Validation Failure Warning Row */}
        {!isFormValid && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>หยุดคำนวณชั่วคราว: กรุณากรอกข้อมูลในช่องสีแดงที่กำหนดให้ครบถ้วนและถูกต้อง</span>
          </div>
        )}

        {/* Step 3: Calculation Outputs View with Custom Suffix formatting (Section 1) */}
        {valuationResult && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">ผลลัพธ์การวิเคราะห์ประเมินมูลค่าตามปัจจัยพื้นฐาน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 p-5 rounded-2xl">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ราคาหุ้นในตลาดปัจจุบัน</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  ${valuationResult.currentPrice.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">มูลค่าตามปัจจัยพื้นฐานที่แท้จริง</span>
                <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                  ${valuationResult.intrinsicValue.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1 flex flex-col justify-between h-full">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ส่วนเผื่อความปลอดภัย (Margin of Safety)</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-black ${
                      valuationResult.marginOfSafety >= 10
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : valuationResult.marginOfSafety > 0
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {valuationResult.marginOfSafety.toFixed(1)}%
                    </span>

                    {/* Dynamic integration of new high-fidelity ValuationBadge */}
                    <ValuationBadge status={valuationResult.marginOfSafety >= 10 ? 'undervalued' : valuationResult.marginOfSafety > -5 ? 'fair' : 'overvalued'} />
                  </div>
                </div>

                {/* Reusable ConfidenceIndicator integration */}
                <div className="pt-2">
                  <ConfidenceIndicator score={confidenceScore} />
                </div>
              </div>
            </div>

            {/* Model Breakdown Fields Row */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">พารามิเตอร์ประกอบการพิจารณาโมเดล (Breakdown Analyzed)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {Object.entries(valuationResult.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {formatBreakdownValue(key, value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
