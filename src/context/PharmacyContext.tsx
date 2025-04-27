
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Pharmacy } from "../types/pharmacy.types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "../components/ui/sonner";

interface PharmacyContextType {
  pharmacies: Pharmacy[];
  addPharmacy: (pharmacy: Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao">) => void;
  updatePharmacy: (pharmacy: Pharmacy) => void;
  deletePharmacy: (id: string) => void;
  getPharmacy: (id: string) => Pharmacy | undefined;
  filteredPharmacies: Pharmacy[];
  setFilterTerm: (term: string) => void;
  filterTerm: string;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error("usePharmacy deve ser usado dentro de um PharmacyProvider");
  }
  return context;
};

interface PharmacyProviderProps {
  children: ReactNode;
}

export const PharmacyProvider: React.FC<PharmacyProviderProps> = ({ children }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => {
    const storedPharmacies = localStorage.getItem("pharmacies");
    return storedPharmacies ? JSON.parse(storedPharmacies) : [];
  });
  
  const [filterTerm, setFilterTerm] = useState("");
  
  const filteredPharmacies = pharmacies.filter((pharmacy) => 
    pharmacy.nomeFantasia.toLowerCase().includes(filterTerm.toLowerCase()) || 
    pharmacy.razaoSocial.toLowerCase().includes(filterTerm.toLowerCase()) ||
    pharmacy.cnpj.includes(filterTerm)
  );
  
  useEffect(() => {
    localStorage.setItem("pharmacies", JSON.stringify(pharmacies));
  }, [pharmacies]);

  const addPharmacy = (
    newPharmacy: Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao">
  ) => {
    const now = new Date().toISOString();
    const pharmacyWithId = {
      ...newPharmacy,
      id: uuidv4(),
      dataCadastro: now,
      ultimaAtualizacao: now,
    };
    setPharmacies([...pharmacies, pharmacyWithId]);
    toast("Sucesso", {
      description: "Farmácia cadastrada com sucesso.",
      className: "success-toast",
    });
  };

  const updatePharmacy = (updatedPharmacy: Pharmacy) => {
    const now = new Date().toISOString();
    updatedPharmacy.ultimaAtualizacao = now;
    
    setPharmacies(
      pharmacies.map((pharmacy) =>
        pharmacy.id === updatedPharmacy.id ? updatedPharmacy : pharmacy
      )
    );
    toast("Sucesso", {
      description: "Dados da farmácia atualizados com sucesso.",
      className: "success-toast",
    });
  };

  const deletePharmacy = (id: string) => {
    setPharmacies(pharmacies.filter((pharmacy) => pharmacy.id !== id));
    toast("Farmácia excluída", {
      description: "Os dados da farmácia foram excluídos.",
    });
  };

  const getPharmacy = (id: string) => {
    return pharmacies.find((pharmacy) => pharmacy.id === id);
  };

  return (
    <PharmacyContext.Provider
      value={{
        pharmacies,
        addPharmacy,
        updatePharmacy,
        deletePharmacy,
        getPharmacy,
        filteredPharmacies,
        setFilterTerm,
        filterTerm,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};
