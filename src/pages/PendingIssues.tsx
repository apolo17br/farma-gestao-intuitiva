
import React from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const PendingIssues: React.FC = () => {
  const { pharmacies } = usePharmacy();

  // Identificar farmácias sem responsável técnico
  const pharmaciesWithoutTechnical = pharmacies.filter(
    (pharmacy) =>
      !pharmacy.responsaveisTecnicos ||
      pharmacy.responsaveisTecnicos.length === 0 ||
      pharmacy.responsaveisTecnicos.some(
        (supervisor) => !supervisor.nome || !supervisor.crf
      )
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pendências</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Farmácias sem Responsável Técnico
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pharmaciesWithoutTechnical.length > 0 ? (
            <div className="divide-y">
              {pharmaciesWithoutTechnical.map((pharmacy) => (
                <div key={pharmacy.id} className="p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <Link
                        to={`/farmacias/${pharmacy.id}`}
                        className="text-lg font-medium hover:text-primary"
                      >
                        {pharmacy.nomeFantasia || pharmacy.razaoSocial}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        CNPJ: {pharmacy.cnpj}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full inline-block">
                          Responsável técnico não cadastrado
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link to={`/farmacias/${pharmacy.id}/editar`}>
                        <Button size="sm" variant="outline">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                Não há farmácias com pendências de responsáveis técnicos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingIssues;
