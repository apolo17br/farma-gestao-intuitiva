
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
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

const PharmacyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPharmacy, deletePharmacy } = usePharmacy();
  
  const pharmacy = getPharmacy(id || "");

  if (!pharmacy) {
    return (
      <div className="text-center p-10">
        <h1 className="text-3xl font-bold mb-4">Farmácia não encontrada</h1>
        <p className="text-muted-foreground mb-4">
          A farmácia solicitada não existe ou foi removida.
        </p>
        <Link to="/farmacias">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
          </Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    deletePharmacy(pharmacy.id);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Farmácia</h1>
        </div>
        <div className="flex gap-2">
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
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{pharmacy.email || "Não informado"}</p>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Responsáveis Técnicos</h3>
                {pharmacy.responsaveisTecnicos && pharmacy.responsaveisTecnicos.length > 0 ? (
                  <div className="space-y-4">
                    {pharmacy.responsaveisTecnicos.map((supervisor, index) => (
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
                      {format(new Date(pharmacy.dataCadastro), "PPP", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-medium">
                      {format(new Date(pharmacy.ultimaAtualizacao), "PPP 'às' p", { locale: ptBR })}
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
              <CardTitle>Controle Mensal de RMNRs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {months.map((month) => (
                  <div key={month.key}>
                    <p className="text-sm text-muted-foreground">{month.label}</p>
                    <p className="font-medium">
                      {pharmacy.controlesMensais[month.key] || "-"}
                    </p>
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
                  <div key={quarter.key}>
                    <p className="text-sm text-muted-foreground">{quarter.label}</p>
                    <p className="font-medium">
                      {pharmacy.controlesTrimestrais[quarter.key] || "-"}
                    </p>
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
