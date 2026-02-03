import React, { useEffect, useState, useMemo } from "react";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Calendar, History, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Dashboard: React.FC = () => {
  const { pharmacies, loading, selectedYear, setSelectedYear } = usePharmacy();
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Dados para os indicadores
  const totalPharmacies = pharmacies?.length || 0;
  const pharmaciesWithoutTechnical = (pharmacies || []).filter(
    (pharmacy) =>
      !pharmacy?.responsaveisTecnicos ||
      pharmacy.responsaveisTecnicos.length === 0 ||
      pharmacy.responsaveisTecnicos.some(
        (supervisor) => !supervisor?.nome || !supervisor?.crf
      )
  );

  // Calcular pendências de controles
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const monthPropertyMapping: { [key: number]: string } = {
    0: "janeiro", 1: "fevereiro", 2: "marco", 3: "abril",
    4: "maio", 5: "junho", 6: "julho", 7: "agosto",
    8: "setembro", 9: "outubro", 10: "novembro", 11: "dezembro",
  };

  const isControlPending = (control: string): boolean => {
    return !control || control.trim() === "";
  };

  // Contar pendências de controles (usando a mesma lógica do Deadlines)
  const pendingControls = useMemo(() => {
    const pendingData: { [month: string]: { [category: string]: any[] } } = {};

    // Inicializar estrutura para todos os meses
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    for (let month = 0; month < 12; month++) {
      const monthName = monthNames[month];
      pendingData[monthName] = {
        "Receitas A": [],
        "Receitas B2": [],
        "Trimestral": []
      };
    }

    const monthPropertyMapping: { [key: number]: string } = {
      0: "janeiro", 1: "fevereiro", 2: "marco", 3: "abril",
      4: "maio", 5: "junho", 6: "julho", 7: "agosto",
      8: "setembro", 9: "outubro", 10: "novembro", 11: "dezembro",
    };

    const quarterPropertyMapping: { [key: number]: string } = {
      1: "primeiro", 2: "segundo", 3: "terceiro", 4: "quarto",
    };

    pharmacies.forEach(pharmacy => {
      // Verificar controles mensais A
      Object.entries(pharmacy.controlesMensaisA).forEach(([monthKey, control]) => {
        if (isControlPending(control)) {
          const monthIndex = Object.keys(monthPropertyMapping).find(
            key => monthPropertyMapping[parseInt(key)] === monthKey
          );
          if (monthIndex !== undefined) {
            const monthName = monthNames[parseInt(monthIndex)];
            pendingData[monthName]["Receitas A"].push({
              pharmacy,
              month: monthName,
              category: "Receitas A",
              type: "monthly"
            });
          }
        }
      });

      // Verificar controles mensais B2
      Object.entries(pharmacy.controlesMensaisB2).forEach(([monthKey, control]) => {
        if (isControlPending(control)) {
          const monthIndex = Object.keys(monthPropertyMapping).find(
            key => monthPropertyMapping[parseInt(key)] === monthKey
          );
          if (monthIndex !== undefined) {
            const monthName = monthNames[parseInt(monthIndex)];
            pendingData[monthName]["Receitas B2"].push({
              pharmacy,
              month: monthName,
              category: "Receitas B2",
              type: "monthly"
            });
          }
        }
      });

      // Verificar controles trimestrais
      Object.entries(pharmacy.controlesTrimestrais).forEach(([quarterKey, control]) => {
        if (isControlPending(control)) {
          const quarterNumber = Object.keys(quarterPropertyMapping).find(
            key => quarterPropertyMapping[parseInt(key)] === quarterKey
          );
          if (quarterNumber !== undefined) {
            const quarter = parseInt(quarterNumber);
            // Mapear trimestre para meses
            const monthsInQuarter = [
              [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]
            ];
            monthsInQuarter[quarter - 1].forEach(monthIndex => {
              const monthName = monthNames[monthIndex];
              pendingData[monthName]["Trimestral"].push({
                pharmacy,
                month: monthName,
                category: "Trimestral",
                type: "quarterly",
                quarter
              });
            });
          }
        }
      });
    });

    // Contar total de pendências
    let totalPending = 0;
    let monthlyA = 0;
    let monthlyB2 = 0;
    let quarterly = 0;

    Object.values(pendingData).forEach(monthData => {
      Object.entries(monthData).forEach(([category, items]) => {
        totalPending += items.length;
        if (category === "Receitas A") monthlyA += items.length;
        if (category === "Receitas B2") monthlyB2 += items.length;
        if (category === "Trimestral") quarterly += items.length;
      });
    });

    return { totalPending, monthlyA, monthlyB2, quarterly };
  }, [pharmacies]);

  // Calcular campos em branco
  const missingFields = useMemo(() => {
    let missingTelefone = 0;
    let missingEmail = 0;
    let missingAlvara = 0;
    let missingEndereco = 0;

    pharmacies.forEach(pharmacy => {
      if (!pharmacy.telefone || pharmacy.telefone.trim() === "") missingTelefone++;
      if (!pharmacy.email || pharmacy.email.trim() === "") missingEmail++;
      if (!pharmacy.alvara || pharmacy.alvara.trim() === "") missingAlvara++;
      if (!pharmacy.address ||
        (!pharmacy.address.logradouro && !pharmacy.address.bairro &&
          !pharmacy.address.cidade && !pharmacy.address.estado)) missingEndereco++;
    });

    return { missingTelefone, missingEmail, missingAlvara, missingEndereco };
  }, [pharmacies]);

  // Agrupar farmácias por mês de cadastro
  const groupByMonth = () => {
    const months = [
      "Jan", "Fev", "Mar", "Abr",
      "Mai", "Jun", "Jul", "Ago",
      "Set", "Out", "Nov", "Dez"
    ];

    const currentYear = new Date().getFullYear();
    const yearShort = currentYear.toString().slice(-2);

    const monthData = months.map((month, index) => ({
      name: `${month}/${yearShort}`,
      quantidade: 0,
    }));

    (pharmacies || []).forEach((pharmacy) => {
      if (pharmacy?.dataCadastro) {
        const date = new Date(pharmacy.dataCadastro);
        const month = date.getMonth();
        if (monthData[month]) {
          monthData[month].quantidade += 1;
        }
      }
    });

    return monthData;
  };

  // Ordenar farmácias por data de atualização
  const recentPharmacies = [...(pharmacies || [])]
    .sort((a, b) => {
      const dateA = a?.ultimaAtualizacao ? new Date(a.ultimaAtualizacao).getTime() : 0;
      const dateB = b?.ultimaAtualizacao ? new Date(b.ultimaAtualizacao).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Ordenar todas as farmácias por data de atualização para o histórico completo
  const allPharmaciesHistory = [...(pharmacies || [])]
    .sort((a, b) => {
      const dateA = a?.ultimaAtualizacao ? new Date(a.ultimaAtualizacao).getTime() : 0;
      const dateB = b?.ultimaAtualizacao ? new Date(b.ultimaAtualizacao).getTime() : 0;
      return dateB - dateA;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 bg-card border rounded-md p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(selectedYear - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold min-w-[3rem] text-center">{selectedYear}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedYear(selectedYear + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Total de Farmácias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalPharmacies}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Farmácias cadastradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Pendências Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pharmaciesWithoutTechnical.length}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sem responsável técnico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Controles Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pendingControls.totalPending}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Controles em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Campos Incompletos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {missingFields.missingTelefone + missingFields.missingEmail +
                missingFields.missingAlvara + missingFields.missingEndereco}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Informações em branco
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Farmácias Cadastradas por Mês</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupByMonth()}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} farmácias`, "Quantidade"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {groupByMonth().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.quantidade > 0 ? "#3B82F6" : "#E5E7EB"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Pendências</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Receitas A", value: pendingControls.monthlyA, fill: "#3B82F6" },
                    { name: "Receitas B2", value: pendingControls.monthlyB2, fill: "#1D4ED8" },
                    { name: "Trimestral", value: pendingControls.quarterly, fill: "#1E40AF" }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={9}
                >
                  {[
                    { name: "Receitas A", value: pendingControls.monthlyA },
                    { name: "Receitas B2", value: pendingControls.monthlyB2 },
                    { name: "Trimestral", value: pendingControls.quarterly }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "Receitas A" ? "#3B82F6" : entry.name === "Receitas B2" ? "#1D4ED8" : "#1E40AF"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} pendências`, "Quantidade"]}
                  labelFormatter={(label) => `Categoria: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campos em Branco</CardTitle>
          </CardHeader>
          <CardContent className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Telefone", value: missingFields.missingTelefone },
                  { name: "E-mail", value: missingFields.missingEmail },
                  { name: "Alvará", value: missingFields.missingAlvara },
                  { name: "Endereço", value: missingFields.missingEndereco }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} farmácias`, "Quantidade"]}
                  labelFormatter={(label) => `Campo: ${label}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#3B82F6" />
                  <Cell fill="#1D4ED8" />
                  <Cell fill="#1E40AF" />
                  <Cell fill="#1E3A8A" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Farmácias Recentemente Atualizadas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Ver histórico completo</span>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPharmacies.length > 0 ? (
              <div className="space-y-4">
                {recentPharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className="flex justify-between items-center border-b pb-2 last:border-0"
                  >
                    <div>
                      <Link
                        to={`/farmacias/${pharmacy.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {pharmacy.cnpj}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Atualizado{" "}
                      {formatDistanceToNow(
                        new Date(pharmacy.ultimaAtualizacao),
                        { addSuffix: true, locale: ptBR }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-60">
                <p className="text-muted-foreground text-center">
                  Nenhuma farmácia cadastrada.
                  <br />
                  <Link to="/farmacias/nova" className="text-primary hover:underline">
                    Cadastre uma nova farmácia
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Farmácias sem Responsável Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            {pharmaciesWithoutTechnical.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Nome</th>
                      <th className="text-left py-2 px-2">CNPJ</th>
                      <th className="text-left py-2 px-2">Telefone</th>
                      <th className="text-right py-2 px-2">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmaciesWithoutTechnical.slice(0, 5).map((pharmacy) => (
                      <tr key={pharmacy.id} className="border-b">
                        <td className="py-2 px-2">
                          {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                        </td>
                        <td className="py-2 px-2">{pharmacy.cnpj}</td>
                        <td className="py-2 px-2">{pharmacy.telefone}</td>
                        <td className="py-2 px-2 text-right">
                          <Link
                            to={`/farmacias/${pharmacy.id}/editar`}
                            className="text-primary hover:underline"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pharmaciesWithoutTechnical.length > 5 && (
                  <div className="mt-4">
                    <Link
                      to="/pendencias"
                      className="text-primary text-sm hover:underline"
                    >
                      Ver todas as pendências ({pharmaciesWithoutTechnical.length})
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">
                  Não há farmácias sem responsável técnico.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de histórico completo */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico Completo de Atualizações
            </DialogTitle>
            <DialogDescription>
              Lista de todas as farmácias ordenadas por data de atualização
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {allPharmaciesHistory.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div>
                    <Link
                      to={`/farmacias/${pharmacy.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {pharmacy.cnpj}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      Atualizado{" "}
                      {formatDistanceToNow(
                        new Date(pharmacy.ultimaAtualizacao || pharmacy.dataCadastro),
                        { addSuffix: true, locale: ptBR }
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {pharmacy.ultimaAtualizacao ?
                        format(new Date(pharmacy.ultimaAtualizacao), "dd/MM/yyyy HH:mm") :
                        "Nunca atualizado"
                      }
                    </span>
                  </div>
                </div>
              ))}

              {allPharmaciesHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma farmácia cadastrada no sistema.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
