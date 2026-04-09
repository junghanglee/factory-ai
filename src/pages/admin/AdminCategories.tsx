import { useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminCategories = () => {
  const { data: cats = [], isLoading } = useCategories();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "hsl(246, 65%, 56%)", slug: "", icon_name: "Image", sort_order: 0 });

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", description: "", color: "hsl(246, 65%, 56%)", slug: "", icon_name: "Image", sort_order: cats.length + 1 });
    setEditOpen(true);
  };

  const openEdit = (cat: typeof cats[0]) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || "", color: cat.color, slug: cat.slug, icon_name: cat.icon_name, sort_order: cat.sort_order });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        const { error } = await supabase.from("categories").update({
          name: form.name, description: form.description, color: form.color, slug: form.slug, icon_name: form.icon_name, sort_order: form.sort_order,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("카테고리가 수정되었습니다.");
      } else {
        const { error } = await supabase.from("categories").insert({
          name: form.name, description: form.description, color: form.color, slug: form.slug || form.name.toLowerCase().replace(/\s/g, "-"), icon_name: form.icon_name, sort_order: form.sort_order,
        });
        if (error) throw error;
        toast.success("카테고리가 추가되었습니다.");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditOpen(false);
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("삭제되었습니다.");
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 카테고리</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium text-muted-foreground">색상</th>
                <th className="text-left p-4 font-medium text-muted-foreground">카테고리명</th>
                <th className="text-left p-4 font-medium text-muted-foreground">설명</th>
                <th className="text-left p-4 font-medium text-muted-foreground">서비스 수</th>
                <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="p-4"><div className="w-8 h-8 rounded-lg" style={{ backgroundColor: cat.color }} /></td>
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-muted-foreground">{cat.description}</td>
                  <td className="p-4">{cat.service_count}개</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "카테고리 수정" : "새 카테고리 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>카테고리명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AI 이미지/디자인" />
            </div>
            <div>
              <Label>슬러그</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ai-image" disabled={!!editId} />
            </div>
            <div>
              <Label>설명</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="로고, 배너, 상세페이지..." />
            </div>
            <div>
              <Label>색상 (HSL)</Label>
              <div className="flex gap-2 items-center">
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <div className="w-10 h-10 rounded-lg shrink-0 border" style={{ backgroundColor: form.color }} />
              </div>
            </div>
            <div>
              <Label>정렬 순서</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <Button onClick={handleSave} className="w-full gap-2"><Save className="h-4 w-4" /> 저장</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
