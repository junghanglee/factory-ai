import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import {
  LayoutDashboard, Globe, Layers, Package, Image, Briefcase, Plus, Info, Inbox,
  Users, MessageCircle, FolderKanban, ChevronLeft, ChevronDown, ChevronRight, Menu, X, BotMessageSquare, ShieldCheck, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "AI팩토리 소개",
    icon: Info,
    items: [
      { to: "/about", icon: Info, label: "소개 페이지 보기" },
    ],
  },
  {
    label: "사이트관리",
    icon: Globe,
    items: [
      { to: "/admin/categories", icon: Layers, label: "카테고리 관리" },
      { to: "/admin/services", icon: Package, label: "서비스 관리" },
      { to: "/admin/services?action=new", icon: Plus, label: "서비스 등록" },
      { to: "/admin/banners", icon: Image, label: "배너 관리" },
      { to: "/admin/portfolio", icon: Briefcase, label: "포트폴리오 관리" },
      { to: "/admin/display-groups", icon: Monitor, label: "디스플레이 그룹" },
    ],
  },
  {
    label: "회원관리",
    icon: Users,
    items: [
      { to: "/admin/members", icon: Users, label: "회원 목록" },
    ],
  },
  {
    label: "채팅관리",
    icon: MessageCircle,
    items: [
      { to: "/admin/chat", icon: MessageCircle, label: "채팅 관리" },
      { to: "/admin/auto-messages", icon: BotMessageSquare, label: "자동 메시지" },
    ],
  },
  {
    label: "제작/납품관리",
    icon: FolderKanban,
    items: [
      { to: "/admin/projects", icon: FolderKanban, label: "프로젝트 관리" },
    ],
  },
  {
    label: "문의관리",
    icon: Inbox,
    items: [
      { to: "/admin/inquiries", icon: Inbox, label: "문의 목록" },
    ],
  },
];

const superAdminGroup: NavGroup = {
  label: "관리자관리",
  icon: ShieldCheck,
  items: [
    { to: "/admin/staff", icon: ShieldCheck, label: "관리자 목록" },
  ],
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      init[g.label] = g.items.some((i) => location.pathname === i.to);
    });
    // default open first group
    if (!Object.values(init).some(Boolean)) init[navGroups[0].label] = true;
    return init;
  });

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: "#1a1a2e" }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-8 w-auto brightness-0 invert" />
            <span className="font-bold text-white">관리자</span>
          </Link>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-3">
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              location.pathname === "/admin"
                ? "bg-white/15 text-white font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            대시보드
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 pt-2 pb-3 space-y-1 overflow-y-auto">
          {(isSuperAdmin ? [...navGroups, superAdminGroup] : navGroups).map((group) => {
            const isOpen = openGroups[group.label];
            const hasActive = group.items.some((i) => location.pathname === i.to);

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                    hasActive ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    <span className="font-medium">{group.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const active = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            active
                              ? "bg-white/15 text-white font-medium"
                              : "text-white/50 hover:text-white hover:bg-white/8"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Back to site */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            사이트로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
