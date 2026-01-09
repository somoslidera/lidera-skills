import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatProps {
  phoneNumber?: string;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ 
  phoneNumber = '5551998730488' 
}) => {
  const handleClick = () => {
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-all transform hover:scale-110 animate-bounce"
      title="Fale conosco no WhatsApp"
      aria-label="Abrir WhatsApp"
    >
      <MessageCircle size={28} />
    </button>
  );
};
