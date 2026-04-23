import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { lazy, Suspense } from "react";
import PaddleOutcomeDialog from "./components/PaddleOutcomeDialog";

// Eagerly loaded (landing page)
import Index from "./pages/Index";

// Lazy loaded pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const MyProjectsPage = lazy(() => import("./pages/MyProjectsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const PortfolioDetailPage = lazy(() => import("./pages/PortfolioDetailPage"));
const PaddlePaymentLinkPage = lazy(() => import("./pages/PaddlePaymentLinkPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const RefundPolicyPage = lazy(() => import("./pages/legal/RefundPolicyPage"));
const AcceptableUsePage = lazy(() => import("./pages/legal/AcceptableUsePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminPortfolio = lazy(() => import("./pages/admin/AdminPortfolio"));
const AdminAutoMessages = lazy(() => import("./pages/admin/AdminAutoMessages"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const AdminDisplayGroups = lazy(() => import("./pages/admin/AdminDisplayGroups"));
const AdminChatPopup = lazy(() => import("./pages/admin/AdminChatPopup"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers"));
const AdminSettlements = lazy(() => import("./pages/admin/AdminSettlements"));
const AdminFeatureSettings = lazy(() => import("./pages/admin/AdminFeatureSettings"));
const AdminRefunds = lazy(() => import("./pages/admin/AdminRefunds"));
const AdminPaddle = lazy(() => import("./pages/admin/AdminPaddle"));
const AdminPaddleDiagnostics = lazy(() => import("./pages/admin/AdminPaddleDiagnostics"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminPopups = lazy(() => import("./pages/admin/AdminPopups"));
import PopupDisplay from "./components/PopupDisplay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PaddleOutcomeDialog />
          <PopupDisplay />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/pay" element={<PaddlePaymentLinkPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/acceptable-use" element={<AcceptableUsePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/my-projects" element={<MyProjectsPage />} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
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
            <Route path="/admin/feature-settings" element={<ProtectedRoute requireAdmin><AdminFeatureSettings /></ProtectedRoute>} />
            <Route path="/admin/refunds" element={<ProtectedRoute requireAdmin><AdminRefunds /></ProtectedRoute>} />
            <Route path="/admin/paddle" element={<ProtectedRoute requireAdmin><AdminPaddle /></ProtectedRoute>} />
            <Route path="/admin/paddle/diagnostics" element={<ProtectedRoute requireAdmin><AdminPaddleDiagnostics /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
            <Route path="/admin/popups" element={<ProtectedRoute requireAdmin><AdminPopups /></ProtectedRoute>} />
            <Route path="/admin/chat-popup" element={<AdminChatPopup />} />
            <Route path="/portfolio/:id" element={<PortfolioDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
