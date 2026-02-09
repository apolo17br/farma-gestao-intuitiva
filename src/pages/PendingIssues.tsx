
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, Edit, Search, Filter, ChevronDown, ChevronRight, RotateCcw, BarChart3, Users, AlertTriangle } from "lucide-react";
import { formatCnpjDisplay } from "../utils/formatters";

const PendingIssues: React.FC = () => {
  const { pharmacies } = usePharmacy();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("pharmacy");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Identificar farmácias sem responsável técnico
  const pharmaciesWithoutTechnical = useMemo(() => {
    return pharmacies.filter(
      (pharmacy) =>
        !pharmacy.responsaveisTecnicos ||
        pharmacy.responsaveisTecnicos.length === 0 ||
        pharmacy.responsaveisTecnicos.some(
          (supervisor) => !supervisor.nome || !supervisor.crf
        )
    );
  }, [pharmacies]);

  // Filtrar e ordenar dados
  const filteredPharmacies = useMemo(() => {
    let filtered = pharmaciesWithoutTechnical;

    // Aplicar busca por texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pharmacy =>
        pharmacy.nomeFantasia?.toLowerCase().includes(searchLower) ||
        pharmacy.razaoSocial?.toLowerCase().includes(searchLower) ||
        pharmacy.cnpj?.includes(searchTerm)
      );
    }

    // Ordenar
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "pharmacy":
          return (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial);
        case "cnpj":
          return a.cnpj.localeCompare(b.cnpj);
        case "date":
          return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
        default:
          return 0;
      }
    });
  }, [pharmaciesWithoutTechnical, searchTerm, sortBy]);

  // Função para limpar filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setSortBy("pharmacy");
    setExpandedItems(new Set());
  };

  // Função para alternar expansão
  const toggleExpansion = (pharmacyId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(pharmacyId)) {
      newExpanded.delete(pharmacyId);
    } else {
      newExpanded.add(pharmacyId);
    }
    setExpandedItems(newExpanded);
  };

  // Componente para gráfico de barras simples
  const SimpleBarChart = ({ data }: { data: { [key: string]: number } }) => {
    const maxValue = Math.max(...Object.values(data));
    const entries = Object.entries(data);

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-3 text-xs">
            <span className="w-20 truncate text-left">{key}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Dados para gráficos
  const chartData = useMemo(() => {
    const data = {
      "Sem Responsável": pharmaciesWithoutTechnical.length,
      "Com Responsável": pharmacies.length - pharmaciesWithoutTechnical.length
    };
    return data;
  }, [pharmaciesWithoutTechnical.length, pharmacies.length]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pendências</h1>
            <p className="text-muted-foreground">
              Gerencie as pendências de responsáveis técnicos das farmácias
            </p>
          </div>
        </div>

        {/* Cards informativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pendências</p>
                  <p className="text-2xl font-bold">{pharmaciesWithoutTechnical.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Farmácias Regulares</p>
                  <p className="text-2xl font-bold">{pharmacies.length - pharmaciesWithoutTechnical.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Farmácias</p>
                  <p className="text-2xl font-bold">{pharmacies.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de distribuição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={chartData} />
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Filtros e Ordenação</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200 hover:border-yellow-400"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar farmácia..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Nome da farmácia</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="date">Data de cadastro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de pendências */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Farmácias sem Responsável Técnico
              <Badge variant="secondary">{filteredPharmacies.length} pendências</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPharmacies.length > 0 ? (
              <div className="divide-y">
                {filteredPharmacies.map((pharmacy) => {
                  const isExpanded = expandedItems.has(pharmacy.id);

                  return (
                    <Collapsible key={pharmacy.id} open={isExpanded} onOpenChange={() => toggleExpansion(pharmacy.id)}>
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/farmacias/${pharmacy.id}`}
                                className="text-lg font-medium hover:text-primary block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                              </Link>
                              <div className="text-sm text-muted-foreground mt-1">
                                CNPJ: {formatCnpjDisplay(pharmacy.cnpj)}
                              </div>
                              <div className="mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Responsável técnico não cadastrado
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="cursor-help">
                                    <BarChart3 className="mr-1 h-3 w-3" />
                                    Detalhes
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="p-2">
                                    <p className="font-medium mb-2">Informações da Farmácia</p>
                                    <div className="space-y-1 text-xs">
                                      <p><strong>Telefone:</strong> {pharmacy.telefone || "Não informado"}</p>
                                      <p><strong>E-mail:</strong> {pharmacy.email || "Não informado"}</p>
                                      <p><strong>Alvará:</strong> {pharmacy.alvara || "Não informado"}</p>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>

                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t bg-muted/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                              <h4 className="font-medium mb-2">Informações de Contato</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Telefone:</strong> {pharmacy.telefone || "Não informado"}</p>
                                <p><strong>E-mail:</strong> {pharmacy.email || "Não informado"}</p>
                                <p><strong>Alvará:</strong> {pharmacy.alvara || "Não informado"}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Ações</h4>
                              <div className="flex gap-2">
                                <Link to={`/farmacias/${pharmacy.id}/editar`}>
                                  <Button size="sm" variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                </Link>
                                <Link to={`/farmacias/${pharmacy.id}`}>
                                  <Button size="sm" variant="outline">
                                    Ver Detalhes
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma pendência encontrada</h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "Tente ajustar os filtros para ver mais resultados."
                        : "Todas as farmácias possuem responsáveis técnicos cadastrados!"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default PendingIssues;
