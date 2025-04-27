export interface TechnicalSupervisor {
  nome: string;
  crf: string;
}

export interface MonthlyControl {
  [key: string]: string; // janeiro, fevereiro, etc.
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
  email: string;
  responsaveisTecnicos: TechnicalSupervisor[];
  controlesMensais: MonthlyControl;
  controlesTrimestrais: QuarterlyControl;
  observacoes: string;
  dataCadastro: string;
  ultimaAtualizacao: string;
  address?: Address | null; // Adiciona o campo de endereço opcional
}
