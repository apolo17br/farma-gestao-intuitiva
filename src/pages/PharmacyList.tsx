
import React from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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

const PharmacyList: React.FC = () => {
  const { filteredPharmacies, deletePharmacy, filterTerm, setFilterTerm } = usePharmacy();

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
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-10"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
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
                        CNPJ: {pharmacy.cnpj}
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
