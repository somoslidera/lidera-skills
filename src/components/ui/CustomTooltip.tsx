import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
  showComparison?: boolean;
  averageValue?: number;
  previousValue?: number;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  showComparison = false,
  averageValue,
  previousValue
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const value = payload[0].value;
  const name = payload[0].name;
  const formattedValue = formatter ? formatter(value, name)[0] : value;
  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label;

  let comparisonText = null;
  let trendIcon = null;
  if (showComparison && averageValue !== undefined) {
    const diff = value - averageValue;
    if (diff > 0) {
      comparisonText = `${Math.abs(diff).toFixed(1)} pontos acima da média`;
      trendIcon = <TrendingUp size={14} className="text-green-400" />;
    } else if (diff < 0) {
      comparisonText = `${Math.abs(diff).toFixed(1)} pontos abaixo da média`;
      trendIcon = <TrendingDown size={14} className="text-red-400" />;
    } else {
      comparisonText = 'Na média';
      trendIcon = <Minus size={14} className="text-gray-400" />;
    }
  }

  let changeText = null;
  if (previousValue !== undefined && previousValue !== null) {
    const change = value - previousValue;
    const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0;
    if (change > 0) {
      changeText = (
        <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
          <TrendingUp size={12} />
          <span>+{change.toFixed(1)} ({changePercent.toFixed(1)}%)</span>
        </div>
      );
    } else if (change < 0) {
      changeText = (
        <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
          <TrendingDown size={12} />
          <span>{change.toFixed(1)} ({changePercent.toFixed(1)}%)</span>
        </div>
      );
    } else {
      changeText = (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
          <Minus size={12} />
          <span>Sem mudança</span>
        </div>
      );
    }
  }

  return (
    <div className="bg-gray-900 dark:bg-navy-900 border border-gray-700 dark:border-navy-700 rounded-lg shadow-xl p-3 min-w-[180px]">
      <p className="text-white dark:text-gray-100 font-semibold text-sm mb-2 border-b border-gray-700 dark:border-navy-700 pb-2">
        {formattedLabel}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-300 dark:text-gray-400 text-xs">{name}:</span>
          <span className="text-white dark:text-gray-100 font-bold text-sm">{formattedValue}</span>
        </div>
        {comparisonText && (
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-700 dark:border-navy-700 mt-1">
            {trendIcon}
            <span className="text-gray-300 dark:text-gray-400">{comparisonText}</span>
          </div>
        )}
        {changeText}
      </div>
    </div>
  );
};
