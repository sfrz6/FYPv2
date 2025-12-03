import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FiltersProvider } from "@/context/FiltersContext";
import { Layout } from "@/components/layout/Layout";
import Overview from "./pages/Overview";
import ThreatIntel from "./pages/ThreatIntel";
import Incidents from "./pages/Incidents";
import Sensors from "./pages/Sensors";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Report from "./pages/Report";
import AttacksTell from "./pages/AttacksTell";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <FiltersProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout><Overview /></Layout>} />
              <Route path="/threat-intel" element={<Layout><ThreatIntel /></Layout>} />
              <Route path="/incidents" element={<Layout><Incidents /></Layout>} />
              <Route path="/sensors" element={<Layout><Sensors /></Layout>} />
              <Route path="/report" element={<Layout><Report /></Layout>} />
              <Route path="/attacks-tell" element={<Layout><AttacksTell /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FiltersProvider>
    </QueryClientProvider>
  );
};

export default App;
