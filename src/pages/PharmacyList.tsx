import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Search, Edit, Trash2, X, Clock, Filter, ChevronDown, ChevronUp, Calendar, MapPin, FileText, RotateCcw } from "lucide-react";
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
import { formatCnpjDisplay } from "../utils/formatters";

const PharmacyList: React.FC = () => {
  const { pharmacies, deletePharmacy, filterTerm, setFilterTerm } = usePharmacy();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Estados para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    missingFields: [] as string[],
    dateRange: "all" as string,
    sortBy: "name" as string,
    sortOrder: "asc" as string,
    addressFilter: {
      bairro: "",
      rua: ""
    },
    observacoes: ""
  });

  // Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem("pharmacySearchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar no histórico quando o usuário realizar uma busca
  const handleSearch = (term: string) => {
    setFilterTerm(term);

    if (term.trim() !== "" && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem("pharmacySearchHistory", JSON.stringify(newHistory));
    }
    setShowHistory(false);
  };

  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Aplicar filtros avançados
  const filteredPharmacies = useMemo(() => {
    let filtered = [...pharmacies];

    // Filtro básico de busca
    if (filterTerm.trim()) {
      const searchLower = filterTerm.toLowerCase();
      filtered = filtered.filter(pharmacy =>
        pharmacy.nomeFantasia?.toLowerCase().includes(searchLower) ||
        pharmacy.razaoSocial?.toLowerCase().includes(searchLower) ||
        pharmacy.cnpj?.includes(filterTerm) ||
        pharmacy.alvara?.toLowerCase().includes(searchLower) ||
        pharmacy.email?.toLowerCase().includes(searchLower) ||
        pharmacy.responsaveisTecnicos?.some(supervisor =>
          supervisor.nome?.toLowerCase().includes(searchLower) ||
          supervisor.crf?.includes(filterTerm)
        )
      );
    }

    // Filtro por campos em branco
    if (advancedFilters.missingFields.length > 0) {
      filtered = filtered.filter(pharmacy => {
        return advancedFilters.missingFields.some(field => {
          switch (field) {
            case "telefone":
              return !pharmacy.telefone || pharmacy.telefone.trim() === "";
            case "email":
              return !pharmacy.email || pharmacy.email.trim() === "";
            case "alvara":
              return !pharmacy.alvara || pharmacy.alvara.trim() === "";
            case "endereco":
              return !pharmacy.address ||
                (!pharmacy.address.logradouro && !pharmacy.address.bairro &&
                  !pharmacy.address.cidade && !pharmacy.address.estado);
            default:
              return false;
          }
        });
      });
    }

    // Filtro por data
    if (advancedFilters.dateRange !== "all") {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filtered = filtered.filter(pharmacy => {
        const pharmacyDate = new Date(pharmacy.dataCadastro);
        const pharmacyMonth = pharmacyDate.getMonth();
        const pharmacyYear = pharmacyDate.getFullYear();

        switch (advancedFilters.dateRange) {
          case "thisMonth":
            return pharmacyMonth === currentMonth && pharmacyYear === currentYear;
          case "lastMonth":
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return pharmacyMonth === lastMonth && pharmacyYear === lastMonthYear;
          case "thisYear":
            return pharmacyYear === currentYear;
          case "lastYear":
            return pharmacyYear === currentYear - 1;
          default:
            return true;
        }
      });
    }

    // Filtro por endereço
    if (advancedFilters.addressFilter.bairro.trim()) {
      filtered = filtered.filter(pharmacy =>
        pharmacy.address?.bairro?.toLowerCase().includes(advancedFilters.addressFilter.bairro.toLowerCase())
      );
    }

    if (advancedFilters.addressFilter.rua.trim()) {
      filtered = filtered.filter(pharmacy =>
        pharmacy.address?.logradouro?.toLowerCase().includes(advancedFilters.addressFilter.rua.toLowerCase())
      );
    }

    // Filtro por observações
    if (advancedFilters.observacoes.trim()) {
      filtered = filtered.filter(pharmacy =>
        pharmacy.observacoes?.toLowerCase().includes(advancedFilters.observacoes.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (advancedFilters.sortBy) {
        case "name":
          comparison = (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial);
          break;
        case "cnpj":
          comparison = a.cnpj.localeCompare(b.cnpj);
          break;
        case "date":
          comparison = new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
          break;
        case "update":
          comparison = new Date(a.ultimaAtualizacao || a.dataCadastro).getTime() -
            new Date(b.ultimaAtualizacao || b.dataCadastro).getTime();
          break;
        default:
          comparison = 0;
      }

      return advancedFilters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [pharmacies, filterTerm, advancedFilters]);

  // Função para limpar filtros avançados
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      missingFields: [],
      dateRange: "all",
      sortBy: "name",
      sortOrder: "asc",
      addressFilter: {
        bairro: "",
        rua: ""
      },
      observacoes: ""
    });
  };

  // Função para alternar campo em branco
  const toggleMissingField = (field: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      missingFields: prev.missingFields.includes(field)
        ? prev.missingFields.filter(f => f !== field)
        : [...prev.missingFields, field]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Farmácias</h1>
        <Link to="/farmacias/nova">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Farmácia
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Busca e Filtros</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtro Avançado
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAdvancedFilters}
                  className="flex items-center gap-2 bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200 hover:border-yellow-400"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, alvará, e-mail ou responsável técnico..."
                className="pl-10"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                onFocus={() => setShowHistory(searchHistory.length > 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filterTerm.trim() !== "") {
                    handleSearch(filterTerm);
                  }
                }}
              />
              {filterTerm && (
                <button
                  onClick={() => setFilterTerm("")}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {showHistory && searchHistory.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-sm">
                  <ul className="py-1">
                    {searchHistory.map((term, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center"
                        onClick={() => handleSearch(term)}
                      >
                        <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleContent>
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Campos em branco */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Campos em Branco</label>
                      <div className="space-y-2">
                        {[
                          { value: "telefone", label: "Telefone" },
                          { value: "email", label: "E-mail" },
                          { value: "alvara", label: "Alvará" },
                          { value: "endereco", label: "Endereço" }
                        ].map(field => (
                          <label key={field.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={advancedFilters.missingFields.includes(field.value)}
                              onChange={() => toggleMissingField(field.value)}
                              className="rounded"
                            />
                            <span className="text-sm">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por data */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Período de Cadastro</label>
                      <Select value={advancedFilters.dateRange} onValueChange={(value) =>
                        setAdvancedFilters(prev => ({ ...prev, dateRange: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os períodos</SelectItem>
                          <SelectItem value="thisMonth">Este mês</SelectItem>
                          <SelectItem value="lastMonth">Mês passado</SelectItem>
                          <SelectItem value="thisYear">Este ano</SelectItem>
                          <SelectItem value="lastYear">Ano passado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ordenação */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                      <div className="space-y-2">
                        <Select value={advancedFilters.sortBy} onValueChange={(value) =>
                          setAdvancedFilters(prev => ({ ...prev, sortBy: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="date">Data de cadastro</SelectItem>
                            <SelectItem value="update">Data de atualização</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={advancedFilters.sortOrder} onValueChange={(value) =>
                          setAdvancedFilters(prev => ({ ...prev, sortOrder: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Ordem" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Crescente</SelectItem>
                            <SelectItem value="desc">Decrescente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Filtro por endereço */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Endereço</label>
                      <div className="space-y-2">
                        <Input
                          placeholder="Bairro"
                          value={advancedFilters.addressFilter.bairro}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            addressFilter: { ...prev.addressFilter, bairro: e.target.value }
                          }))}
                        />
                        <Input
                          placeholder="Rua/Logradouro"
                          value={advancedFilters.addressFilter.rua}
                          onChange={(e) => setAdvancedFilters(prev => ({
                            ...prev,
                            addressFilter: { ...prev.addressFilter, rua: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Filtro por observações */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Observações</label>
                      <Input
                        placeholder="Buscar nas observações..."
                        value={advancedFilters.observacoes}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, observacoes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {filteredPharmacies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Link to={`/farmacias/${pharmacy.id}`}>
                        <h3 className="font-semibold text-lg hover:text-primary">
                          {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {formatCnpjDisplay(pharmacy.cnpj)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/farmacias/${pharmacy.id}/editar`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirma a exclusão?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente
                              a farmácia {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                              e todos os dados associados a ela.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePharmacy(pharmacy.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
                <div className="border-t p-4 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Telefone:</p>
                      <p>{pharmacy.telefone || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">E-mail:</p>
                      <p className="truncate">{pharmacy.email || "Não informado"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-10">
          {filterTerm ? (
            <div className="space-y-2">
              <p className="text-lg font-medium">Nenhuma farmácia encontrada</p>
              <p className="text-muted-foreground">
                Tente outro termo de busca ou
                <Button
                  variant="link"
                  onClick={() => setFilterTerm("")}
                  className="px-1"
                >
                  limpe o filtro
                </Button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-medium">Nenhuma farmácia cadastrada</p>
              <p className="text-muted-foreground">
                Comece adicionando uma nova farmácia
              </p>
              <Link to="/farmacias/nova">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nova Farmácia
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyList;
