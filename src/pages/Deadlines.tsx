
import React from "react";
import { Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const Deadlines: React.FC = () => {
  const { pharmacies } = usePharmacy();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = getMonthName(currentMonth);

  // Mapeamento de índice do mês para nome da propriedade no objeto
  const monthPropertyMapping: { [key: number]: string } = {
    0: "janeiro",
    1: "fevereiro",
    2: "marco",
    3: "abril",
    4: "maio",
    5: "junho",
    6: "julho",
    7: "agosto",
    8: "setembro",
    9: "outubro",
    10: "novembro",
    11: "dezembro",
  };

  // Determinar o trimestre atual
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const quarterPropertyMapping: { [key: number]: string } = {
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto",
  };

  // Farmácias sem controle mensal para o mês atual
  const pharmaciesWithoutCurrentMonthControl = pharmacies.filter(
    (pharmacy) => 
      !pharmacy.controlesMensais[monthPropertyMapping[currentMonth]] || 
      pharmacy.controlesMensais[monthPropertyMapping[currentMonth]].trim() === ""
  );

  // Farmácias sem controle trimestral para o trimestre atual
  const pharmaciesWithoutCurrentQuarterControl = pharmacies.filter(
    (pharmacy) =>
      !pharmacy.controlesTrimestrais[quarterPropertyMapping[currentQuarter]] ||
      pharmacy.controlesTrimestrais[quarterPropertyMapping[currentQuarter]].trim() === ""
  );

  function getMonthName(monthIndex: number): string {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril",
      "Maio", "Junho", "Julho", "Agosto",
      "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[monthIndex];
  }

  function getQuarterName(quarter: number): string {
    const quarters = [
      "Primeiro Trimestre", 
      "Segundo Trimestre", 
      "Terceiro Trimestre", 
      "Quarto Trimestre"
    ];
    return quarters[quarter - 1];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Prazos</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Controle Mensal - {currentMonthName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pharmaciesWithoutCurrentMonthControl.length > 0 ? (
            <div className="divide-y">
              {pharmaciesWithoutCurrentMonthControl.map((pharmacy) => (
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
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full inline-block">
                          Pendente: {currentMonthName}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link to={`/farmacias/${pharmacy.id}/editar`}>
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
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                Não há farmácias com pendências de controle mensal para {currentMonthName}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Controle Trimestral - {getQuarterName(currentQuarter)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pharmaciesWithoutCurrentQuarterControl.length > 0 ? (
            <div className="divide-y">
              {pharmaciesWithoutCurrentQuarterControl.map((pharmacy) => (
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
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full inline-block">
                          Pendente: {getQuarterName(currentQuarter)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link to={`/farmacias/${pharmacy.id}/editar`}>
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
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                Não há farmácias com pendências de controle trimestral para o {getQuarterName(currentQuarter).toLowerCase()}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Deadlines;
