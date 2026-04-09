import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ChatPage from "./pages/ChatPage";
import OrderPage from "./pages/OrderPage";
import MyProjectsPage from "./pages/MyProjectsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminServices from "./pages/admin/AdminServices";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminChat from "./pages/admin/AdminChat";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminPortfolio from "./pages/admin/AdminPortfolio";
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
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/chat" element={<AdminChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
