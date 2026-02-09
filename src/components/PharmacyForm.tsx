import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Pharmacy, TechnicalSupervisor, MonthlyControl, QuarterlyControl, Address, YearlyMonthlyControl, YearlyQuarterlyControl } from "../types/pharmacy.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, ChevronDown, ChevronUp, CheckSquare, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "@/components/ui/sonner";
import { cleanCnpj, formatCnpj, isValidCnpjFormat } from "../utils/formatters";

const emptyAddress: Address = {
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  complemento: "",
};

// Ano atual e anterior para controles
const currentYear = new Date().getFullYear();
const previousYear = currentYear - 1;

// Controle mensal vazio para um determinado ano
const createEmptyMonthlyControl = (year: number): YearlyMonthlyControl => ({
  year,
  janeiro: "",
  fevereiro: "",
  marco: "",
  abril: "",
  maio: "",
  junho: "",
  julho: "",
  agosto: "",
  setembro: "",
  outubro: "",
  novembro: "",
  dezembro: "",
});

// Controle trimestral vazio para um determinado ano
const createEmptyQuarterlyControl = (year: number): YearlyQuarterlyControl => ({
  year,
  primeiro: "",
  segundo: "",
  terceiro: "",
  quarto: "",
});

// emptyPharmacy agora inclui controles para o ano anterior E o ano atual
const emptyPharmacy = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  telefone: "",
  alvara: "",
  email: "",
  responsaveisTecnicos: [{ nome: "", crf: "" }],
  controlesMensaisA: [
    createEmptyMonthlyControl(previousYear),
    createEmptyMonthlyControl(currentYear)
  ],
  controlesMensaisB2: [
    createEmptyMonthlyControl(previousYear),
    createEmptyMonthlyControl(currentYear)
  ],
  controlesTrimestrais: [
    createEmptyQuarterlyControl(previousYear),
    createEmptyQuarterlyControl(currentYear)
  ],
  observacoes: "",
  address: { ...emptyAddress },
};

interface PharmacyFormProps {
  pharmacy?: Pharmacy;
  isEditing?: boolean;
}

// Função auxiliar para garantir que valores sejam strings vazias se forem null/undefined
const ensureString = (value: string | null | undefined): string => value ?? "";

// Função auxiliar para garantir que o array de supervisores não seja null/undefined
const ensureSupervisors = (supervisors: TechnicalSupervisor[] | null | undefined): TechnicalSupervisor[] =>
  supervisors && supervisors.length > 0 ? supervisors.map(s => ({ nome: ensureString(s.nome), crf: ensureString(s.crf) })) : [{ nome: "", crf: "" }];

// Função auxiliar para processar um controle mensal único
const processMonthlyControl = (control: any): YearlyMonthlyControl => {
  return {
    id: control.id,
    pharmacy_id: control.pharmacy_id,
    year: control.year || currentYear,
    created_at: control.created_at,
    janeiro: ensureString(control.janeiro),
    fevereiro: ensureString(control.fevereiro),
    marco: ensureString(control.marco),
    abril: ensureString(control.abril),
    maio: ensureString(control.maio),
    junho: ensureString(control.junho),
    julho: ensureString(control.julho),
    agosto: ensureString(control.agosto),
    setembro: ensureString(control.setembro),
    outubro: ensureString(control.outubro),
    novembro: ensureString(control.novembro),
    dezembro: ensureString(control.dezembro),
  };
};

// Função auxiliar para garantir que os controles mensais tenham ambos os anos (anterior e atual)
const ensureMonthlyControlsArray = (controls: YearlyMonthlyControl[] | null | undefined): YearlyMonthlyControl[] => {
  if (!controls || !Array.isArray(controls) || controls.length === 0) {
    return [
      createEmptyMonthlyControl(previousYear),
      createEmptyMonthlyControl(currentYear)
    ];
  }

  const processedControls = controls.map(processMonthlyControl);

  // Garantir que o ano anterior e o ano atual existam
  const years = processedControls.map(c => c.year);
  if (!years.includes(previousYear)) {
    processedControls.unshift(createEmptyMonthlyControl(previousYear));
  }
  if (!years.includes(currentYear)) {
    processedControls.push(createEmptyMonthlyControl(currentYear));
  }

  // Ordenar por ano (mais antigo primeiro)
  return processedControls.sort((a, b) => a.year - b.year);
};

