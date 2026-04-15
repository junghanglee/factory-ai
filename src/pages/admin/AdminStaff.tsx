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

const ALL_MENUS = [
  { key: "dashboard", label: "대시보드" },
  { key: "categories", label: "카테고리 관리" },
  { key: "services", label: "서비스 관리" },
  { key: "banners", label: "배너 관리" },
  { key: "portfolio", label: "포트폴리오 관리" },
  { key: "members", label: "회원 관리" },
  { key: "chat", label: "채팅 관리" },
  { key: "auto-messages", label: "자동 메시지" },
  { key: "projects", label: "프로젝트 관리" },
];

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

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formReceiveAssignments, setFormReceiveAssignments] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
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
    setEditing(null);
    setFormEmail("");
    setFormPassword("");
    setFormName("");
    setFormDepartment("");
    setFormPermissions([]);
    setFormReceiveAssignments(true);
    setDialogOpen(true);
  };

  const openEdit = (admin: AdminProfile) => {
    setEditing(admin);
    setFormEmail("");
    setFormName(admin.name);
    setFormDepartment(admin.department || "");
    setFormPermissions(admin.menu_permissions || []);
    setFormReceiveAssignments(admin.receive_assignments ?? true);
    setDialogOpen(true);
  };

  const openPasswordDialog = (admin: AdminProfile) => {
    setPasswordTarget(admin);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("admin_profiles")
        .update({
          name: formName.trim(),
          department: formDepartment.trim() || null,
          menu_permissions: formPermissions,
          receive_assignments: formReceiveAssignments,
        })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "수정 실패", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "관리자 정보가 수정되었습니다" });
      }
    } else {
      if (!formEmail.trim()) {
        toast({ title: "이메일을 입력해주세요", variant: "destructive" });
        setSaving(false);
        return;
      }
      if (!formPassword.trim() || formPassword.length < 6) {
        toast({ title: "비밀번호를 6자 이상 입력해주세요", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-admin-user", {
        body: {
          email: formEmail.trim(),
          password: formPassword,
          name: formName.trim(),
          department: formDepartment.trim() || null,
          menu_permissions: formPermissions,
        },
      });

      if (error || data?.error) {
        toast({ title: "등록 실패", description: error?.message || data?.error, variant: "destructive" });
      } else {
        toast({ title: "관리자가 등록되었습니다" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAdmins();
  };

  const handlePasswordChange = async () => {
    if (!passwordTarget) return;
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "비밀번호를 6자 이상 입력해주세요", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "비밀번호가 일치하지 않습니다", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const { data, error } = await supabase.functions.invoke("update-admin-password", {
      body: {
        user_id: passwordTarget.user_id,
        new_password: newPassword,
      },
    });

    if (error || data?.error) {
      toast({ title: "비밀번호 변경 실패", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "비밀번호가 변경되었습니다" });
      setPasswordDialogOpen(false);
    }
    setChangingPassword(false);
  };

  const handleDelete = async (admin: AdminProfile) => {
    if (!confirm(`${admin.name} 관리자를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from("admin_profiles").delete().eq("id", admin.id);
    if (!error) {
      await supabase.from("user_roles").delete().eq("user_id", admin.user_id);
      toast({ title: "관리자가 삭제되었습니다" });
      fetchAdmins();
    }
  };

  const toggleActive = async (admin: AdminProfile) => {
    await supabase
      .from("admin_profiles")
      .update({ active: !admin.active })
      .eq("id", admin.id);
    fetchAdmins();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">관리자 관리</h1>
        <Button onClick={openNew} className="gap-2" disabled={!isSuperAdmin}>
          <Plus className="h-4 w-4" /> 관리자 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium text-muted-foreground">이름</th>
                <th className="text-left p-4 font-medium text-muted-foreground">소속</th>
                <th className="text-left p-4 font-medium text-muted-foreground">접근 메뉴</th>
                <th className="text-left p-4 font-medium text-muted-foreground">상담배정</th>
                <th className="text-left p-4 font-medium text-muted-foreground">상태</th>
                <th className="text-left p-4 font-medium text-muted-foreground">등록일</th>
                <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">로딩 중...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">등록된 관리자가 없습니다</td></tr>
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
                          <span className="text-muted-foreground text-xs">권한 없음</span>
                        ) : (
                          admin.menu_permissions.map((p) => {
                            const menu = ALL_MENUS.find((m) => m.key === p);
                            return (
                              <span key={p} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">
                                {menu?.label || p}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        admin.receive_assignments ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {admin.receive_assignments ? "수신" : "미수신"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(admin)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          admin.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {admin.active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(admin)} title="정보 수정">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPasswordDialog(admin)} title="비밀번호 변경">
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

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "관리자 수정" : "관리자 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <>
                <div>
                  <Label>이메일</Label>
                  <Input placeholder="관리자 이메일" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <Label>비밀번호</Label>
                  <Input type="password" placeholder="6자 이상 비밀번호" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>이름</Label>
              <Input placeholder="관리자 이름" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <Label>소속</Label>
              <Input placeholder="소속 부서" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>상담 배정 수신</Label>
              <Switch checked={formReceiveAssignments} onCheckedChange={setFormReceiveAssignments} />
            </div>
            <div>
              <Label className="mb-2 block">접근 메뉴 권한</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MENUS.map((menu) => (
                  <label key={menu.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={formPermissions.includes(menu.key)} onCheckedChange={() => togglePermission(menu.key)} />
                    {menu.label}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "저장 중..." : editing ? "수정" : "등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{passwordTarget?.name} 비밀번호 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>새 비밀번호</Label>
              <Input type="password" placeholder="6자 이상" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label>비밀번호 확인</Label>
              <Input type="password" placeholder="비밀번호 재입력" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button onClick={handlePasswordChange} disabled={changingPassword} className="w-full">
              {changingPassword ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStaff;
