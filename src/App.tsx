import React from "react";  // Explicitly import React
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PharmacyProvider } from "./context/PharmacyContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import PharmacyList from "./pages/PharmacyList";
import PharmacyDetail from "./pages/PharmacyDetail";
import AddPharmacy from "./pages/AddPharmacy";
import EditPharmacy from "./pages/EditPharmacy";
import PendingIssues from "./pages/PendingIssues";
import Deadlines from "./pages/Deadlines";
import NotFound from "./pages/NotFound";

// Create a new QueryClient instance outside of component
const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PharmacyProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="farmacias" element={<PharmacyList />} />
                  <Route path="farmacias/nova" element={<AddPharmacy />} />
                  <Route path="farmacias/:id" element={<PharmacyDetail />} />
                  <Route path="farmacias/:id/editar" element={<EditPharmacy />} />
                  <Route path="pendencias" element={<PendingIssues />} />
                  <Route path="prazos" element={<Deadlines />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </PharmacyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
