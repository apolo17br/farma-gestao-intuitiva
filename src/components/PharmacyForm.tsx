import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Pharmacy } from "../types/pharmacy.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

const emptyPharmacy = {
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  telefone: "",
  email: "",
  responsaveisTecnicos: [{ nome: "", crf: "" }],
  controlesMensais: {
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
};

interface PharmacyFormProps {
  pharmacy?: Pharmacy;
  isEditing?: boolean;
}

const PharmacyForm: React.FC<PharmacyFormProps> = ({ pharmacy, isEditing = false }) => {
  const [formData, setFormData] = useState<Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao">>(
    pharmacy ? { ...pharmacy } : { ...emptyPharmacy }
  );

  const { addPharmacy, updatePharmacy } = usePharmacy();
  const navigate = useNavigate();

  useEffect(() => {
    if (pharmacy) {
      setFormData({ ...pharmacy });
    } else {
      setFormData({ ...emptyPharmacy });
    }
  }, [pharmacy]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupervisorChange = (
    index: number,
    field: "nome" | "crf",
    value: string
  ) => {
    const newSupervisors = [...formData.responsaveisTecnicos];
    newSupervisors[index] = {
      ...newSupervisors[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      responsaveisTecnicos: newSupervisors,
    }));
  };

  const handleAddSupervisor = () => {
    if (formData.responsaveisTecnicos.length < 3) {
      setFormData((prev) => ({
        ...prev,
        responsaveisTecnicos: [...prev.responsaveisTecnicos, { nome: "", crf: "" }],
      }));
    }
  };

  const handleRemoveSupervisor = (index: number) => {
    const newSupervisors = [...formData.responsaveisTecnicos];
    newSupervisors.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      responsaveisTecnicos: newSupervisors,
    }));
  };

  const handleMonthlyControlChange = (month: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      controlesMensais: {
        ...prev.controlesMensais,
        [month]: checked ? "realizado" : "",
      },
    }));
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

    if (isEditing && pharmacy) {
      updatePharmacy({
        ...pharmacy,
        ...formData,
      });
      navigate(`/farmacias/${pharmacy.id}`);
    } else {
      addPharmacy(formData);
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
          <h3 className="text-lg font-semibold mb-4">Dados da Farmácia</h3>
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
                Telefone <span className="text-destructive">*</span>
              </label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                required
              />
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Responsáveis Técnicos</h3>
            {formData.responsaveisTecnicos.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSupervisor}
              >
                Adicionar responsável
              </Button>
            )}
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
            Controle Mensal de RMNRs (Receitas A e B2)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {months.map((month) => (
              <div key={month.key} className="flex items-start space-x-2">
                <Checkbox
                  id={`monthly-${month.key}`}
                  checked={!!formData.controlesMensais[month.key]}
                  onCheckedChange={(checked) => 
                    handleMonthlyControlChange(month.key, checked as boolean)
                  }
                />
                <label
                  htmlFor={`monthly-${month.key}`}
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
