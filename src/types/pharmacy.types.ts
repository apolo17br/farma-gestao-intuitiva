export interface TechnicalSupervisor {
  nome: string;
  crf: string;
}

export interface MonthlyControl {
  janeiro: string;
  fevereiro: string;
  marco: string;
  abril: string;
  maio: string;
  junho: string;
  julho: string;
  agosto: string;
  setembro: string;
  outubro: string;
  novembro: string;
  dezembro: string;
}

// Interface para controles mensais com informação de ano
export interface YearlyMonthlyControl extends MonthlyControl {
  id?: string;
  pharmacy_id?: string;
  year: number; // Ano extraído do created_at
  created_at?: string;
}

export interface QuarterlyControl {
  primeiro: string;
  segundo: string;
  terceiro: string;
  quarto: string;
}

// Interface para controles trimestrais com informação de ano
export interface YearlyQuarterlyControl extends QuarterlyControl {
  id?: string;
  pharmacy_id?: string;
  year: number; // Ano extraído do created_at
  created_at?: string;
}

// Nova interface para o Endereço
export interface Address {
  id?: string; // ID da tabela addresses, opcional no frontend
  pharmacy_id?: string; // ID da farmácia, opcional no frontend
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento: string;
}

export interface Pharmacy {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string;
  alvara?: string; // Campo opcional para o alvará
  email: string;
  responsaveisTecnicos: TechnicalSupervisor[];
  // Controles mensais agora são arrays para suportar múltiplos anos
  controlesMensaisA: YearlyMonthlyControl[];
  controlesMensaisB2: YearlyMonthlyControl[];
  controlesTrimestrais: YearlyQuarterlyControl[];
  observacoes: string;
  dataCadastro: string;
  ultimaAtualizacao: string;
  address?: Address | null; // Adiciona o campo de endereço opcional
}

// Tipo auxiliar para representar um mês/ano específico
export interface MonthYearEntry {
  month: number; // 0-11
  year: number;
  monthName: string;
  monthKey: string; // janeiro, fevereiro, etc.
  label: string; // "Jan/25", "Fev/25", etc.
}
