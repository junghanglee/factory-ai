import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Copy, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  point_amount: number;
  usage_limit: number;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: "",
  description: "",
  point_amount: 1000,
  usage_limit: 1,
  active: true,
  expires_at: "",
};

const generateCode = (len = 10) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, code: generateCode() });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || "",
      point_amount: c.point_amount,
      usage_limit: c.usage_limit,
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("쿠폰 코드를 입력해주세요.");
      return;
    }
    if (form.point_amount <= 0) {
      toast.error("적립 포인트는 1 이상이어야 합니다.");
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      point_amount: form.point_amount,
      usage_limit: form.usage_limit,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "이미 존재하는 코드입니다." : error.message);
      return;
    }
    toast.success(editing ? "쿠폰이 수정되었습니다." : "쿠폰이 생성되었습니다.");
    setOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("이 쿠폰을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("삭제되었습니다.");
    fetchData();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (!error) {
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("코드가 복사되었습니다.");
  };

  const total = coupons.length;
  const activeCount = coupons.filter((c) => c.active).length;
  const usedTotal = coupons.reduce((s, c) => s + c.used_count, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" /> 쿠폰 관리
          </h1>
          <Button onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> 새 쿠폰</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">전체 쿠폰</p>
            <p className="text-xl font-bold">{total}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">활성 쿠폰</p>
            <p className="text-xl font-bold text-green-600">{activeCount}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">총 사용 횟수</p>
            <p className="text-xl font-bold text-primary">{usedTotal}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3">코드</th>
                  <th className="text-left p-3">설명</th>
                  <th className="text-right p-3">포인트</th>
                  <th className="text-right p-3">사용/한도</th>
                  <th className="text-left p-3">만료일</th>
                  <th className="text-center p-3">활성</th>
                  <th className="text-center p-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">불러오는 중...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">등록된 쿠폰이 없습니다.</td></tr>
                ) : coupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <code className="font-mono font-bold text-primary">{c.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.description || "-"}</td>
                    <td className="p-3 text-right font-medium">{c.point_amount.toLocaleString()}P</td>
                    <td className="p-3 text-right">{c.used_count} / {c.usage_limit === 0 ? "∞" : c.usage_limit}</td>
                    <td className="p-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("ko-KR") : "-"}</td>
                    <td className="p-3 text-center">
                      <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "쿠폰 수정" : "새 쿠폰 생성"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>쿠폰 코드</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="font-mono uppercase" />
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, code: generateCode() })}>자동생성</Button>
                </div>
              </div>
              <div>
                <Label>설명</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="예: 신규가입 쿠폰" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>적립 포인트</Label>
                  <Input type="number" value={form.point_amount} onChange={(e) => setForm({ ...form, point_amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>사용 한도 (0=무제한)</Label>
                  <Input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>만료일 (선택)</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>활성</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
              <Button onClick={save} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
