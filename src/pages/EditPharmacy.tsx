
import React from "react";
import { Link, useParams } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import PharmacyForm from "../components/PharmacyForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EditPharmacy: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPharmacy } = usePharmacy();
  
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/farmacias/${pharmacy.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Editar Farmácia</h1>
      </div>
      
      <PharmacyForm pharmacy={pharmacy} isEditing={true} />
    </div>
  );
};

export default EditPharmacy;
