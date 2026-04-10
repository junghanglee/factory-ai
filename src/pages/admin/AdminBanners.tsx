import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Save, GripVertical, Upload, Image } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Banner = Tables<"banners">;

interface BannerForm {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  active: boolean;
  sort_order: number;
}

const emptyForm: BannerForm = { title: "", subtitle: "", image_url: "", link_url: "", active: true, sort_order: 0 };

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, sort_order: banners.length + 1 });
    setEditOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      active: banner.active,
      sort_order: banner.sort_order,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요."); return; }
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("banners").update({
          title: form.title,
          subtitle: form.subtitle || null,
          image_url: form.image_url || null,
          link_url: form.link_url || null,
          active: form.active,
          sort_order: form.sort_order,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("배너가 수정되었습니다.");
      } else {
        const { error } = await supabase.from("banners").insert({
          title: form.title,
          subtitle: form.subtitle || null,
          image_url: form.image_url || null,
          link_url: form.link_url || null,
          active: form.active,
          sort_order: form.sort_order,
        });
        if (error) throw error;
        toast.success("배너가 추가되었습니다.");
      }
      setEditOpen(false);
      fetchBanners();
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { toast.error("삭제 실패: " + error.message); return; }
    toast.success("배너가 삭제되었습니다.");
    fetchBanners();
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase.from("banners").update({ active: !banner.active }).eq("id", banner.id);
    if (error) { toast.error("상태 변경 실패"); return; }
    fetchBanners();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) { toast.error("JPG, PNG, WebP, GIF만 가능합니다."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("파일 크기는 5MB 이하만 가능합니다."); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      toast.success("이미지가 업로드되었습니다.");
    } catch (err) {
      console.error(err);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 배너</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">로딩 중...</p>
      ) : banners.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">등록된 배너가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.active ? "opacity-50" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
                <div className="w-20 h-12 bg-secondary rounded overflow-hidden flex items-center justify-center shrink-0">
                  {banner.image_url && !banner.image_url.endsWith(".mp4") ? (
                    <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{banner.sort_order}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{banner.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{banner.active ? "활성" : "비활성"}</span>
                    <Switch checked={banner.active} onCheckedChange={() => toggleActive(banner)} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "배너 수정" : "새 배너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>부제목</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>배너 이미지</Label>
              {form.image_url && !form.image_url.endsWith(".mp4") && (
                <div className="mb-2 rounded-lg overflow-hidden border">
                  <img src={form.image_url} alt="배너 미리보기" className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="이미지 URL 직접 입력 또는 파일 업로드"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileUpload} />
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  권장 사이즈: <span className="font-medium">1920 × 600px</span> (PC), <span className="font-medium">768 × 400px</span> (모바일)
                </p>
                <p className="text-xs text-muted-foreground">지원 형식: JPG, PNG, WebP, GIF · 최대 5MB</p>
              </div>
            </div>
            <div>
              <Label>링크 URL</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
            </div>
            <div>
              <Label>정렬 순서</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>활성화</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" /> {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanners;
