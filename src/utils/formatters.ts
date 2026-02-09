// Funções de formatação de dados

/**
 * Remove todos os caracteres não numéricos de um CNPJ
 */
export const cleanCnpj = (cnpj: string): string => {
    return cnpj?.replace(/[^\d]/g, '') || '';
};

/**
 * Formata um CNPJ para o padrão XX.XXX.XXX/XXXX-XX
 */
export const formatCnpj = (cnpj: string): string => {
    const cleaned = cleanCnpj(cnpj);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

/**
 * Valida se o CNPJ tem o formato correto (14 dígitos)
 */
export const isValidCnpjFormat = (cnpj: string): boolean => {
    const cleaned = cleanCnpj(cnpj);
    return cleaned.length === 14;
};

/**
 * Formata um CNPJ completo (14 dígitos) para exibição
 * Se o CNPJ não tiver 14 dígitos, retorna o valor original
 */
export const formatCnpjDisplay = (cnpj: string): string => {
    const cleaned = cleanCnpj(cnpj);
    if (cleaned.length !== 14) return cnpj || '';
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};