// Função auxiliar para processar um controle trimestral único
const processQuarterlyControl = (control: any): YearlyQuarterlyControl => {
  return {
    id: control.id,
    pharmacy_id: control.pharmacy_id,
    year: control.year || currentYear,
    created_at: control.created_at,
    primeiro: ensureString(control.primeiro),
    segundo: ensureString(control.segundo),
    terceiro: ensureString(control.terceiro),
    quarto: ensureString(control.quarto),
  };
};

// Função auxiliar para garantir que os controles trimestrais tenham ambos os anos (anterior e atual)
const ensureQuarterlyControlsArray = (controls: YearlyQuarterlyControl[] | null | undefined): YearlyQuarterlyControl[] => {
  if (!controls || !Array.isArray(controls) || controls.length === 0) {
    return [
      createEmptyQuarterlyControl(previousYear),
      createEmptyQuarterlyControl(currentYear)
    ];
  }

  const processedControls = controls.map(processQuarterlyControl);

  // Garantir que o ano anterior e o ano atual existam
  const years = processedControls.map(c => c.year);
  if (!years.includes(previousYear)) {
    processedControls.unshift(createEmptyQuarterlyControl(previousYear));
  }
  if (!years.includes(currentYear)) {
    processedControls.push(createEmptyQuarterlyControl(currentYear));
  }

  // Ordenar por ano (mais antigo primeiro)
  return processedControls.sort((a, b) => a.year - b.year);
};

// Função auxiliar para garantir que o endereço e seus campos sejam strings
const ensureAddress = (address: Address | null | undefined): Address => {
  if (!address) return { ...emptyAddress };
  return {
    logradouro: ensureString(address.logradouro),
    numero: ensureString(address.numero),
    bairro: ensureString(address.bairro),
    cidade: ensureString(address.cidade),
    estado: ensureString(address.estado),
    cep: ensureString(address.cep),
    complemento: ensureString(address.complemento),
  };
};

