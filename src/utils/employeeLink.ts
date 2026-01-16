/**
 * Gera o link para a página do colaborador
 * @param companyId ID da empresa
 * @param employeeId ID do colaborador
 * @returns URL da página do colaborador
 */
import { Link } from 'react-router-dom';
import React from 'react';

export const getEmployeeLink = (companyId: string, employeeId: string): string => {
  return `/employee/${companyId}/${employeeId}`;
};

/**
 * Componente de link para colaborador
 */

interface EmployeeLinkProps {
  companyId: string;
  employeeId: string;
  employeeName: string;
  className?: string;
  children?: React.ReactNode;
}

export const EmployeeLink: React.FC<EmployeeLinkProps> = ({ 
  companyId, 
  employeeId, 
  employeeName,
  className = '',
  children 
}) => {
  return (
    <Link
      to={getEmployeeLink(companyId, employeeId)}
      className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${className}`}
      title={`Ver perfil de ${employeeName}`}
    >
      {children || employeeName}
    </Link>
  );
};
