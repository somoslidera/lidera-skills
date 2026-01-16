/**
 * Extrai as iniciais de um nome (primeira letra do primeiro nome + primeira letra do último nome)
 */
export const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  // Primeira letra do primeiro nome + primeira letra do último nome
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${first}${last}`;
};

/**
 * Formata um nome completo para exibir apenas primeiro e último nome
 */
export const formatShortName = (name: string): string => {
  if (!name || name.trim() === '') return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return name; // Já está no formato correto
  
  // Primeiro nome + último nome
  const first = parts[0];
  const last = parts[parts.length - 1];
  
  return `${first} ${last}`;
};
