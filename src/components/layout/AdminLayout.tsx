import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, FolderKanban, MessageCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "대시보드" },
  { to: "/admin/services", icon: Package, label: "서비스 관리" },
  { to: "/admin/projects", icon: FolderKanban, label: "프로젝트 관리" },
  { to: "/admin/chat", icon: MessageCircle, label: "채팅 관리" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-background shrink-0 flex flex-col">
        <div className="p-5 border-b border-background/10">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>
              AI
            </div>
            <span className="font-bold">AI팩토리 관리자</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-background/15 text-background font-medium" : "text-background/60 hover:text-background hover:bg-background/10"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-background/10">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-background/60 hover:text-background">
            <ChevronLeft className="h-4 w-4" />
            사이트로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-secondary/30 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
