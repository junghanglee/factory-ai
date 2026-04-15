import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import {
  LayoutDashboard, Globe, Layers, Package, Image, Briefcase, Plus, Info, Inbox,
  Users, MessageCircle, FolderKanban, ChevronLeft, ChevronDown, ChevronRight, Menu, X, BotMessageSquare, ShieldCheck, Monitor, Store, Wallet,
  LogOut, Settings, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

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
      { to: "/admin/sellers", icon: Store, label: "판매자 관리" },
      { to: "/admin/staff", icon: ShieldCheck, label: "직원 관리" },
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
      { to: "/admin/settlements", icon: Wallet, label: "정산 관리" },
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

// superAdminGroup removed - staff management moved into 회원관리 group

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { unreadCount } = useUnreadChat();
  const { unreadCount: adminNotifCount } = useAdminNotifications();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDept, setProfileDept] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      init[g.label] = g.items.some((i) => location.pathname === i.to);
    });
    if (!Object.values(init).some(Boolean)) init[navGroups[0].label] = true;
    return init;
  });

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleLogout = async () => {
    await signOut();
    navigate("/admin");
  };

  const openProfileDialog = async () => {
    if (user) {
      const { data } = await supabase
        .from("admin_profiles")
        .select("name, department")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfileName(data.name || "");
        setProfileDept(data.department || "");
      }
    }
    setNewPassword("");
    setConfirmPassword("");
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    // Update admin_profiles
    const { error: profileError } = await supabase
      .from("admin_profiles")
      .update({ name: profileName.trim(), department: profileDept.trim() || null })
      .eq("user_id", user.id);
    if (profileError) {
      toast.error("정보 수정 실패: " + profileError.message);
      setSaving(false);
      return;
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("비밀번호는 6자 이상이어야 합니다.");
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("비밀번호가 일치하지 않습니다.");
        setSaving(false);
        return;
      }
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        toast.error("비밀번호 변경 실패: " + pwError.message);
        setSaving(false);
        return;
      }
    }

    toast.success("정보가 수정되었습니다.");
    setSaving(false);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: "#1a1a2e" }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-8 w-auto brightness-0 invert" />
            <span className="font-bold text-white">관리자</span>
          </Link>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-3">
          <Link
            to="/admin/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              location.pathname === "/admin/dashboard"
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
          {navGroups.map((group) => {
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
                    {group.label === "채팅관리" && unreadCount > 0 && (
                      <span className="ml-auto mr-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
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
                          {group.label === "채팅관리" && item.label === "채팅 관리" && unreadCount > 0 && (
                            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-white/40">알림</span>
            <AdminNotificationBell />
          </div>
          <button
            onClick={openProfileDialog}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            내 정보 수정
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            사이트로 돌아가기
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/70 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Profile edit dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>내 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>이메일</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>이름</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="이름" />
            </div>
            <div>
              <Label>소속</Label>
              <Input value={profileDept} onChange={(e) => setProfileDept(e.target.value)} placeholder="소속 부서" />
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">비밀번호 변경 (변경하지 않으려면 비워두세요)</p>
              <div className="space-y-2">
                <div>
                  <Label>새 비밀번호</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="6자 이상" />
                </div>
                <div>
                  <Label>비밀번호 확인</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="비밀번호 확인" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-secondary/30">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
