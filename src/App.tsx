
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InstalmentPurchases from "./pages/InstalmentPurchases";
import RecurringPurchases from "./pages/RecurringPurchases";
import FixedExpenses from "./pages/FixedExpenses";
import Income from "./pages/Income";
import ShoppingList from "./pages/ShoppingList";
import CreditCards from "./pages/CreditCards";
import { Footer } from "@/components/Footer";
import { ValuesVisibilityProvider } from "@/hooks/useValuesVisibility";
import { ValuesToggle } from "@/components/ValuesToggle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ValuesVisibilityProvider>
            <ValuesToggle />
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/instalment-purchases" element={<InstalmentPurchases />} />
                <Route path="/recurring-purchases" element={<RecurringPurchases />} />
                <Route path="/fixed-expenses" element={<FixedExpenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
          </ValuesVisibilityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
