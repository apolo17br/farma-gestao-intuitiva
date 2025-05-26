import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Pharmacy, TechnicalSupervisor, Address } from "../types/pharmacy.types";
import { toast } from "../components/ui/sonner";
import { supabase } from "../lib/supabase";

interface PharmacyContextType {
  pharmacies: Pharmacy[];
  addPharmacy: (pharmacy: Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao"> & { address?: Address }) => Promise<void>;
  updatePharmacy: (pharmacy: Pharmacy) => Promise<void>;
  deletePharmacy: (id: string) => Promise<void>;
  getPharmacy: (id: string) => Promise<Pharmacy | undefined>;
  filteredPharmacies: Pharmacy[];
  setFilterTerm: (term: string) => void;
  filterTerm: string;
  loading: boolean;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

interface PharmacyProviderProps {
  children: ReactNode;
}

export const PharmacyProvider: React.FC<PharmacyProviderProps> = ({ children }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filterTerm, setFilterTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    if (!pharmacy) return false;
    return (
      (pharmacy.nomeFantasia?.toLowerCase() || '').includes(filterTerm.toLowerCase()) || 
      (pharmacy.razaoSocial?.toLowerCase() || '').includes(filterTerm.toLowerCase()) ||
      (pharmacy.cnpj || '').includes(filterTerm)
    );
  });

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacies')
        .select(`
          *,
          responsaveisTecnicos:pharmacy_technical_supervisors(
            technical_supervisor:technical_supervisors(*)
          ),
          controlesMensaisA:monthly_controls_a(*),
          controlesMensaisB2:monthly_controls_b2(*),
          controlesTrimestrais:quarterly_controls(*),
          address:addresses(*)
        `);

      if (error) throw error;

      const formattedPharmacies = (data || []).map(pharmacy => {
        const addressData = pharmacy.address;
        return {
          ...pharmacy,
          id: pharmacy.id,
          cnpj: pharmacy.cnpj,
          razaoSocial: pharmacy.razao_social,
          nomeFantasia: pharmacy.nome_fantasia,
          telefone: pharmacy.telefone,
          email: pharmacy.email,
          observacoes: pharmacy.observacoes,
          dataCadastro: pharmacy.data_cadastro,
          ultimaAtualizacao: pharmacy.ultima_atualizacao,
          responsaveisTecnicos: pharmacy?.responsaveisTecnicos?.map((rt: { technical_supervisor: TechnicalSupervisor }) => rt.technical_supervisor) || [],
          controlesMensaisA: pharmacy?.controlesMensaisA?.[0] || {},
          controlesMensaisB2: pharmacy?.controlesMensaisB2?.[0] || {},
          controlesTrimestrais: pharmacy?.controlesTrimestrais?.[0] || {},
          address: addressData ? {
             id: addressData.id,
             pharmacy_id: addressData.pharmacy_id,
             logradouro: addressData.logradouro,
             numero: addressData.numero,
             bairro: addressData.bairro,
             cidade: addressData.cidade,
             estado: addressData.estado,
             cep: addressData.cep,
             complemento: addressData.complemento
          } : null
        };
      });

