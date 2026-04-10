import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false }: Props) => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to={requireAdmin || requireSuperAdmin ? "/admin" : "/login"} replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/admin" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
