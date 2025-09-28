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

export interface QuarterlyControl {
  primeiro: string;
  segundo: string;
  terceiro: string;
  quarto: string;
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
  controlesMensaisA: MonthlyControl;
  controlesMensaisB2: MonthlyControl;
  controlesTrimestrais: QuarterlyControl;
  observacoes: string;
  dataCadastro: string;
  ultimaAtualizacao: string;
  address?: Address | null; // Adiciona o campo de endereço opcional
}
