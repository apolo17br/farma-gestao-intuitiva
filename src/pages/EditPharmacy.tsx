import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePharmacy } from "../context/PharmacyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pharmacy } from "../types/pharmacy.types";
import PharmacyForm from "../components/PharmacyForm";

const EditPharmacy: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPharmacy, loading } = usePharmacy();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPharmacy = async () => {
      if (id) {
        try {
          const data = await getPharmacy(id);
          if (data) {
            setPharmacy(data);
            setError(null);
          } else {
            setError("Farmácia não encontrada.");
            setPharmacy(null);
          }
        } catch (err) {
          console.error("Erro ao buscar farmácia para edição:", err);
          setError("Erro ao carregar dados da farmácia.");
          setPharmacy(null);
        }
      } else {
        setError("ID da farmácia não fornecido.");
      }
    };
    fetchPharmacy();
  }, [id, getPharmacy]);

  if (loading) {
    return (
      <div className="space-y-6 pt-16 md:pt-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-10" />
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-20" />
            <Skeleton className="h-6 w-48 mt-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-10">
        <p>{error}</p>
        <Button onClick={() => navigate("/pharmacies")} variant="link">
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Editar Farmácia: {pharmacy?.nomeFantasia || pharmacy?.razaoSocial}
        </h1>
      </div>
      
      {pharmacy ? (
        <PharmacyForm pharmacy={pharmacy} isEditing={true} />
      ) : (
        <div>Não foi possível carregar os dados da farmácia.</div>
      )}
    </div>
  );
};

export default EditPharmacy;
