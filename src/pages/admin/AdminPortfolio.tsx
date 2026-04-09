import { useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
}

const initialItems: PortfolioItem[] = [
  { id: "pf1", title: "브랜드 로고 디자인", description: "스타트업 브랜딩 프로젝트", imageUrl: "https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=300&fit=crop", category: "AI 이미지/디자인" },
  { id: "pf2", title: "숏폼 영상 5편", description: "뷰티 브랜드 SNS 콘텐츠", imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop", category: "AI 영상/모션" },
  { id: "pf3", title: "SEO 블로그 10편", description: "IT 기업 블로그 마케팅", imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop", category: "AI 글/카피라이팅" },
  { id: "pf4", title: "광고 소재 20종", description: "이커머스 퍼포먼스 광고", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop", category: "AI 광고 제작" },
];

const AdminPortfolio = () => {
  const [items, setItems] = useState(initialItems);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<PortfolioItem>>({});

  const openNew = () => {
    setEditIdx(null);
    setForm({ id: "", title: "", description: "", imageUrl: "", category: "" });
    setEditOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...items[idx] });
    setEditOpen(true);
  };

  const handleSave = () => {
    const item = { ...form, id: form.id || `pf-${Date.now()}` } as PortfolioItem;
    if (editIdx !== null) {
      setItems((prev) => prev.map((p, i) => (i === editIdx ? item : p)));
    } else {
      setItems((prev) => [...prev, item]);
    }
    setEditOpen(false);
  };

  const handleDelete = (idx: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setItems((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">포트폴리오 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 항목</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <Card key={item.id} className="overflow-hidden">
            <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
            <CardContent className="p-4">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded">{item.category}</span>
              <div className="flex gap-1 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(idx)} className="gap-1">
                  <Edit className="h-3 w-3" /> 수정
                </Button>
                <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={() => handleDelete(idx)}>
                  <Trash2 className="h-3 w-3" /> 삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIdx !== null ? "포트폴리오 수정" : "새 포트폴리오 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>설명</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>이미지 URL</Label>
              <Input value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div>
              <Label>카테고리</Label>
              <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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

export default AdminPortfolio;
