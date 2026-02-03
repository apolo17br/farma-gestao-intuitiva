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
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

interface PharmacyProviderProps {
  children: ReactNode;
}

export const PharmacyProvider: React.FC<PharmacyProviderProps> = ({ children }) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filterTerm, setFilterTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    if (!pharmacy) return false;
    const searchTerm = filterTerm.toLowerCase();

    // Busca por nome fantasia, razão social, CNPJ, alvará e e-mail
    const basicMatch = (
      (pharmacy.nomeFantasia?.toLowerCase() || '').includes(searchTerm) ||
      (pharmacy.razaoSocial?.toLowerCase() || '').includes(searchTerm) ||
      (pharmacy.cnpj || '').includes(filterTerm) ||
      (pharmacy.alvara?.toLowerCase() || '').includes(searchTerm) ||
      (pharmacy.email?.toLowerCase() || '').includes(searchTerm)
    );

    // Busca por responsáveis técnicos
    const supervisorMatch = pharmacy.responsaveisTecnicos?.some(supervisor =>
      (supervisor.nome?.toLowerCase() || '').includes(searchTerm) ||
      (supervisor.crf || '').includes(filterTerm)
    ) || false;

    return basicMatch || supervisorMatch;
  });

  useEffect(() => {
    fetchPharmacies();
  }, [selectedYear]);

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

        const filterByYear = (items: any[]) => {
          if (!items || !Array.isArray(items)) return {};
          return items.find(item => {
            const itemYear = new Date(item.created_at).getFullYear();
            return itemYear === selectedYear;
          }) || {};
        };

        return {
          ...pharmacy,
          id: pharmacy.id,
          cnpj: pharmacy.cnpj,
          razaoSocial: pharmacy.razao_social,
          nomeFantasia: pharmacy.nome_fantasia,
          telefone: pharmacy.telefone,
          alvara: pharmacy.alvara,
          email: pharmacy.email,
          observacoes: pharmacy.observacoes,
          dataCadastro: pharmacy.data_cadastro,
          ultimaAtualizacao: pharmacy.ultima_atualizacao,
          responsaveisTecnicos: pharmacy?.responsaveisTecnicos?.map((rt: { technical_supervisor: TechnicalSupervisor }) => rt.technical_supervisor) || [],
          controlesMensaisA: filterByYear(pharmacy?.controlesMensaisA),
          controlesMensaisB2: filterByYear(pharmacy?.controlesMensaisB2),
          controlesTrimestrais: filterByYear(pharmacy?.controlesTrimestrais),
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
          alvara: newPharmacy.alvara,
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
        const creationDate = `${selectedYear}-01-01T12:00:00.000Z`; // Noon to be safe
        const { error: monthlyAError } = await supabase
          .from('monthly_controls_a')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesMensaisA, created_at: creationDate });
        if (monthlyAError) throw monthlyAError;

        const { error: monthlyB2Error } = await supabase
          .from('monthly_controls_b2')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesMensaisB2, created_at: creationDate });
        if (monthlyB2Error) throw monthlyB2Error;

        const { error: quarterlyError } = await supabase
          .from('quarterly_controls')
          .insert({ pharmacy_id: pharmacyId, ...newPharmacy.controlesTrimestrais, created_at: creationDate });
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
          alvara: updatedPharmacy.alvara,
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

      const getYearRange = () => {
        const start = `${selectedYear}-01-01T00:00:00.000Z`;
        const end = `${selectedYear}-12-31T23:59:59.999Z`;
        return { start, end };
      };
      const { start: yearStart, end: yearEnd } = getYearRange();
      const forcedCreationDate = `${selectedYear}-01-01T12:00:00.000Z`;

      const { data: existingMonthlyA, error: checkMonthlyAError } = await supabase
        .from('monthly_controls_a')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd)
        .maybeSingle();

      if (checkMonthlyAError && checkMonthlyAError.code !== 'PGRST116') {
        throw checkMonthlyAError;
      }

      if (existingMonthlyA) {
        const { error: monthlyAError } = await supabase
          .from('monthly_controls_a')
          .update(updatedPharmacy.controlesMensaisA)
          .eq('id', existingMonthlyA.id);
        if (monthlyAError) throw monthlyAError;
      } else {
        const { error: insertMonthlyAError } = await supabase
          .from('monthly_controls_a')
          .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesMensaisA, created_at: forcedCreationDate });
        if (insertMonthlyAError) throw insertMonthlyAError;
      }

      const { data: existingMonthlyB2, error: checkMonthlyB2Error } = await supabase
        .from('monthly_controls_b2')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd)
        .maybeSingle();

      if (checkMonthlyB2Error && checkMonthlyB2Error.code !== 'PGRST116') {
        throw checkMonthlyB2Error;
      }

      if (existingMonthlyB2) {
        const { error: monthlyB2Error } = await supabase
          .from('monthly_controls_b2')
          .update(updatedPharmacy.controlesMensaisB2)
          .eq('id', existingMonthlyB2.id);
        if (monthlyB2Error) throw monthlyB2Error;
      } else {
        const { error: insertMonthlyB2Error } = await supabase
          .from('monthly_controls_b2')
          .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesMensaisB2, created_at: forcedCreationDate });
        if (insertMonthlyB2Error) throw insertMonthlyB2Error;
      }

      const { data: existingQuarterly, error: checkQuarterlyError } = await supabase
        .from('quarterly_controls')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd)
        .maybeSingle();

      if (checkQuarterlyError && checkQuarterlyError.code !== 'PGRST116') {
        throw checkQuarterlyError;
      }

      if (existingQuarterly) {
        const { error: quarterlyError } = await supabase
          .from('quarterly_controls')
          .update(updatedPharmacy.controlesTrimestrais)
          .eq('id', existingQuarterly.id);
        if (quarterlyError) throw quarterlyError;
      } else {
        const { error: insertQuarterlyError } = await supabase
          .from('quarterly_controls')
          .insert({ pharmacy_id: pharmacyId, ...updatedPharmacy.controlesTrimestrais, created_at: forcedCreationDate });
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
          alvara: data.alvara,
          email: data.email,
          observacoes: data.observacoes,
          dataCadastro: data.data_cadastro,
          ultimaAtualizacao: data.ultima_atualizacao,
          responsaveisTecnicos: data.responsaveisTecnicos?.map((rt: { technical_supervisor: TechnicalSupervisor }) => rt.technical_supervisor) || [],
          controlesMensaisA: data.controlesMensaisA?.find((item: any) => new Date(item.created_at).getFullYear() === selectedYear) || {},
          controlesMensaisB2: data.controlesMensaisB2?.find((item: any) => new Date(item.created_at).getFullYear() === selectedYear) || {},
          controlesTrimestrais: data.controlesTrimestrais?.find((item: any) => new Date(item.created_at).getFullYear() === selectedYear) || {},
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
        loading,
        selectedYear,
        setSelectedYear
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
