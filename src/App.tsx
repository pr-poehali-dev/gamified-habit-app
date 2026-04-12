import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ParentMiniApp from "./pages/ParentMiniApp";
import ChildMiniApp from "./pages/ChildMiniApp";
import AppEntry from "./pages/AppEntry";
import Index from "./pages/Index";
import Legal from "./pages/Legal";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

function YandexMetrikaHit() {
  const location = useLocation();
  useEffect(() => {
    if (window.ym) {
      window.ym(108386705, "hit", location.pathname + location.search);
    }
  }, [location]);
  return null;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <YandexMetrikaHit />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppEntry />} />
          <Route path="/app/*" element={<AppEntry />} />
          <Route path="/parent" element={<ParentMiniApp />} />
          <Route path="/child" element={<ChildMiniApp />} />
          <Route path="/parent/*" element={<ParentMiniApp />} />
          <Route path="/child/*" element={<ChildMiniApp />} />
          <Route path="/invite" element={<AppEntry />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/consent" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;