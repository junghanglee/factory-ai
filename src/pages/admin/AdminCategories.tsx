import { useState } from "react";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categories as initialCategories } from "@/data/categories";

const AdminCategories = () => {
  const [cats, setCats] = useState(initialCategories);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ id: "", name: "", description: "", color: "hsl(246, 65%, 56%)", serviceCount: 0 });

  const openNew = () => {
    setEditIdx(null);
    setForm({ id: "", name: "", description: "", color: "hsl(246, 65%, 56%)", serviceCount: 0 });
    setEditOpen(true);
  };

  const openEdit = (idx: number) => {
    const c = cats[idx];
    setEditIdx(idx);
    setForm({ id: c.id, name: c.name, description: c.description, color: c.color, serviceCount: c.serviceCount });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (editIdx !== null) {
      setCats((prev) => prev.map((c, i) => (i === editIdx ? { ...c, ...form } : c)));
    } else {
      setCats((prev) => [...prev, { ...form, id: form.id || `cat-${Date.now()}`, image: prev[0]?.image }]);
    }
    setEditOpen(false);
  };

  const handleDelete = (idx: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setCats((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> 새 카테고리
        </Button>
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
              {cats.map((cat, idx) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="p-4">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: cat.color }} />
                  </td>
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-muted-foreground">{cat.description}</td>
                  <td className="p-4">{cat.serviceCount}개</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(idx)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(idx)}>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIdx !== null ? "카테고리 수정" : "새 카테고리 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>카테고리 ID</Label>
              <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ai-image" disabled={editIdx !== null} />
            </div>
            <div>
              <Label>카테고리명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AI 이미지/디자인" />
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
            <Button onClick={handleSave} className="w-full gap-2">
              <Save className="h-4 w-4" /> 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
