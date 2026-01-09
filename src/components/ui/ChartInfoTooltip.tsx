import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ChartInfoTooltipProps {
  title: string;
  description: string;
  usage?: string;
}

export const ChartInfoTooltip: React.FC<ChartInfoTooltipProps> = ({ 
  title, 
  description, 
  usage 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-navy-700 hover:bg-gray-300 dark:hover:bg-navy-600 text-gray-600 dark:text-gray-400 transition-colors ml-2"
        title="Informações sobre este gráfico"
        aria-label="Ajuda"
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">Para que serve?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
              
              {usage && (
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">Como usar?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {usage}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
