import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Para que serve?</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {description}
            </p>
          </div>
          
          {usage && (
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">Como usar?</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {usage}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