const PharmacyForm: React.FC<PharmacyFormProps> = ({ pharmacy, isEditing = false }) => {
  const [formData, setFormData] = useState<Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao"> & { address: Address }>(() => {
    if (pharmacy) {
      return {
        cnpj: ensureString(pharmacy.cnpj),
        razaoSocial: ensureString(pharmacy.razaoSocial),
        nomeFantasia: ensureString(pharmacy.nomeFantasia),
        telefone: ensureString(pharmacy.telefone),
        alvara: ensureString(pharmacy.alvara),
        email: ensureString(pharmacy.email),
        observacoes: ensureString(pharmacy.observacoes),
        responsaveisTecnicos: ensureSupervisors(pharmacy.responsaveisTecnicos),
        controlesMensaisA: ensureMonthlyControlsArray(pharmacy.controlesMensaisA),
        controlesMensaisB2: ensureMonthlyControlsArray(pharmacy.controlesMensaisB2),
        controlesTrimestrais: ensureQuarterlyControlsArray(pharmacy.controlesTrimestrais),
        address: ensureAddress(pharmacy.address),
      };
    } else {
      return { ...emptyPharmacy, address: { ...emptyAddress } };
    }
  });

  const { addPharmacy, updatePharmacy } = usePharmacy();
  const navigate = useNavigate();

  // Estados para verificação de CNPJ
  const [cnpjStatus, setCnpjStatus] = useState<'idle' | 'checking' | 'available' | 'exists' | 'invalid'>('idle');
  const [cnpjMessage, setCnpjMessage] = useState<string>('');
  const [checkingCnpj, setCheckingCnpj] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para verificar se CNPJ já existe no banco
  const checkCnpjExists = useCallback(async (cnpj: string) => {
    const cleanedCnpj = cleanCnpj(cnpj);

    if (cleanedCnpj.length < 14) {
      setCnpjStatus('idle');
      setCnpjMessage('');
      return;
    }

    if (!isValidCnpjFormat(cnpj)) {
      setCnpjStatus('invalid');
      setCnpjMessage('CNPJ inválido. Deve conter 14 dígitos.');
      return;
    }

    setCheckingCnpj(true);
    setCnpjStatus('checking');
    setCnpjMessage('Verificando CNPJ...');

    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, nome_fantasia')
        .eq('cnpj', cleanedCnpj)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar CNPJ:', error);
        setCnpjStatus('idle');
        setCnpjMessage('');
        return;
      }

      if (data) {
        // Se estamos editando e o CNPJ encontrado é da mesma farmácia, está ok
        if (isEditing && pharmacy && data.id === pharmacy.id) {
          setCnpjStatus('available');
          setCnpjMessage('Este é o CNPJ atual da farmácia.');
        } else {
          setCnpjStatus('exists');
          setCnpjMessage(`CNPJ já cadastrado: ${data.nome_fantasia || 'Farmácia existente'}`);
        }
      } else {
        setCnpjStatus('available');
        setCnpjMessage('CNPJ disponível para cadastro.');
      }
    } catch (err) {
      console.error('Erro ao verificar CNPJ:', err);
      setCnpjStatus('idle');
      setCnpjMessage('');
    } finally {
      setCheckingCnpj(false);
    }
  }, [isEditing, pharmacy]);

  useEffect(() => {
    if (pharmacy) {
      setFormData((prev) => ({
        ...prev,
        cnpj: formatCnpj(ensureString(pharmacy.cnpj)),
        razaoSocial: ensureString(pharmacy.razaoSocial),
        nomeFantasia: ensureString(pharmacy.nomeFantasia),
        telefone: ensureString(pharmacy.telefone),
        alvara: ensureString(pharmacy.alvara),
        email: ensureString(pharmacy.email),
        observacoes: ensureString(pharmacy.observacoes),
        responsaveisTecnicos: ensureSupervisors(pharmacy.responsaveisTecnicos),
        controlesMensaisA: ensureMonthlyControlsArray(pharmacy.controlesMensaisA),
        controlesMensaisB2: ensureMonthlyControlsArray(pharmacy.controlesMensaisB2),
        controlesTrimestrais: ensureQuarterlyControlsArray(pharmacy.controlesTrimestrais),
        address: ensureAddress(pharmacy.address),
      }));
    } else {
      setFormData({ ...emptyPharmacy, address: { ...emptyAddress } });
    }
  }, [pharmacy]);

  // Função específica para lidar com mudança do CNPJ
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatCnpj(rawValue);

    // Limitar a 18 caracteres (14 dígitos + 4 caracteres de pontuação)
    if (formattedValue.length <= 18) {
      setFormData((prev) => ({ ...prev, cnpj: formattedValue }));

      // Verificar CNPJ quando tiver 14 dígitos
      if (cleanCnpj(formattedValue).length === 14) {
        checkCnpjExists(formattedValue);
      } else {
        setCnpjStatus('idle');
        setCnpjMessage('');
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Nova função para lidar com mudanças nos campos de endereço
  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSupervisorChange = (
    index: number,
    field: "nome" | "crf",
    value: string
  ) => {
    const newSupervisors = [...(formData.responsaveisTecnicos || [])];
    newSupervisors[index] = {
      nome: field === "nome" ? value : (newSupervisors[index]?.nome || ""),
      crf: field === "crf" ? value : (newSupervisors[index]?.crf || "")
    };

    setFormData((prev) => ({
      ...prev,
      responsaveisTecnicos: newSupervisors,
    }));
  };

  const handleAddSupervisor = () => {
    setFormData((prev) => ({
      ...prev,
      responsaveisTecnicos: [...(prev.responsaveisTecnicos || []), { nome: "", crf: "" }],
    }));
  };

  const handleRemoveSupervisor = (index: number) => {
    const newSupervisors = [...formData.responsaveisTecnicos];
    newSupervisors.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      responsaveisTecnicos: newSupervisors,
    }));
  };

  // Função para atualizar controle mensal de um ano específico
  const handleMonthlyControlChange = (type: 'A' | 'B2', yearIndex: number, month: string, checked: boolean) => {
    if (type === 'A') {
      setFormData((prev) => {
        const newControls = [...prev.controlesMensaisA];
        newControls[yearIndex] = {
          ...newControls[yearIndex],
          [month]: checked ? "realizado" : "",
        };
        return {
          ...prev,
          controlesMensaisA: newControls,
        };
      });
    } else {
      setFormData((prev) => {
        const newControls = [...prev.controlesMensaisB2];
        newControls[yearIndex] = {
          ...newControls[yearIndex],
          [month]: checked ? "realizado" : "",
        };
        return {
          ...prev,
          controlesMensaisB2: newControls,
        };
      });
    }
  };

  // Função para atualizar controle trimestral de um ano específico
  const handleQuarterlyControlChange = (yearIndex: number, quarter: string, checked: boolean) => {
    setFormData((prev) => {
      const newControls = [...prev.controlesTrimestrais];
      newControls[yearIndex] = {
        ...newControls[yearIndex],
        [quarter]: checked ? "realizado" : "",
      };
      return {
        ...prev,
        controlesTrimestrais: newControls,
      };
    });
  };

  // Função para marcar todos os meses de um ano específico (Receitas A ou B2)
  const handleMarkAllMonths = (type: 'A' | 'B2', yearIndex: number, markAll: boolean) => {
    const allMonths = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    if (type === 'A') {
      setFormData((prev) => {
        const newControls = [...prev.controlesMensaisA];
        const updatedControl = { ...newControls[yearIndex] };
        allMonths.forEach(month => {
          (updatedControl as any)[month] = markAll ? "realizado" : "";
        });
        newControls[yearIndex] = updatedControl;
        return {
          ...prev,
          controlesMensaisA: newControls,
        };
      });
    } else {
      setFormData((prev) => {
        const newControls = [...prev.controlesMensaisB2];
        const updatedControl = { ...newControls[yearIndex] };
        allMonths.forEach(month => {
          (updatedControl as any)[month] = markAll ? "realizado" : "";
        });
        newControls[yearIndex] = updatedControl;
        return {
          ...prev,
          controlesMensaisB2: newControls,
        };
      });
    }
  };

  // Função para marcar todos os trimestres de um ano específico
  const handleMarkAllQuarters = (yearIndex: number, markAll: boolean) => {
    const allQuarters = ['primeiro', 'segundo', 'terceiro', 'quarto'];

    setFormData((prev) => {
      const newControls = [...prev.controlesTrimestrais];
      const updatedControl = { ...newControls[yearIndex] };
      allQuarters.forEach(quarter => {
        (updatedControl as any)[quarter] = markAll ? "realizado" : "";
      });
      newControls[yearIndex] = updatedControl;
      return {
        ...prev,
        controlesTrimestrais: newControls,
      };
    });
  };

  // Verificar se todos os meses de um ano estão marcados
  const areAllMonthsMarked = (type: 'A' | 'B2', yearIndex: number): boolean => {
    const allMonths = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const control = type === 'A' ? formData.controlesMensaisA[yearIndex] : formData.controlesMensaisB2[yearIndex];
    return allMonths.every(month => !!(control as any)[month]);
  };

  // Verificar se todos os trimestres de um ano estão marcados
  const areAllQuartersMarked = (yearIndex: number): boolean => {
    const allQuarters = ['primeiro', 'segundo', 'terceiro', 'quarto'];
    const control = formData.controlesTrimestrais[yearIndex];
    return allQuarters.every(quarter => !!(control as any)[quarter]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se o CNPJ já existe antes de enviar
    if (cnpjStatus === 'exists') {
      toast.error('Este CNPJ já está cadastrado no sistema. Por favor, verifique os dados.');
      return;
    }

    if (cnpjStatus === 'invalid') {
      toast.error('CNPJ inválido. Por favor, digite um CNPJ válido com 14 dígitos.');
      return;
    }

    if (cnpjStatus === 'checking') {
      toast.warning('Aguarde a verificação do CNPJ...');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados para enviar (limpando o CNPJ)
      const dataToSend = {
        ...formData,
        cnpj: cleanCnpj(formData.cnpj), // Enviar CNPJ sem pontuação
      };

      if (isEditing && pharmacy) {
        await updatePharmacy({
          ...pharmacy,
          ...dataToSend,
        });
        toast.success('Farmácia atualizada com sucesso!');
        navigate(`/farmacias/${pharmacy.id}`);
      } else {
        await addPharmacy(dataToSend);
        toast.success('Farmácia cadastrada com sucesso!');
        navigate("/farmacias");
      }
    } catch (error: any) {
      console.error('Erro ao salvar farmácia:', error);

      // Tratamento de erros específicos
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        toast.error('Este CNPJ já está cadastrado no sistema.');
      } else {
        toast.error('Erro ao salvar farmácia. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = [
    { key: "janeiro", label: "Janeiro" },
    { key: "fevereiro", label: "Fevereiro" },
    { key: "marco", label: "Março" },
    { key: "abril", label: "Abril" },
    { key: "maio", label: "Maio" },
    { key: "junho", label: "Junho" },
    { key: "julho", label: "Julho" },
    { key: "agosto", label: "Agosto" },
    { key: "setembro", label: "Setembro" },
    { key: "outubro", label: "Outubro" },
    { key: "novembro", label: "Novembro" },
    { key: "dezembro", label: "Dezembro" },
  ];

  const quarters = [
    { key: "primeiro", label: "1º Trimestre" },
    { key: "segundo", label: "2º Trimestre" },
    { key: "terceiro", label: "3º Trimestre" },
    { key: "quarto", label: "4º Trimestre" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Dados da Farmácia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cnpj">
                CNPJ <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  required
                  className={`pr-10 ${cnpjStatus === 'exists' || cnpjStatus === 'invalid'
                    ? 'border-destructive focus-visible:ring-destructive'
                    : cnpjStatus === 'available'
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                    }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cnpjStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {cnpjStatus === 'available' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {(cnpjStatus === 'exists' || cnpjStatus === 'invalid') && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              {cnpjMessage && (
                <p className={`text-sm ${cnpjStatus === 'exists' || cnpjStatus === 'invalid'
                  ? 'text-destructive'
                  : cnpjStatus === 'available'
                    ? 'text-green-600'
                    : 'text-muted-foreground'
                  }`}>
                  {cnpjMessage}
                </p>
              )}
              {!cnpjMessage && (
                <p className="form-hint">O CNPJ será formatado automaticamente</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="razaoSocial">
                Razão Social <span className="text-destructive">*</span>
              </label>
              <Input
                id="razaoSocial"
                name="razaoSocial"
                value={formData.razaoSocial}
                onChange={handleChange}
                placeholder="Razão Social da Farmácia"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="nomeFantasia">
                Nome Fantasia <span className="text-destructive">*</span>
              </label>
              <Input
                id="nomeFantasia"
                name="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={handleChange}
                placeholder="Nome Fantasia"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="telefone">
                Telefone
              </label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="alvara">
                Alvará
              </label>
              <Input
                id="alvara"
                name="alvara"
                value={formData.alvara}
                onChange={handleChange}
                placeholder="Número do alvará"
                maxLength={100}
              />
              <p className="form-hint">Máximo 100 caracteres</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Endereço (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium" htmlFor="logradouro">
                Logradouro (Rua, Avenida, etc.)
              </label>
              <Input
                id="logradouro"
                name="logradouro"
                value={formData.address.logradouro}
                onChange={handleAddressChange}
                placeholder="Ex: Rua Principal"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="numero">
                Número
              </label>
              <Input
                id="numero"
                name="numero"
                value={formData.address.numero}
                onChange={handleAddressChange}
                placeholder="Ex: 123, S/N"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="bairro">
                Bairro
              </label>
              <Input
                id="bairro"
                name="bairro"
                value={formData.address.bairro}
                onChange={handleAddressChange}
                placeholder="Ex: Centro"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="complemento">
                Complemento
              </label>
              <Input
                id="complemento"
                name="complemento"
                value={formData.address.complemento}
                onChange={handleAddressChange}
                placeholder="Ex: Apto 101, Bloco B"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="cidade">
                Cidade
              </label>
              <Input
                id="cidade"
                name="cidade"
                value={formData.address.cidade}
                onChange={handleAddressChange}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium" htmlFor="estado">
                Estado (UF)
              </label>
              <Input
                id="estado"
                name="estado"
                maxLength={2}
                value={formData.address.estado}
                onChange={handleAddressChange}
                placeholder="Ex: SP"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="cep">
                CEP
              </label>
              <Input
                id="cep"
                name="cep"
                value={formData.address.cep}
                onChange={handleAddressChange}
                placeholder="Ex: 12345-678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Responsáveis Técnicos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSupervisor}
            >
              Adicionar responsável
            </Button>
          </div>

          {formData.responsaveisTecnicos.map((supervisor, index) => (
            <div key={index} className="mb-4">
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">
                  Responsável Técnico {index + 1}
                </h4>
                {formData.responsaveisTecnicos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSupervisor(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={supervisor.nome}
                    onChange={(e) =>
                      handleSupervisorChange(index, "nome", e.target.value)
                    }
                    placeholder="Nome do farmacêutico"
                    required={index === 0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    CRF <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={supervisor.crf}
                    onChange={(e) =>
                      handleSupervisorChange(index, "crf", e.target.value)
                    }
                    placeholder="Número de registro no CRF"
                    required={index === 0}
                  />
                  <p className="form-hint">
                    Insira o número de registro no CRF do farmacêutico responsável
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Controle Mensal de RMNRs - Receitas A
          </h3>
          <div className="space-y-3">
            {formData.controlesMensaisA
              .slice() // Criar cópia para não mutar o original
              .sort((a, b) => b.year - a.year) // Ordenar do mais recente para o mais antigo
              .map((yearControl, sortedIndex) => {
                // Encontrar o índice original para as funções de atualização
                const yearIndex = formData.controlesMensaisA.findIndex(c => c.year === yearControl.year);
                const isCurrentYear = yearControl.year === currentYear;

                return (
                  <Collapsible
                    key={yearControl.year}
                    defaultOpen={isCurrentYear}
                    className="border rounded-lg"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            Ano {yearControl.year}
                            {isCurrentYear && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllMonths('A', yearIndex, !areAllMonthsMarked('A', yearIndex));
                            }}
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {areAllMonthsMarked('A', yearIndex) ? "Desmarcar tudo" : "Marcar tudo"}
                          </Button>
                          <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {months.map((month) => (
                            <div key={month.key} className="flex items-start space-x-2">
                              <Checkbox
                                id={`monthly-a-${yearControl.year}-${month.key}`}
                                checked={!!(yearControl as any)[month.key]}
                                onCheckedChange={(checked) =>
                                  handleMonthlyControlChange('A', yearIndex, month.key, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`monthly-a-${yearControl.year}-${month.key}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {month.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Controle Mensal de RMNRs - Receitas B2
          </h3>
          <div className="space-y-3">
            {formData.controlesMensaisB2
              .slice()
              .sort((a, b) => b.year - a.year)
              .map((yearControl, sortedIndex) => {
                const yearIndex = formData.controlesMensaisB2.findIndex(c => c.year === yearControl.year);
                const isCurrentYear = yearControl.year === currentYear;

                return (
                  <Collapsible
                    key={yearControl.year}
                    defaultOpen={isCurrentYear}
                    className="border rounded-lg"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            Ano {yearControl.year}
                            {isCurrentYear && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllMonths('B2', yearIndex, !areAllMonthsMarked('B2', yearIndex));
                            }}
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {areAllMonthsMarked('B2', yearIndex) ? "Desmarcar tudo" : "Marcar tudo"}
                          </Button>
                          <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {months.map((month) => (
                            <div key={month.key} className="flex items-start space-x-2">
                              <Checkbox
                                id={`monthly-b2-${yearControl.year}-${month.key}`}
                                checked={!!(yearControl as any)[month.key]}
                                onCheckedChange={(checked) =>
                                  handleMonthlyControlChange('B2', yearIndex, month.key, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`monthly-b2-${yearControl.year}-${month.key}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {month.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Controle Trimestral</h3>
          <div className="space-y-3">
            {formData.controlesTrimestrais
              .slice()
              .sort((a, b) => b.year - a.year)
              .map((yearControl, sortedIndex) => {
                const yearIndex = formData.controlesTrimestrais.findIndex(c => c.year === yearControl.year);
                const isCurrentYear = yearControl.year === currentYear;

                return (
                  <Collapsible
                    key={yearControl.year}
                    defaultOpen={isCurrentYear}
                    className="border rounded-lg"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            Ano {yearControl.year}
                            {isCurrentYear && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllQuarters(yearIndex, !areAllQuartersMarked(yearIndex));
                            }}
                          >
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {areAllQuartersMarked(yearIndex) ? "Desmarcar tudo" : "Marcar tudo"}
                          </Button>
                          <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {quarters.map((quarter) => (
                            <div key={quarter.key} className="flex items-start space-x-2">
                              <Checkbox
                                id={`quarterly-${yearControl.year}-${quarter.key}`}
                                checked={!!(yearControl as any)[quarter.key]}
                                onCheckedChange={(checked) =>
                                  handleQuarterlyControlChange(yearIndex, quarter.key, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`quarterly-${yearControl.year}-${quarter.key}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {quarter.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="observacoes">
              Observações
            </label>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={4}
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Observações adicionais sobre a farmácia..."
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || cnpjStatus === 'exists' || cnpjStatus === 'invalid' || cnpjStatus === 'checking'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isEditing ? "Salvando..." : "Cadastrando..."}
            </>
          ) : (
            isEditing ? "Salvar Alterações" : "Cadastrar Farmácia"
          )}
        </Button>
      </div>
    </form >
  );
};

export default PharmacyForm;
