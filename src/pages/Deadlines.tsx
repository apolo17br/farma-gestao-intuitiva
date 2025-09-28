import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Edit, Search, Filter, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, RotateCcw, BarChart3, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";

const Deadlines: React.FC = () => {
  const { pharmacies } = usePharmacy();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("pharmacy");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [activeTab, setActiveTab] = useState<string>("monthly");

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Mapeamento de índice do mês para nome da propriedade no objeto
  const monthPropertyMapping: { [key: number]: string } = {
    0: "janeiro", 1: "fevereiro", 2: "marco", 3: "abril",
    4: "maio", 5: "junho", 6: "julho", 7: "agosto",
    8: "setembro", 9: "outubro", 10: "novembro", 11: "dezembro",
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Função para verificar se um controle está pendente
  const isControlPending = (control: string): boolean => {
    return !control || control.trim() === "";
  };

  // Função para obter o trimestre de um mês
  const getQuarter = (month: number): number => {
    return Math.floor(month / 3) + 1;
  };

  const quarterPropertyMapping: { [key: number]: string } = {
    1: "primeiro", 2: "segundo", 3: "terceiro", 4: "quarto",
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedMonth("all");
    setSelectedCategory("all");
    setSortBy("pharmacy");
    setExpandedMonths(new Set());
    setExpandedCategories(new Set());
  };

  // Função para alternar expansão de mês
  const toggleMonthExpansion = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  // Função para alternar expansão de categoria
  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Função para alternar ordem de classificação
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "newest" ? "oldest" : "newest");
  };

  // Processar todas as pendências por mês e categoria
  const allPendingData = useMemo(() => {
    const pendingData: { [month: string]: { [category: string]: any[] } } = {};

    // Inicializar estrutura para todos os meses
    for (let month = 0; month < 12; month++) {
      const monthName = monthNames[month];
      pendingData[monthName] = {
        "Receitas A": [],
        "Receitas B2": [],
        "Trimestral": []
      };
    }

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

    return pendingData;
  }, [pharmacies]);

  // Filtrar dados baseado nos filtros selecionados
  const filteredData = useMemo(() => {
    let filtered = allPendingData;

    // Filtrar por mês
    if (selectedMonth !== "all") {
      const filteredByMonth: { [month: string]: { [category: string]: any[] } } = {};
      filteredByMonth[selectedMonth] = filtered[selectedMonth] || { "Receitas A": [], "Receitas B2": [], "Trimestral": [] };
      filtered = filteredByMonth;
    }

    // Filtrar por categoria
    if (selectedCategory !== "all") {
      Object.keys(filtered).forEach(month => {
        Object.keys(filtered[month]).forEach(category => {
          if (category !== selectedCategory) {
            filtered[month][category] = [];
          }
        });
      });
    }

    // Aplicar busca por texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(month => {
        Object.keys(filtered[month]).forEach(category => {
          filtered[month][category] = filtered[month][category].filter(item =>
            item.pharmacy.nomeFantasia?.toLowerCase().includes(searchLower) ||
            item.pharmacy.razaoSocial?.toLowerCase().includes(searchLower) ||
            item.pharmacy.cnpj?.includes(searchTerm)
          );
        });
      });
    }

    return filtered;
  }, [allPendingData, selectedMonth, selectedCategory, searchTerm]);

  // Contar total de pendências
  const totalPending = useMemo(() => {
    let total = 0;
    Object.values(filteredData).forEach(monthData => {
      Object.values(monthData).forEach(categoryData => {
        total += categoryData.length;
      });
    });
    return total;
  }, [filteredData]);

  // Obter meses com pendências e ordenar
  const monthsWithPending = Object.keys(filteredData)
    .filter(month => {
      const monthData = filteredData[month];
      return Object.values(monthData).some(categoryData => categoryData.length > 0);
    })
    .sort((a, b) => {
      const monthIndexA = monthNames.indexOf(a);
      const monthIndexB = monthNames.indexOf(b);
      
      if (sortOrder === "newest") {
        // Mais recente primeiro (mês atual primeiro, depois em ordem decrescente)
        if (monthIndexA === currentMonth) return -1;
        if (monthIndexB === currentMonth) return 1;
        return monthIndexB - monthIndexA;
      } else {
        // Mais antigo primeiro
        return monthIndexA - monthIndexB;
      }
    });

  // Componente para gráfico de barras simples
  const SimpleBarChart = ({ data, type }: { data: { [key: string]: number }, type: "category" | "month" }) => {
    const maxValue = Math.max(...Object.values(data));
    const entries = Object.entries(data);
    
    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-left text-xs">{key}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right font-medium text-xs">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Prazos e Pendências</h1>
            <p className="text-muted-foreground">
              Gerencie os controles mensais e trimestrais das farmácias
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
                  <p className="text-2xl font-bold">{totalPending}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Meses com Pendências</p>
                  <p className="text-2xl font-bold">{monthsWithPending.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

      <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Farmácias Ativas</p>
                  <p className="text-2xl font-bold">{pharmacies.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de distribuição geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Pendências
          </CardTitle>
        </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Por Categoria</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { 
                            name: "Receitas A", 
                            value: Object.values(filteredData).reduce((sum, monthData) => 
                              sum + (monthData["Receitas A"]?.length || 0), 0),
                            fill: "#3B82F6"
                          },
                          { 
                            name: "Receitas B2", 
                            value: Object.values(filteredData).reduce((sum, monthData) => 
                              sum + (monthData["Receitas B2"]?.length || 0), 0),
                            fill: "#1D4ED8"
                          },
                          { 
                            name: "Trimestral", 
                            value: Object.values(filteredData).reduce((sum, monthData) => 
                              sum + (monthData["Trimestral"]?.length || 0), 0),
                            fill: "#1E40AF"
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={35}
                        fill="#8884d8"
                        dataKey="value"
                        fontSize={10}
                      >
                        {[
                          { name: "Receitas A", value: Object.values(filteredData).reduce((sum, monthData) => 
                            sum + (monthData["Receitas A"]?.length || 0), 0) },
                          { name: "Receitas B2", value: Object.values(filteredData).reduce((sum, monthData) => 
                            sum + (monthData["Receitas B2"]?.length || 0), 0) },
                          { name: "Trimestral", value: Object.values(filteredData).reduce((sum, monthData) => 
                            sum + (monthData["Trimestral"]?.length || 0), 0) }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === "Receitas A" ? "#3B82F6" : entry.name === "Receitas B2" ? "#1D4ED8" : "#1E40AF"} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`${value} pendências`, "Quantidade"]}
                        labelFormatter={(label) => `Categoria: ${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
                    <div>
                <h4 className="font-medium mb-3">Por Mês</h4>
                <SimpleBarChart 
                  data={monthsWithPending
                    .map(month => {
                      const monthData = filteredData[month];
                      const total = Object.values(monthData).reduce((sum, categoryData) => sum + categoryData.length, 0);
                      return { month, total };
                    })
                    .sort((a, b) => b.total - a.total) // Ordenar por quantidade (maior para menor)
                    .reduce((acc, { month, total }) => {
                      acc[`${month} ${currentYear}`] = total;
                      return acc;
                    }, {} as { [key: string]: number })} 
                  type="month" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Filtros e Ordenação</h3>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSortOrder}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        {sortOrder === "newest" ? "Mais Recente" : "Mais Antigo"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Alternar ordem de classificação por data</p>
                    </TooltipContent>
                  </Tooltip>
                  
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
                  </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar farmácia..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {monthNames.map((month, index) => (
                      <SelectItem key={month} value={month}>
                        {month} {index === currentMonth && "(atual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Receitas A">Receitas A</SelectItem>
                    <SelectItem value="Receitas B2">Receitas B2</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Nome da farmácia</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            </div>
        </CardContent>
      </Card>

        {/* Visualização por Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Por Mês
            </TabsTrigger>
            <TabsTrigger value="category" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Por Categoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            {monthsWithPending.length > 0 ? (
              monthsWithPending.map(month => {
                const monthData = filteredData[month];
                const monthTotal = Object.values(monthData).reduce((sum, categoryData) => sum + categoryData.length, 0);
                const monthIndex = monthNames.indexOf(month);
                const isExpanded = expandedMonths.has(month);
                
                // Dados para o gráfico de categorias
                const categoryData = {
                  "Receitas A": monthData["Receitas A"]?.length || 0,
                  "Receitas B2": monthData["Receitas B2"]?.length || 0,
                  "Trimestral": monthData["Trimestral"]?.length || 0
                };
                
                return (
                  <Collapsible key={month} open={isExpanded} onOpenChange={() => toggleMonthExpansion(month)}>
      <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="border-b cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
                              {month} {currentYear}
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200">{monthTotal} pendências</Badge>
          </CardTitle>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="cursor-help">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {month === monthNames[currentMonth] ? "Mês atual" : "Mês anterior"}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Status do mês: {month === monthNames[currentMonth] ? "Mês atual" : "Mês anterior"}</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="cursor-help">
                                    <BarChart3 className="mr-1 h-3 w-3" />
                                    Distribuição
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="p-2">
                                    <p className="font-medium mb-2">Distribuição por Categoria</p>
                                    <SimpleBarChart data={categoryData} type="category" />
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
        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
        <CardContent className="p-0">
                          {Object.entries(monthData).map(([category, items]) => {
                            if (items.length === 0) return null;
                            
                            return (
                              <div key={category} className="border-b last:border-b-0">
                                <div className="p-4 bg-muted/30">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{category}</h4>
                                    <Badge variant="outline">{items.length} pendências</Badge>
                                  </div>
                                </div>
            <div className="divide-y">
                                  {items.map((item, index) => (
                                    <div key={`${item.pharmacy.id}-${category}-${index}`} className="p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                      <Link
                                            to={`/farmacias/${item.pharmacy.id}`}
                                            className="text-lg font-medium hover:text-primary block"
                      >
                                            {item.pharmacy.nomeFantasia || item.pharmacy.razaoSocial}
                      </Link>
                                          <div className="text-sm text-muted-foreground mt-1">
                                            CNPJ: {item.pharmacy.cnpj}
                      </div>
                                          <div className="mt-2">
                                            <Badge variant="destructive" className="text-xs">
                                              <AlertTriangle className="mr-1 h-3 w-3" />
                                              Pendente: {category} - {month}
                                            </Badge>
                      </div>
                    </div>
                    <div>
                                          <Link to={`/farmacias/${item.pharmacy.id}/editar`}>
                        <Button size="sm" variant="outline">
                          <Edit className="mr-2 h-4 w-4" />
                          Registrar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma pendência encontrada</h3>
              <p className="text-muted-foreground">
                    {searchTerm || selectedMonth !== "all" || selectedCategory !== "all" 
                      ? "Tente ajustar os filtros para ver mais resultados."
                      : "Todas as farmácias estão em dia com seus controles!"
                    }
              </p>
        </CardContent>
      </Card>
            )}
          </TabsContent>

          <TabsContent value="category" className="space-y-4">
            {["Receitas A", "Receitas B2", "Trimestral"].map(category => {
              const categoryItems: any[] = [];
              Object.entries(filteredData).forEach(([month, monthData]) => {
                if (monthData[category]) {
                  categoryItems.push(...monthData[category]);
                }
              });

              if (categoryItems.length === 0) return null;

              const isExpanded = expandedCategories.has(category);
              
              // Dados para o gráfico de meses
              const monthData = categoryItems.reduce((acc, item) => {
                acc[item.month] = (acc[item.month] || 0) + 1;
                return acc;
              }, {} as { [key: string]: number });

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategoryExpansion(category)}>
      <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="border-b cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
                            {category}
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">{categoryItems.length} pendências</Badge>
          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="cursor-help">
                                  <BarChart3 className="mr-1 h-3 w-3" />
                                  Distribuição
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="p-2">
                                  <p className="font-medium mb-2">Distribuição por Mês</p>
                                  <SimpleBarChart data={monthData} type="month" />
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
        </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
        <CardContent className="p-0">
            <div className="divide-y">
                          {categoryItems.map((item, index) => (
                            <div key={`${item.pharmacy.id}-${category}-${index}`} className="p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                      <Link
                                    to={`/farmacias/${item.pharmacy.id}`}
                                    className="text-lg font-medium hover:text-primary block"
                      >
                                    {item.pharmacy.nomeFantasia || item.pharmacy.razaoSocial}
                      </Link>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    CNPJ: {item.pharmacy.cnpj}
                      </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      Pendente: {category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {item.month}
                                    </Badge>
                      </div>
                    </div>
                    <div>
                                  <Link to={`/farmacias/${item.pharmacy.id}/editar`}>
                        <Button size="sm" variant="outline">
                          <Edit className="mr-2 h-4 w-4" />
                          Registrar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </CardContent>
                    </CollapsibleContent>
      </Card>
                </Collapsible>
              );
            })}
          </TabsContent>
        </Tabs>
    </div>
    </TooltipProvider>
  );
};

export default Deadlines;
