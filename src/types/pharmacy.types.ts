
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
}
