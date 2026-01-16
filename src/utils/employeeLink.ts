/**
 * Gera o link para a página do colaborador
 * @param companyId ID da empresa
 * @param employeeId ID do colaborador
 * @returns URL da página do colaborador
 */
export const getEmployeeLink = (companyId: string, employeeId: string): string => {
  return `/employee/${companyId}/${employeeId}`;
};
