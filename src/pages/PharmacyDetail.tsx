import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, ArrowLeft, Check, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Pharmacy, TechnicalSupervisor } from "../types/pharmacy.types";

const PharmacyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPharmacy, deletePharmacy, loading, selectedYear, setSelectedYear } = usePharmacy();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);

  useEffect(() => {
    const fetchPharmacy = async () => {
      if (id) {
        const data = await getPharmacy(id);
        setPharmacy(data);
      }
    };
    fetchPharmacy();
  }, [id, getPharmacy]);

  if (loading || !pharmacy) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await deletePharmacy(pharmacy.id);
    navigate("/farmacias");
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


  const getControlForYear = (controls: any[]) => {
    if (!controls || !Array.isArray(controls)) return {};
    return controls.find(c => {
      if (!c.created_at) return false;
      return new Date(c.created_at).getFullYear() === selectedYear
    }) || {};
  };

  const currentMonthlyA = pharmacy ? getControlForYear(pharmacy.controlesMensaisA) : {};
  const currentMonthlyB2 = pharmacy ? getControlForYear(pharmacy.controlesMensaisB2) : {};
  const currentQuarterly = pharmacy ? getControlForYear(pharmacy.controlesTrimestrais) : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/farmacias")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Farmácia</h1>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-2 bg-card border rounded-md p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[3rem] text-center">{selectedYear}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(selectedYear + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Link to={`/farmacias/${pharmacy.id}/editar`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10 w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirma a exclusão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a
                  farmácia {pharmacy.nomeFantasia || pharmacy.razaoSocial} e todos
                  os dados associados a ela.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{pharmacy.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{pharmacy.razaoSocial}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{pharmacy.nomeFantasia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{pharmacy.telefone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alvará</p>
                  <p className="font-medium">{pharmacy.alvara || "Não informado"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{pharmacy.email || "Não informado"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground" /> Endereço
                </h3>
                {pharmacy.address ? (
                  <div className="pl-4 border-l-2 border-primary/30 space-y-2 text-sm">
                    <p>
                      {pharmacy.address.logradouro}
                      {pharmacy.address.numero ? `, ${pharmacy.address.numero}` : ''}
                      {pharmacy.address.complemento ? ` - ${pharmacy.address.complemento}` : ''}
                    </p>
                    <p>
                      {pharmacy.address.bairro ? `${pharmacy.address.bairro}, ` : ''}
                      {pharmacy.address.cidade || ''}
                      {pharmacy.address.estado ? ` - ${pharmacy.address.estado.toUpperCase()}` : ''}
                    </p>
                    {pharmacy.address.cep && (
                      <p>CEP: {pharmacy.address.cep}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pl-4">
                    Endereço não informado.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Responsáveis Técnicos</h3>
                {pharmacy.responsaveisTecnicos && pharmacy.responsaveisTecnicos.length > 0 ? (
                  <div className="space-y-4">
                    {pharmacy.responsaveisTecnicos.map((supervisor: TechnicalSupervisor, index: number) => (
                      <div key={index} className="pl-4 border-l-2 border-primary/30">
                        <p className="font-medium">{supervisor.nome || "Nome não informado"}</p>
                        <p className="text-sm text-muted-foreground">
                          CRF: {supervisor.crf || "CRF não informado"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum responsável técnico cadastrado
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">Datas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">
                      {pharmacy.dataCadastro
                        ? format(new Date(pharmacy.dataCadastro), "PPP", { locale: ptBR })
                        : "Data não informada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-medium">
                      {pharmacy.ultimaAtualizacao
                        ? format(new Date(pharmacy.ultimaAtualizacao), "PPP 'às' p", { locale: ptBR })
                        : "Nunca atualizada"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Controle Mensal de RMNRs - Receitas A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {months.map((month) => (
                  <div key={month.key} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-sm border ${currentMonthlyA[month.key]
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                      }`}>
                      {currentMonthlyA[month.key] && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{month.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controle Mensal de RMNRs - Receitas B2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {months.map((month) => (
                  <div key={month.key} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-sm border ${currentMonthlyB2[month.key]
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                      }`}>
                      {currentMonthlyB2[month.key] && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{month.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controle Trimestral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quarters.map((quarter) => (
                  <div key={quarter.key} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-sm border ${currentQuarterly[quarter.key]
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                      }`}>
                      {currentQuarterly[quarter.key] && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{quarter.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {pharmacy.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{pharmacy.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PharmacyDetail;
