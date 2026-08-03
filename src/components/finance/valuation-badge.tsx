'use client';

import React from 'react';

type ValuationStatus = 'undervalued' | 'fair' | 'overvalued' | 'insufficient_data';

interface ValuationBadgeProps {
  status: ValuationStatus;
}

export const ValuationBadge: React.FC<ValuationBadgeProps> = ({ status }) => {
  switch (status) {
    case 'undervalued':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ✓ Undervalued
        </span>
      );
    case 'fair':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          ≈ Fair Value
        </span>
      );
    case 'overvalued':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          ⚠ Overvalued
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
          No Rating
        </span>
      );
  }
};
