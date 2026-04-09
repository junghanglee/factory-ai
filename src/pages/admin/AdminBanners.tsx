import { useState } from "react";
import { Plus, Edit, Trash2, Save, GripVertical } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  order: number;
}

const initialBanners: Banner[] = [
  { id: "b1", title: "AI로 만드는 콘텐츠의 새로운 기준", subtitle: "일반 에이전시 대비 반값, 더 빠르게", imageUrl: "/hero-bg.mp4", linkUrl: "/", active: true, order: 1 },
  { id: "b2", title: "로고 디자인 50% 할인 이벤트", subtitle: "이번 주 한정 특가!", imageUrl: "", linkUrl: "/service/s1", active: true, order: 2 },
  { id: "b3", title: "숏폼 영상 대량 제작 프로모션", subtitle: "10편 주문 시 2편 추가 무료", imageUrl: "", linkUrl: "/service/s3", active: false, order: 3 },
];

const AdminBanners = () => {
  const [banners, setBanners] = useState(initialBanners);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Banner>>({});

  const openNew = () => {
    setEditIdx(null);
    setForm({ id: "", title: "", subtitle: "", imageUrl: "", linkUrl: "", active: true, order: banners.length + 1 });
    setEditOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...banners[idx] });
    setEditOpen(true);
  };

  const handleSave = () => {
    const banner = { ...form, id: form.id || `b-${Date.now()}` } as Banner;
    if (editIdx !== null) {
      setBanners((prev) => prev.map((b, i) => (i === editIdx ? banner : b)));
    } else {
      setBanners((prev) => [...prev, banner]);
    }
    setEditOpen(false);
  };

  const handleDelete = (idx: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setBanners((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const toggleActive = (idx: number) => {
    setBanners((prev) => prev.map((b, i) => (i === idx ? { ...b, active: !b.active } : b)));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 배너</Button>
      </div>

      <div className="space-y-3">
        {banners.map((banner, idx) => (
          <Card key={banner.id} className={!banner.active ? "opacity-50" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
              <div className="w-16 h-10 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground shrink-0">
                {banner.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{banner.title}</p>
                <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{banner.active ? "활성" : "비활성"}</span>
                  <Switch checked={banner.active} onCheckedChange={() => toggleActive(idx)} />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(idx)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editIdx !== null ? "배너 수정" : "새 배너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>부제목</Label>
              <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>이미지/영상 URL</Label>
              <Input value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div>
              <Label>링크 URL</Label>
              <Input value={form.linkUrl || ""} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>활성화</Label>
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

export default AdminBanners;
