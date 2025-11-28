import { LucideIcon } from 'lucide-react';

interface CardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const Card = ({ title, value, icon: Icon, trend, subtitle, onClick, className }: CardProps) => (
  <div onClick={onClick} className={`bg-white dark:bg-lidera-gray p-6 rounded-lg border border-gray-200 dark:border-lidera-dark hover:border-skills-blue-primary dark:hover:border-lidera-gold/50 transition-all shadow-lg group cursor-pointer ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-500 mb-1 tracking-widest uppercase group-hover:text-skills-blue-primary dark:group-hover:text-lidera-gold transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-2 font-medium border-l-2 border-skills-blue-primary dark:border-lidera-gold pl-2">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-lidera-dark border border-gray-100 dark:border-lidera-dark group-hover:bg-blue-50 dark:group-hover:bg-lidera-gold/10 transition-colors">
        <Icon className="w-6 h-6 text-skills-blue-primary dark:text-lidera-gold" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center text-sm">
        <span className={trend > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
        <span className="text-gray-400 ml-2">vs anterior</span>
      </div>
    )}
  </div>
);