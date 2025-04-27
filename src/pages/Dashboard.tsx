import React, { useEffect, useState } from "react";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Calendar } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard: React.FC = () => {
  const { pharmacies, loading } = usePharmacy();

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

  // Agrupar farmácias por mês de cadastro
  const groupByMonth = () => {
    const months = [
      "Jan", "Fev", "Mar", "Abr", 
      "Mai", "Jun", "Jul", "Ago", 
      "Set", "Out", "Nov", "Dez"
    ];

    const monthData = months.map((month, index) => ({
      name: month,
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
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              Pendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{pharmaciesWithoutTechnical.length}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Farmácias sem responsável técnico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Controle mensal atual
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
            <CardTitle>Farmácias Recentemente Atualizadas</CardTitle>
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
    </div>
  );
};

export default Dashboard;
