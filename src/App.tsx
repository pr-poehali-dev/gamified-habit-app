import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ParentMiniApp from "./pages/ParentMiniApp";
import ChildMiniApp from "./pages/ChildMiniApp";
import AppEntry from "./pages/AppEntry";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppEntry />} />
          <Route path="/app/*" element={<AppEntry />} />
          <Route path="/parent" element={<ParentMiniApp />} />
          <Route path="/child" element={<ChildMiniApp />} />
          <Route path="/parent/*" element={<ParentMiniApp />} />
          <Route path="/child/*" element={<ChildMiniApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;