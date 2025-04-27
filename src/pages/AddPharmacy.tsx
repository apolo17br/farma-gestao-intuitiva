
import React from "react";
import { Link } from "react-router-dom";
import PharmacyForm from "../components/PharmacyForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AddPharmacy: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/farmacias">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Cadastrar Nova Farmácia</h1>
      </div>
      
      <PharmacyForm />
    </div>
  );
};

export default AddPharmacy;
