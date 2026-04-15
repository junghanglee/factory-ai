import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Shield, Key } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface AdminProfile {
  id: string;
  user_id: string;
  name: string;
  department: string | null;
  menu_permissions: string[];
  active: boolean;
  receive_assignments: boolean;
  created_at: string;
}

const MENU_KEYS = ["dashboard", "categories", "services", "banners", "portfolio", "members", "chat", "auto-messages", "projects"];

const AdminStaff = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminProfile | null>(null);

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formReceiveAssignments, setFormReceiveAssignments] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setAdmins(data as unknown as AdminProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const openNew = () => {
    setEditing(null); setFormEmail(""); setFormPassword(""); setFormName(""); setFormDepartment(""); setFormPermissions([]); setFormReceiveAssignments(true); setDialogOpen(true);
  };

  const openEdit = (admin: AdminProfile) => {
    setEditing(admin); setFormEmail(""); setFormName(admin.name); setFormDepartment(admin.department || ""); setFormPermissions(admin.menu_permissions || []); setFormReceiveAssignments(admin.receive_assignments ?? true); setDialogOpen(true);
  };

  const openPasswordDialog = (admin: AdminProfile) => {
    setPasswordTarget(admin); setNewPassword(""); setConfirmPassword(""); setPasswordDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast({ title: t("admin.enterName"), variant: "destructive" }); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("admin_profiles").update({ name: formName.trim(), department: formDepartment.trim() || null, menu_permissions: formPermissions, receive_assignments: formReceiveAssignments }).eq("id", editing.id);
      if (error) { toast({ title: t("admin.updateFailed"), description: error.message, variant: "destructive" }); }
      else { toast({ title: t("admin.adminUpdated") }); }
    } else {
      if (!formEmail.trim()) { toast({ title: t("admin.enterEmail"), variant: "destructive" }); setSaving(false); return; }
      if (!formPassword.trim() || formPassword.length < 6) { toast({ title: t("admin.enterPasswordMin6"), variant: "destructive" }); setSaving(false); return; }
      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: { email: formEmail.trim(), password: formPassword, name: formName.trim(), department: formDepartment.trim() || null, menu_permissions: formPermissions },
      });
      if (error || data?.error) { toast({ title: t("admin.registrationFailed"), description: error?.message || data?.error, variant: "destructive" }); }
      else { toast({ title: t("admin.adminRegistered") }); }
    }
    setSaving(false); setDialogOpen(false); fetchAdmins();
  };

  const handlePasswordChange = async () => {
    if (!passwordTarget) return;
    if (!newPassword || newPassword.length < 6) { toast({ title: t("admin.enterPasswordMin6"), variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: t("admin.passwordMismatchError"), variant: "destructive" }); return; }
    setChangingPassword(true);
    const { data, error } = await supabase.functions.invoke("update-admin-password", {
      body: { user_id: passwordTarget.user_id, new_password: newPassword },
    });
    if (error || data?.error) { toast({ title: t("admin.passwordChangeFail"), description: error?.message || data?.error, variant: "destructive" }); }
    else { toast({ title: t("admin.passwordChangedSuccess") }); setPasswordDialogOpen(false); }
    setChangingPassword(false);
  };

  const handleDelete = async (admin: AdminProfile) => {
    if (!confirm(t("admin.deleteAdminConfirm", { name: admin.name }))) return;
    const { error } = await supabase.from("admin_profiles").delete().eq("id", admin.id);
    if (!error) {
      await supabase.from("user_roles").delete().eq("user_id", admin.user_id);
      toast({ title: t("admin.adminDeleted") });
      fetchAdmins();
    }
  };

  const toggleActive = async (admin: AdminProfile) => {
    await supabase.from("admin_profiles").update({ active: !admin.active }).eq("id", admin.id);
    fetchAdmins();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.staffTitle")}</h1>
        <Button onClick={openNew} className="gap-2" disabled={!isSuperAdmin}>
          <Plus className="h-4 w-4" /> {t("admin.addAdmin")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.name")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.dept")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.accessMenus")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.chatAssignment")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.status")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.registeredDate")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.manage")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("admin.noAdmins")}</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {admin.name}
                    </td>
                    <td className="p-4 text-muted-foreground">{admin.department || "-"}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(admin.menu_permissions || []).length === 0 ? (
                          <span className="text-muted-foreground text-xs">{t("admin.noPermissions")}</span>
                        ) : (
                          admin.menu_permissions.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">
                              {t(`admin.menuLabels.${p}`, p)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        admin.receive_assignments ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {admin.receive_assignments ? t("admin.receiving") : t("admin.notReceiving")}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(admin)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          admin.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {admin.active ? t("common.active") : t("common.inactive")}
                      </button>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(admin)} title={t("common.edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPasswordDialog(admin)} title={t("admin.changePassword")}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(admin)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.editAdmin") : t("admin.addAdmin")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <>
                <div>
                  <Label>{t("common.email")}</Label>
                  <Input placeholder={t("admin.adminEmail")} value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <Label>{t("common.password")}</Label>
                  <Input type="password" placeholder={t("admin.adminPassword")} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>{t("common.name")}</Label>
              <Input placeholder={t("admin.adminName")} value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>{t("admin.dept")}</Label>
              <Input placeholder={t("admin.deptPlaceholder")} value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("admin.receiveAssignment")}</Label>
              <Switch checked={formReceiveAssignments} onCheckedChange={setFormReceiveAssignments} />
            </div>
            <div>
              <Label className="mb-2 block">{t("admin.menuPermissions")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {MENU_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={formPermissions.includes(key)} onCheckedChange={() => togglePermission(key)} />
                    {t(`admin.menuLabels.${key}`, key)}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? t("common.saving") : editing ? t("common.edit") : t("admin.register")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.passwordChangeTitle", { name: passwordTarget?.name })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("admin.newPasswordLabel")}</Label>
              <Input type="password" placeholder={t("admin.passwordMin")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label>{t("admin.confirmPasswordLabel")}</Label>
              <Input type="password" placeholder={t("admin.passwordReenter")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handlePasswordChange} disabled={changingPassword} className="w-full">
              {changingPassword ? t("admin.changingPassword") : t("admin.changePassword")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStaff;
