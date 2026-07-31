"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { SectorType, CompanyValuationInput, ValuationResult } from '@/types/valuation';
import { calculateIntrinsicValue } from '@/lib/valuation-router';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from './dashboard-ui';
import { Calculator, HelpCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

// ============================================================================
// CONFIGURATION-DRIVEN SCHEMA DEFINITIONS (SECTION 1)
// ============================================================================

export interface FormFieldSchema {
  name: keyof CompanyValuationInput;
  label: string;
  type: 'number' | 'percentage';
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  description: string;
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

// 1. Definition of sectors and sub-sectors
export const SECTORS: SectorConfig[] = [
  {
    id: 'TECH',
    name: 'Technology',
    subSectors: [
      { id: 'tech_software', name: 'Software & SaaS', modelId: 'tech_weighted' },
      { id: 'tech_hardware', name: 'Hardware & Semiconductors', modelId: 'tech_weighted' },
      { id: 'tech_internet', name: 'Internet Services & Platforms', modelId: 'tech_weighted' },
    ]
  },
  {
    id: 'FINANCIAL',
    name: 'Financial Services',
    subSectors: [
      { id: 'fin_banking', name: 'Commercial Banking', modelId: 'financial_residual' },
      { id: 'fin_insurance', name: 'Insurance Underwriting', modelId: 'financial_residual' },
      { id: 'fin_assets', name: 'Asset Management', modelId: 'financial_residual' },
    ]
  },
  {
    id: 'BIOTECH',
    name: 'Biotechnology & Pharma',
    subSectors: [
      { id: 'bio_therapeutics', name: 'Therapeutics & Genomics', modelId: 'biotech_rnpv' },
      { id: 'bio_devices', name: 'Medical Devices', modelId: 'biotech_rnpv' },
    ]
  },
  {
    id: 'REIT',
    name: 'Real Estate (REIT)',
    subSectors: [
      { id: 'reit_residential', name: 'Residential Properties', modelId: 'reit_nav_ffo' },
      { id: 'reit_commercial', name: 'Commercial & Office REITs', modelId: 'reit_nav_ffo' },
      { id: 'reit_healthcare', name: 'Healthcare REITs', modelId: 'reit_nav_ffo' },
    ]
  },
  {
    id: 'OTHER',
    name: 'Other Sectors',
    subSectors: [
      { id: 'other_retail', name: 'Retail & Consumer Goods', modelId: 'standard_dcf' },
      { id: 'other_mfg', name: 'Manufacturing & Industrial', modelId: 'standard_dcf' },
    ]
  }
];

// 2. Definition of valuation model schemas containing inputs dynamically mapped (No hardcoded conditionals!)
export const VALUATION_MODELS: Record<string, ValuationModelConfig> = {
  tech_weighted: {
    id: 'tech_weighted',
    name: 'Tech Weighted Model (70% DCF + 30% EV/EBITDA)',
    fields: [
      { name: 'price', label: 'Current Price ($)', type: 'number', defaultValue: 150, min: 0.1, description: 'The current market share price of the company.' },
      { name: 'outstandingShares', label: 'Outstanding Shares', type: 'number', defaultValue: 10000000, min: 1000, description: 'Total shares currently held by all shareholders.' },
      { name: 'freeCashFlow', label: 'Base Free Cash Flow ($)', type: 'number', defaultValue: 80000000, description: 'Operating cash flow minus capital expenditures.' },
      { name: 'growthRate', label: 'Annual Growth Rate (Year 1-5)', type: 'percentage', defaultValue: 0.12, min: -0.2, max: 1.0, step: 0.01, description: 'Projected annualized growth in Free Cash Flow.' },
      { name: 'discountRate', label: 'Discount Rate / WACC', type: 'percentage', defaultValue: 0.09, min: 0.02, max: 0.4, step: 0.005, description: 'The required rate of return / Weighted Average Cost of Capital.' },
      { name: 'terminalGrowthRate', label: 'Terminal Growth Rate', type: 'percentage', defaultValue: 0.025, min: 0.0, max: 0.08, step: 0.001, description: 'Growth rate into perpetuity beyond year 5.' },
      { name: 'ebitda', label: 'EBITDA ($)', type: 'number', defaultValue: 120000000, description: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.' },
      { name: 'evToEbitdaMultiplier', label: 'EV/EBITDA Multiple Target', type: 'number', defaultValue: 18, min: 1, max: 100, step: 0.5, description: 'Industry benchmark multiple of Enterprise Value to EBITDA.' },
      { name: 'totalDebt', label: 'Total Debt ($)', type: 'number', defaultValue: 30000000, description: 'Total short-term and long-term debt liabilities.' },
      { name: 'cashAndEquivalents', label: 'Cash & Equivalents ($)', type: 'number', defaultValue: 50000000, description: 'Total cash and highly liquid securities on book.' }
    ]
  },
  financial_residual: {
    id: 'financial_residual',
    name: 'Residual Income Valuation Model',
    fields: [
      { name: 'price', label: 'Current Price ($)', type: 'number', defaultValue: 45, min: 0.1, description: 'The current market share price of the financial institution.' },
      { name: 'outstandingShares', label: 'Outstanding Shares', type: 'number', defaultValue: 5000000, min: 1000, description: 'Total outstanding shares of common stock.' },
      { name: 'bookValue', label: 'Total Book Value of Equity ($)', type: 'number', defaultValue: 250000000, description: 'The total assets minus total liabilities on the balance sheet.' },
      { name: 'returnOnEquity', label: 'Return on Equity (ROE)', type: 'percentage', defaultValue: 0.13, min: -0.5, max: 1.0, step: 0.005, description: 'Net income divided by total shareholders equity.' },
      { name: 'requiredReturn', label: 'Cost of Equity / Required Return', type: 'percentage', defaultValue: 0.10, min: 0.02, max: 0.4, step: 0.005, description: 'The required rate of return on equity investment.' }
    ]
  },
  biotech_rnpv: {
    id: 'biotech_rnpv',
    name: 'rNPV (Risk-Adjusted Net Present Value) Model',
    fields: [
      { name: 'price', label: 'Current Price ($)', type: 'number', defaultValue: 12, min: 0.1, description: 'The current market share price.' },
      { name: 'outstandingShares', label: 'Outstanding Shares', type: 'number', defaultValue: 8000000, min: 1000, description: 'Total shares outstanding.' },
      { name: 'projectedRevenue', label: 'Projected Peak Sales ($)', type: 'number', defaultValue: 50000000, description: 'Expected peak annual revenues upon therapeutic/device launch.' },
      { name: 'phaseSuccessProbability', label: 'Phase Success Probability', type: 'percentage', defaultValue: 0.45, min: 0.0, max: 1.0, step: 0.01, description: 'Probability of drug approval based on current clinical trial phase.' },
      { name: 'discountRate', label: 'Biotech Discount Rate', type: 'percentage', defaultValue: 0.15, min: 0.05, max: 0.5, step: 0.01, description: 'Higher discount rate representing biotech pipeline development risk.' }
    ]
  },
  reit_nav_ffo: {
    id: 'reit_nav_ffo',
    name: 'REIT NAV & FFO Multiples Valuation',
    fields: [
      { name: 'price', label: 'Current Price ($)', type: 'number', defaultValue: 85, min: 0.1, description: 'The current market share price.' },
      { name: 'outstandingShares', label: 'Outstanding Shares', type: 'number', defaultValue: 12000000, min: 1000, description: 'Total shares outstanding.' },
      { name: 'nav', label: 'Net Asset Value (NAV) Per Share ($)', type: 'number', defaultValue: 90, min: 1, description: 'Calculated value of physical real estate portfolio per share.' },
      { name: 'ffo', label: 'Funds From Operations (FFO) ($)', type: 'number', defaultValue: 96000000, description: 'Operating cash flow excluding depreciation and gains from asset sales.' }
    ]
  },
  standard_dcf: {
    id: 'standard_dcf',
    name: 'Standard 5-Year DCF Model',
    fields: [
      { name: 'price', label: 'Current Price ($)', type: 'number', defaultValue: 50, min: 0.1, description: 'The current market share price.' },
      { name: 'outstandingShares', label: 'Outstanding Shares', type: 'number', defaultValue: 10000000, min: 1000, description: 'Total outstanding shares.' },
      { name: 'freeCashFlow', label: 'Base Free Cash Flow ($)', type: 'number', defaultValue: 40000000, description: 'The base year Free Cash Flow to start projections.' },
      { name: 'growthRate', label: 'Annual Growth Rate (Year 1-5)', type: 'percentage', defaultValue: 0.07, min: -0.2, max: 1.0, step: 0.005, description: 'Annualized growth in Free Cash Flow.' },
      { name: 'discountRate', label: 'Discount Rate', type: 'percentage', defaultValue: 0.10, min: 0.02, max: 0.4, step: 0.005, description: 'The required rate of return or discount factor.' },
      { name: 'terminalGrowthRate', label: 'Terminal Growth Rate', type: 'percentage', defaultValue: 0.02, min: 0.0, max: 0.08, step: 0.001, description: 'Perpetual terminal growth rate.' },
      { name: 'totalDebt', label: 'Total Debt ($)', type: 'number', defaultValue: 10000000, description: 'Total interest-bearing debt liabilities.' },
      { name: 'cashAndEquivalents', label: 'Cash & Equivalents ($)', type: 'number', defaultValue: 15000000, description: 'Total cash balance.' }
    ]
  }
};

export const DynamicFinancialForm = () => {
  // 1. Selector States
  const [selectedSectorId, setSelectedSectorId] = useState<SectorType>('TECH');
  const [selectedSubSectorId, setSelectedSubSectorId] = useState<string>('tech_software');
  const [selectedModelId, setSelectedModelId] = useState<string>('tech_weighted');

  // Find active sector config
  const activeSector = useMemo(() => {
    return SECTORS.find(s => s.id === selectedSectorId) || SECTORS[0];
  }, [selectedSectorId]);

  // Find active subsector config
  const activeSubSector = useMemo(() => {
    return activeSector.subSectors.find(ss => ss.id === selectedSubSectorId) || activeSector.subSectors[0];
  }, [activeSector, selectedSubSectorId]);

  // Find active model config based on selection or subsector mapping
  const activeModel = useMemo(() => {
    return VALUATION_MODELS[selectedModelId] || VALUATION_MODELS['tech_weighted'];
  }, [selectedModelId]);

  // 2. Dynamic Input States
  const [formInputs, setFormInputs] = useState<Record<string, number>>({});

  // 3. Synchronize states whenever selectors change
  useEffect(() => {
    // When sector changes, default to its first subsector
    const targetSub = activeSector.subSectors[0];
    setSelectedSubSectorId(targetSub.id);
    setSelectedModelId(targetSub.modelId);
  }, [selectedSectorId, activeSector]);

  useEffect(() => {
    // When subsector changes, default to its specified model
    if (activeSubSector) {
      setSelectedModelId(activeSubSector.modelId);
    }
  }, [selectedSubSectorId, activeSubSector]);

  useEffect(() => {
    // Re-initialize form field states using default values in configuration
    const initialValues: Record<string, number> = {};
    activeModel.fields.forEach(field => {
      initialValues[field.name as string] = field.defaultValue;
    });
    setFormInputs(initialValues);
  }, [activeModel]);

  // 4. Input Change Handler
  const handleInputChange = (fieldName: string, value: number) => {
    setFormInputs(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 5. Evaluate calculations dynamically
  const valuationResult = useMemo<ValuationResult | null>(() => {
    if (Object.keys(formInputs).length === 0) return null;

    // Map form inputs to standard router contract
    const valuationInput: CompanyValuationInput = {
      symbol: 'CUSTOM',
      name: `Custom ${activeSector.name} Valuation`,
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
      phaseSuccessProbability: formInputs['phaseSuccessProbability'],
      projectedRevenue: formInputs['projectedRevenue'],
      nav: formInputs['nav'],
      ffo: formInputs['ffo']
    };

    return calculateIntrinsicValue(selectedSectorId, valuationInput);
  }, [formInputs, selectedSectorId, activeSector]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Advanced Multi-Sector Valuation Lab</span>
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dynamically generate financial schemas for real-estate, early-phase pharma, technology systems, or banks.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Step 1: Sector / SubSector Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-850 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target Asset Sector</label>
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value as SectorType)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-md outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            >
              {SECTORS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sub-Sector Focus</label>
            <select
              value={selectedSubSectorId}
              onChange={(e) => setSelectedSubSectorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-md outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            >
              {activeSector.subSectors.map(ss => (
                <option key={ss.id} value={ss.id}>{ss.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Valuation Blueprint Model</label>
            <div className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeModel.name}
            </div>
          </div>
        </div>

        {/* Step 2: Dynamic Input Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {activeModel.fields.map(field => {
            const val = formInputs[field.name as string] ?? field.defaultValue;

            return (
              <div key={field.name as string} className="space-y-1.5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                    {field.label}
                    <div className="group relative ml-1 inline-flex items-center justify-center cursor-help">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10 font-normal leading-normal whitespace-normal">
                        {field.description}
                      </span>
                    </div>
                  </span>

                  {field.type === 'percentage' && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {(val * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                {field.type === 'percentage' ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min={field.min ?? 0}
                      max={field.max ?? 1}
                      step={field.step ?? 0.01}
                      value={val}
                      onChange={(e) => handleInputChange(field.name as string, parseFloat(e.target.value))}
                      className="flex-1 accent-indigo-600 dark:accent-indigo-400 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    value={val}
                    onChange={(e) => handleInputChange(field.name as string, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-md outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 3: Calculation Outputs View */}
        {valuationResult && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Evaluation Intrinsic Valuation Results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 p-5 rounded-2xl">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Share Price</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  ${valuationResult.currentPrice.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Intrinsic Share Value</span>
                <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                  ${valuationResult.intrinsicValue.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Margin of Safety</span>
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
                  {valuationResult.marginOfSafety > 0 ? (
                    <StatusBadge label="Undervalued" variant="success" />
                  ) : (
                    <StatusBadge label="Overvalued" variant="danger" />
                  )}
                </div>
              </div>
            </div>

            {/* Model Breakdown Fields Row */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Breakdown Parameters Analyzed</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {Object.entries(valuationResult.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {typeof value === 'number' ? (value > 1 ? `$${value.toLocaleString()}` : `${(value * 100).toFixed(1)}%`) : String(value)}
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
