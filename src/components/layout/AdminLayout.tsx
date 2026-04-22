import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";
import {
  LayoutDashboard, Globe, Layers, Package, Image, Briefcase, Plus, Info, Inbox,
  Users, MessageCircle, FolderKanban, ChevronLeft, ChevronDown, ChevronRight, Menu, X, BotMessageSquare, ShieldCheck, Monitor, Store, Wallet,
  LogOut, Settings, User, SlidersHorizontal, Undo2, CreditCard, AlertCircle,
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
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelKey: string;
}

interface NavGroup {
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroupsDef: NavGroup[] = [
  {
    labelKey: "admin.aboutIntro",
    icon: Info,
    items: [
      { to: "/about", icon: Info, labelKey: "admin.viewAbout" },
    ],
  },
  {
    labelKey: "admin.siteManage",
    icon: Globe,
    items: [
      { to: "/admin/categories", icon: Layers, labelKey: "admin.categoryManage" },
      { to: "/admin/services", icon: Package, labelKey: "admin.serviceManage" },
      { to: "/admin/services?action=new", icon: Plus, labelKey: "admin.serviceRegister" },
      { to: "/admin/banners", icon: Image, labelKey: "admin.bannerManage" },
      { to: "/admin/portfolio", icon: Briefcase, labelKey: "admin.portfolioManage" },
      { to: "/admin/display-groups", icon: Monitor, labelKey: "admin.displayGroups" },
    ],
  },
  {
    labelKey: "admin.memberManage",
    icon: Users,
    items: [
      { to: "/admin/members", icon: Users, labelKey: "admin.memberList" },
      { to: "/admin/sellers", icon: Store, labelKey: "admin.sellerManage" },
      { to: "/admin/staff", icon: ShieldCheck, labelKey: "admin.staffManage" },
    ],
  },
  {
    labelKey: "admin.chatManage",
    icon: MessageCircle,
    items: [
      { to: "/admin/chat", icon: MessageCircle, labelKey: "admin.chatAdmin" },
      { to: "/admin/auto-messages", icon: BotMessageSquare, labelKey: "admin.autoMessages" },
    ],
  },
  {
    labelKey: "admin.productionManage",
    icon: FolderKanban,
    items: [
      { to: "/admin/projects", icon: FolderKanban, labelKey: "admin.projectManage" },
      { to: "/admin/settlements", icon: Wallet, labelKey: "admin.settlementManage" },
      { to: "/admin/refunds", icon: Undo2, labelKey: "환불 관리" },
      { to: "/admin/paddle", icon: CreditCard, labelKey: "Paddle 결제" },
      { to: "/admin/paddle/diagnostics", icon: AlertCircle, labelKey: "Paddle 진단" },
    ],
  },
  {
    labelKey: "admin.inquiryManage",
    icon: Inbox,
    items: [
      { to: "/admin/inquiries", icon: Inbox, labelKey: "admin.inquiryList" },
    ],
  },
  {
    labelKey: "기능 설정",
    icon: SlidersHorizontal,
    items: [
      { to: "/admin/feature-settings", icon: SlidersHorizontal, labelKey: "기능 토글" },
    ],
  },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
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
    navGroupsDef.forEach((g) => {
      init[g.labelKey] = g.items.some((i) => location.pathname === i.to);
    });
    if (!Object.values(init).some(Boolean)) init[navGroupsDef[0].labelKey] = true;
    return init;
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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

    const { error: profileError } = await supabase
      .from("admin_profiles")
      .update({ name: profileName.trim(), department: profileDept.trim() || null })
      .eq("user_id", user.id);
    if (profileError) {
      toast.error(t("admin.profileUpdateFailed") + profileError.message);
      setSaving(false);
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error(t("admin.passwordMinError"));
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error(t("admin.passwordMismatch"));
        setSaving(false);
        return;
      }
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        toast.error(t("admin.passwordChangeFailed") + pwError.message);
        setSaving(false);
        return;
      }
    }

    toast.success(t("admin.profileUpdated"));
    setSaving(false);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: "#1a1a2e" }}>
        <div className="p-5 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img src={aiFactoryLogo} alt="AI Factory 로고" className="h-8 w-auto brightness-0 invert" />
            <span className="font-bold text-white">{t("admin.title")}</span>
          </Link>
        </div>

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
            {t("admin.dashboard")}
          </Link>
        </div>

        <nav className="flex-1 px-3 pt-2 pb-3 space-y-1 overflow-y-auto">
          {navGroupsDef.map((group) => {
            const isOpen = openGroups[group.labelKey];
            const hasActive = group.items.some((i) => location.pathname === i.to);
            const groupLabel = t(group.labelKey);

            return (
              <div key={group.labelKey}>
                <button
                  onClick={() => toggleGroup(group.labelKey)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                    hasActive ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    <span className="font-medium">{groupLabel}</span>
                    {group.labelKey === "admin.chatManage" && unreadCount > 0 && (
                      <span className="ml-auto mr-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold leading-none animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {group.labelKey === "admin.productionManage" && adminNotifCount > 0 && (
                      <span className="ml-auto mr-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold leading-none animate-pulse">
                        {adminNotifCount > 99 ? "99+" : adminNotifCount}
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
                          {t(item.labelKey)}
                          {group.labelKey === "admin.chatManage" && item.labelKey === "admin.chatAdmin" && unreadCount > 0 && (
                            <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none animate-pulse">
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

        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-white/40">{t("admin.notifications")}</span>
            <AdminNotificationBell />
          </div>
          <div className="flex items-center justify-between px-3 py-1">
            <LanguageSwitcher />
          </div>
          <button
            onClick={openProfileDialog}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            {t("admin.editProfile")}
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("admin.backToSite")}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/70 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>{t("admin.emailField")}</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>{t("admin.nameField")}</Label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder={t("common.name")} />
            </div>
            <div>
              <Label>{t("admin.department")}</Label>
              <Input value={profileDept} onChange={(e) => setProfileDept(e.target.value)} placeholder={t("admin.deptPlaceholder")} />
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">{t("admin.passwordChange")}</p>
              <div className="space-y-2">
                <div>
                  <Label>{t("admin.newPassword")}</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("admin.passwordMin")} />
                </div>
                <div>
                  <Label>{t("admin.confirmPassword")}</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("admin.confirmPassword")} />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 overflow-auto bg-secondary/30">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
