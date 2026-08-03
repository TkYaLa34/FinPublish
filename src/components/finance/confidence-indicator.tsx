'use client';

import React from 'react';

interface ConfidenceIndicatorProps {
  score: number; // 0 - 100
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ score }) => {
  const getLabel = (val: number) => {
    if (val >= 90) return 'Very High';
    if (val >= 75) return 'High';
    if (val >= 50) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-500 dark:text-slate-400 text-muted-foreground">Confidence</span>
        <span className="text-slate-900 dark:text-slate-100 text-foreground">{score}% ({getLabel(score)})</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 bg-secondary h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 dark:bg-indigo-400 bg-primary h-full transition-all duration-300"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
