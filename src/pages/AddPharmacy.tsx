
import React from "react";
import { Link } from "react-router-dom";
import PharmacyForm from "../components/PharmacyForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AddPharmacy: React.FC = () => {
  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Link to="/farmacias">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Cadastrar Nova Farmácia</h1>
      </div>
      
      <PharmacyForm />
    </div>
  );
};

export default AddPharmacy;
