import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CategoryJobs from "./pages/CategoryJobs";
import SearchResults from "./pages/SearchResults";
import Preferences from "./pages/Preferences";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { AuthModal } from "./components/AuthModal";
import { useAuthModal } from "./context/AuthModalContext";
import { JobActionsProvider } from "./context/JobActionsContext";
import { PreferencesProvider } from "./context/PreferencesContext";

const queryClient = new QueryClient();

const App = () => {
  const { isOpen, mode, closeModal, setMode } = useAuthModal();

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <JobActionsProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/category/:categoryId" element={<CategoryJobs />} />
                <Route path="/preferences" element={<Preferences />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </JobActionsProvider>
        </PreferencesProvider>
      </QueryClientProvider>
      <AuthModal 
        open={isOpen}
        onOpenChange={closeModal}
        mode={mode}
        onModeChange={setMode}
      />
    </>
  )
};

export default App;
