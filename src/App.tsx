import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import CategoryPage from "./pages/CategoryPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ChatPage from "./pages/ChatPage";
import OrderPage from "./pages/OrderPage";
import MyProjectsPage from "./pages/MyProjectsPage";
import MyPage from "./pages/MyPage";
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
import AdminAutoMessages from "./pages/admin/AdminAutoMessages";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminDisplayGroups from "./pages/admin/AdminDisplayGroups";
import AdminChatPopup from "./pages/admin/AdminChatPopup";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import PortfolioDetailPage from "./pages/PortfolioDetailPage";
import SearchPage from "./pages/SearchPage";
import SellerApplyPage from "./pages/SellerApplyPage";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfilePage from "./pages/SellerProfilePage";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminSettlements from "./pages/admin/AdminSettlements";
import NotFound from "./pages/NotFound";
import SellerLoginNotifications from "./components/seller/SellerLoginNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("Query error:", error);
      toast.error("데이터를 불러오는 중 오류가 발생했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("처리 중 오류가 발생했습니다.", {
        description: "네트워크 상태를 확인하고 다시 시도해주세요.",
      });
    },
  }),
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SellerLoginNotifications />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/my-projects" element={<MyProjectsPage />} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/seller/apply" element={<SellerApplyPage />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/:id" element={<SellerProfilePage />} />
            {/* Admin login */}
            <Route path="/admin" element={<AdminLoginPage />} />
            {/* Admin routes - require admin role */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute requireAdmin><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/banners" element={<ProtectedRoute requireAdmin><AdminBanners /></ProtectedRoute>} />
            <Route path="/admin/portfolio" element={<ProtectedRoute requireAdmin><AdminPortfolio /></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute requireAdmin><AdminMembers /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute requireAdmin><AdminProjects /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute requireAdmin><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/auto-messages" element={<ProtectedRoute requireAdmin><AdminAutoMessages /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute requireAdmin><AdminStaff /></ProtectedRoute>} />
            <Route path="/admin/inquiries" element={<ProtectedRoute requireAdmin><AdminInquiries /></ProtectedRoute>} />
            <Route path="/admin/display-groups" element={<ProtectedRoute requireAdmin><AdminDisplayGroups /></ProtectedRoute>} />
            <Route path="/admin/sellers" element={<ProtectedRoute requireAdmin><AdminSellers /></ProtectedRoute>} />
            <Route path="/admin/settlements" element={<ProtectedRoute requireAdmin><AdminSettlements /></ProtectedRoute>} />
            <Route path="/admin/chat-popup" element={<AdminChatPopup />} />
            <Route path="/portfolio/:id" element={<PortfolioDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