      setPharmacies(formattedPharmacies as Pharmacy[]);
    } catch (error) {
      console.error('Erro ao buscar farmácias:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
      }
      toast.error('Erro ao carregar farmácias. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const addPharmacy = async (
    newPharmacy: Omit<Pharmacy, "id" | "dataCadastro" | "ultimaAtualizacao"> & { address?: Address }
  ) => {
    let pharmacyId: string | null = null;
    try {
      setLoading(true);
      
      let supervisorIds: string[] = [];
      if (newPharmacy.responsaveisTecnicos.length > 0) {
        const upsertData = newPharmacy.responsaveisTecnicos.map(sup => ({
          nome: sup.nome,
          crf: sup.crf
        }));
        const { data: supervisorsData, error: supervisorsError } = await supabase
          .from('technical_supervisors')
          .upsert(upsertData)
          .select('id');

        if (supervisorsError) throw supervisorsError;
        supervisorIds = supervisorsData.map(s => s.id);
      }

      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert({
          cnpj: newPharmacy.cnpj,
          razao_social: newPharmacy.razaoSocial,
          nome_fantasia: newPharmacy.nomeFantasia,
          telefone: newPharmacy.telefone,
          email: newPharmacy.email,
          observacoes: newPharmacy.observacoes
        })
        .select()
        .single();

      if (pharmacyError) throw pharmacyError;
      pharmacyId = pharmacyData.id;

      if (supervisorIds.length > 0) {
        const junctionData = supervisorIds.map(supervisorId => ({
          pharmacy_id: pharmacyId,
          technical_supervisor_id: supervisorId
        }));
        const { error: junctionError } = await supabase
          .from('pharmacy_technical_supervisors')
          .insert(junctionData);

        if (junctionError) throw junctionError;
      }

      const addressData = newPharmacy.address;
      const hasAddressData = addressData && Object.values(addressData).some(val => val && val.trim() !== '');
      if (hasAddressData && pharmacyId) {
        const { error: addressError } = await supabase
          .from('addresses')
          .insert({
            pharmacy_id: pharmacyId,
            logradouro: addressData.logradouro,
            numero: addressData.numero,
            bairro: addressData.bairro,
            cidade: addressData.cidade,
            estado: addressData.estado,
            cep: addressData.cep,
            complemento: addressData.complemento
          });
        if (addressError) throw addressError;
      }

      if (pharmacyId) {
        const { error: monthlyAError } = await supabase
          .from('monthly_controls_a')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesMensaisA });
        if (monthlyAError) throw monthlyAError;

        const { error: monthlyB2Error } = await supabase
          .from('monthly_controls_b2')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesMensaisB2 });
        if (monthlyB2Error) throw monthlyB2Error;

        const { error: quarterlyError } = await supabase
          .from('quarterly_controls')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesTrimestrais });
        if (quarterlyError) throw quarterlyError;
      }

      await fetchPharmacies();
      toast.success("Farmácia cadastrada com sucesso");
    } catch (error) {
      console.error('Erro ao adicionar farmácia:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
      }
      toast.error('Erro ao cadastrar farmácia. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const updatePharmacy = async (updatedPharmacy: Pharmacy) => {
    const pharmacyId = updatedPharmacy.id;
    try {
      setLoading(true);
      
      const { error: pharmacyError } = await supabase
        .from('pharmacies')
        .update({
          cnpj: updatedPharmacy.cnpj,
          razao_social: updatedPharmacy.razaoSocial,
          nome_fantasia: updatedPharmacy.nomeFantasia,
          telefone: updatedPharmacy.telefone,
          email: updatedPharmacy.email,
          observacoes: updatedPharmacy.observacoes,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', pharmacyId);

      if (pharmacyError) throw pharmacyError;

      let currentSupervisorIds: string[] = [];
      if (updatedPharmacy.responsaveisTecnicos.length > 0) {
         const upsertData = updatedPharmacy.responsaveisTecnicos.map(sup => ({
           nome: sup.nome,
           crf: sup.crf
         }));
         const { data: supervisorsData, error: supervisorsError } = await supabase
           .from('technical_supervisors')
           .upsert(upsertData)
           .select('id');
         
         if (supervisorsError) throw supervisorsError;
         currentSupervisorIds = supervisorsData.map(s => s.id);
      }

      const { error: deleteJunctionError } = await supabase
        .from('pharmacy_technical_supervisors')
        .delete()
        .eq('pharmacy_id', pharmacyId);

      if (deleteJunctionError) throw deleteJunctionError;
      
      if (currentSupervisorIds.length > 0) {
         const newJunctionData = currentSupervisorIds.map(supervisorId => ({
           pharmacy_id: pharmacyId,
           technical_supervisor_id: supervisorId
         }));
         const { error: insertJunctionError } = await supabase
           .from('pharmacy_technical_supervisors')
           .insert(newJunctionData);

         if (insertJunctionError) throw insertJunctionError;
      }

      const addressData = updatedPharmacy.address;
      const hasAddressData = addressData && Object.values(addressData).some(val => val && val.trim() !== '');

      const { data: existingAddress, error: checkAddressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .maybeSingle(); 
      
      if (checkAddressError && checkAddressError.code !== 'PGRST116') {
         throw checkAddressError;
      }

      if (hasAddressData) {
        const addressPayload = {
            pharmacy_id: pharmacyId,
            logradouro: addressData.logradouro,
            numero: addressData.numero,
            bairro: addressData.bairro,
            cidade: addressData.cidade,
            estado: addressData.estado,
            cep: addressData.cep,
            complemento: addressData.complemento
        };
        if (existingAddress) {
          const { error: updateAddressError } = await supabase
            .from('addresses')
            .update(addressPayload)
            .eq('pharmacy_id', pharmacyId);
          if (updateAddressError) throw updateAddressError;
        } else {
          const { error: insertAddressError } = await supabase
            .from('addresses')
            .insert(addressPayload);
          if (insertAddressError) throw insertAddressError;
        }
      } else if (existingAddress) {
        const { error: deleteAddressError } = await supabase
          .from('addresses')
          .delete()
          .eq('pharmacy_id', pharmacyId);
        if (deleteAddressError) throw deleteAddressError;
      }

      const { data: existingMonthlyA, error: checkMonthlyAError } = await supabase
         .from('monthly_controls_a')
         .select('id')
         .eq('pharmacy_id', pharmacyId)
         .maybeSingle();
      
      if (checkMonthlyAError && checkMonthlyAError.code !== 'PGRST116') {
         throw checkMonthlyAError;
      }

      if(existingMonthlyA) {
         const { error: monthlyAError } = await supabase
           .from('monthly_controls_a')
           .update(updatedPharmacy.controlesMensaisA)
           .eq('pharmacy_id', pharmacyId);
         if (monthlyAError) throw monthlyAError;
      } else {
         const { error: insertMonthlyAError } = await supabase
           .from('monthly_controls_a')
           .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesMensaisA });
         if (insertMonthlyAError) throw insertMonthlyAError;
      }

      const { data: existingMonthlyB2, error: checkMonthlyB2Error } = await supabase
         .from('monthly_controls_b2')
         .select('id')
         .eq('pharmacy_id', pharmacyId)
         .maybeSingle();
      
      if (checkMonthlyB2Error && checkMonthlyB2Error.code !== 'PGRST116') {
         throw checkMonthlyB2Error;
      }

      if(existingMonthlyB2) {
         const { error: monthlyB2Error } = await supabase
           .from('monthly_controls_b2')
           .update(updatedPharmacy.controlesMensaisB2)
           .eq('pharmacy_id', pharmacyId);
         if (monthlyB2Error) throw monthlyB2Error;
      } else {
         const { error: insertMonthlyB2Error } = await supabase
           .from('monthly_controls_b2')
           .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesMensaisB2 });
         if (insertMonthlyB2Error) throw insertMonthlyB2Error;
      }

      const { data: existingQuarterly, error: checkQuarterlyError } = await supabase
         .from('quarterly_controls')
         .select('id')
         .eq('pharmacy_id', pharmacyId)
         .maybeSingle();
      
      if (checkQuarterlyError && checkQuarterlyError.code !== 'PGRST116') {
         throw checkQuarterlyError;
      }

      if(existingQuarterly) {
         const { error: quarterlyError } = await supabase
           .from('quarterly_controls')
           .update(updatedPharmacy.controlesTrimestrais)
           .eq('pharmacy_id', pharmacyId);
         if (quarterlyError) throw quarterlyError;
      } else {
         const { error: insertQuarterlyError } = await supabase
           .from('quarterly_controls')
           .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesTrimestrais });
         if (insertQuarterlyError) throw insertQuarterlyError;
      }

      await fetchPharmacies();
      toast.success("Dados da farmácia atualizados com sucesso");
    } catch (error) {
      console.error('Erro ao atualizar farmácia:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
      }
      toast.error('Erro ao atualizar farmácia. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const deletePharmacy = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('pharmacies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPharmacies();
      toast.success("Farmácia excluída com sucesso");
    } catch (error) {
      console.error('Erro ao excluir farmácia:', error);
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
      }
      toast.error('Erro ao excluir farmácia. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const getPharmacy = async (id: string): Promise<Pharmacy | undefined> => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select(`
          *,
          responsaveisTecnicos:pharmacy_technical_supervisors(
            technical_supervisor:technical_supervisors(*)
          ),
          controlesMensaisA:monthly_controls_a(*),
          controlesMensaisB2:monthly_controls_b2(*),
          controlesTrimestrais:quarterly_controls(*),
          address:addresses(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const addressData = data.address;
        return {
          ...data,
          id: data.id,
          cnpj: data.cnpj,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          telefone: data.telefone,
          email: data.email,
          observacoes: data.observacoes,
          dataCadastro: data.data_cadastro,
          ultimaAtualizacao: data.ultima_atualizacao,
          responsaveisTecnicos: data.responsaveisTecnicos?.map((rt: { technical_supervisor: TechnicalSupervisor }) => rt.technical_supervisor) || [],
          controlesMensaisA: data.controlesMensaisA?.[0] || {},
          controlesMensaisB2: data.controlesMensaisB2?.[0] || {},
          controlesTrimestrais: data.controlesTrimestrais?.[0] || {},
          address: addressData ? {
             id: addressData.id,
             pharmacy_id: addressData.pharmacy_id,
             logradouro: addressData.logradouro,
             numero: addressData.numero,
             bairro: addressData.bairro,
             cidade: addressData.cidade,
             estado: addressData.estado,
             cep: addressData.cep,
             complemento: addressData.complemento
          } : null
        } as Pharmacy;
      }

      return undefined;
    } catch (error) {
      console.error('Erro ao buscar farmácia:', error);
      return undefined;
    }
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
        loading
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (context === undefined) {
    throw new Error("usePharmacy deve ser usado dentro de um PharmacyProvider");
  }
  return context;
};
