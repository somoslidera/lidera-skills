import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="bg-white dark:bg-lidera-gray w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
      >
        {/* Header fixo */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="text-xl font-bold text-brand-gradient">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Corpo com scroll */}
        <div className="p-6 overflow-y-auto scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
};