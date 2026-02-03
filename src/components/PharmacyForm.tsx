import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Pharmacy, TechnicalSupervisor, MonthlyControl, QuarterlyControl, Address } from "../types/pharmacy.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

const emptyAddress: Address = {
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  complemento: "",
};

const emptyPharmacy = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  telefone: "",
  alvara: "",
  email: "",
  responsaveisTecnicos: [{ nome: "", crf: "" }],
  controlesMensaisA: {
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
  },
  controlesMensaisB2: {
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
  },
  controlesTrimestrais: {
    primeiro: "",
    segundo: "",
    terceiro: "",
    quarto: "",
  },
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

// Função auxiliar para garantir que os controles mensais não sejam null/undefined
const ensureMonthlyControls = (controls: MonthlyControl | null | undefined): MonthlyControl => {
  const defaultControls: MonthlyControl = {
    janeiro: "", fevereiro: "", marco: "", abril: "", maio: "", junho: "",
    julho: "", agosto: "", setembro: "", outubro: "", novembro: "", dezembro: ""
  };
  if (!controls) return defaultControls;
  // Garante que cada mês tenha um valor string
  Object.keys(defaultControls).forEach(key => {
    const monthKey = key as keyof MonthlyControl;
    (defaultControls[monthKey] as string) = ensureString(controls[monthKey]);
  });
  return defaultControls;
};

// Função auxiliar para garantir que os controles trimestrais não sejam null/undefined
const ensureQuarterlyControls = (controls: QuarterlyControl | null | undefined): QuarterlyControl => {
  const defaultControls: QuarterlyControl = {
    primeiro: "", segundo: "", terceiro: "", quarto: ""
  };
  if (!controls) return defaultControls;
  // Garante que cada trimestre tenha um valor string
  Object.keys(defaultControls).forEach(key => {
    const quarterKey = key as keyof QuarterlyControl;
    (defaultControls[quarterKey] as string) = ensureString(controls[quarterKey]);
  });
  return defaultControls;
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
        controlesMensaisA: ensureMonthlyControls(pharmacy.controlesMensaisA),
        controlesMensaisB2: ensureMonthlyControls(pharmacy.controlesMensaisB2),
        controlesTrimestrais: ensureQuarterlyControls(pharmacy.controlesTrimestrais),
        address: ensureAddress(pharmacy.address),
      };
    } else {
      return { ...emptyPharmacy, address: { ...emptyAddress } };
    }
  });

  const { addPharmacy, updatePharmacy, selectedYear } = usePharmacy();
  const navigate = useNavigate();

  useEffect(() => {
    if (pharmacy) {
      setFormData((prev) => ({
        ...prev,
        cnpj: ensureString(pharmacy.cnpj),
        razaoSocial: ensureString(pharmacy.razaoSocial),
        nomeFantasia: ensureString(pharmacy.nomeFantasia),
        telefone: ensureString(pharmacy.telefone),
        alvara: ensureString(pharmacy.alvara),
        email: ensureString(pharmacy.email),
        observacoes: ensureString(pharmacy.observacoes),
        responsaveisTecnicos: ensureSupervisors(pharmacy.responsaveisTecnicos),
        controlesMensaisA: ensureMonthlyControls(pharmacy.controlesMensaisA),
        controlesMensaisB2: ensureMonthlyControls(pharmacy.controlesMensaisB2),
        controlesTrimestrais: ensureQuarterlyControls(pharmacy.controlesTrimestrais),
        address: ensureAddress(pharmacy.address),
      }));
    } else {
      setFormData({ ...emptyPharmacy, address: { ...emptyAddress } });
    }
  }, [pharmacy]);

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

  const handleMonthlyControlChange = (type: 'A' | 'B2', month: string, checked: boolean) => {
    if (type === 'A') {
      setFormData((prev) => ({
        ...prev,
        controlesMensaisA: {
          ...prev.controlesMensaisA,
          [month]: checked ? "realizado" : "",
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        controlesMensaisB2: {
          ...prev.controlesMensaisB2,
          [month]: checked ? "realizado" : "",
        },
      }));
    }
  };

  const handleQuarterlyControlChange = (quarter: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      controlesTrimestrais: {
        ...prev.controlesTrimestrais,
        [quarter]: checked ? "realizado" : "",
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Preparar dados para enviar (incluindo address)
    const dataToSend = { ...formData };

    if (isEditing && pharmacy) {
      updatePharmacy({
        ...pharmacy,
        ...dataToSend,
      });
      navigate(`/farmacias/${pharmacy.id}`);
    } else {
      addPharmacy(dataToSend);
      navigate("/farmacias");
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
          <h3 className="text-lg font-semibold mb-4">Dados da Farmácia ({selectedYear})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cnpj">
                CNPJ <span className="text-destructive">*</span>
              </label>
              <Input
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                required
              />
              <p className="form-hint">Digite apenas os números do CNPJ</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {months.map((month) => (
              <div key={month.key} className="flex items-start space-x-2">
                <Checkbox
                  id={`monthly-a-${month.key}`}
                  checked={!!formData.controlesMensaisA[month.key]}
                  onCheckedChange={(checked) =>
                    handleMonthlyControlChange('A', month.key, checked as boolean)
                  }
                />
                <label
                  htmlFor={`monthly-a-${month.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {month.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Controle Mensal de RMNRs - Receitas B2
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {months.map((month) => (
              <div key={month.key} className="flex items-start space-x-2">
                <Checkbox
                  id={`monthly-b2-${month.key}`}
                  checked={!!formData.controlesMensaisB2[month.key]}
                  onCheckedChange={(checked) =>
                    handleMonthlyControlChange('B2', month.key, checked as boolean)
                  }
                />
                <label
                  htmlFor={`monthly-b2-${month.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {month.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Controle Trimestral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quarters.map((quarter) => (
              <div key={quarter.key} className="flex items-start space-x-2">
                <Checkbox
                  id={`quarterly-${quarter.key}`}
                  checked={!!formData.controlesTrimestrais[quarter.key]}
                  onCheckedChange={(checked) =>
                    handleQuarterlyControlChange(quarter.key, checked as boolean)
                  }
                />
                <label
                  htmlFor={`quarterly-${quarter.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {quarter.label}
                </label>
              </div>
            ))}
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
        >
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? "Salvar Alterações" : "Cadastrar Farmácia"}
        </Button>
      </div>
    </form>
  );
};

export default PharmacyForm;
