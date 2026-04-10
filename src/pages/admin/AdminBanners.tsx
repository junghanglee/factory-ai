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
import { createBannerUploadPath, getBannerDisplayImageUrl } from "@/lib/heroBanners";

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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formPreviewImageUrl = getBannerDisplayImageUrl(form.image_url);

  const fetchBanners = useCallback(async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    setBanners(data ?? []);
    return data ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try { await fetchBanners(); }
      catch (err: any) { if (!cancelled) toast.error("배너 목록을 불러오지 못했습니다: " + err.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchBanners]);

  const refreshBannerViews = async () => {
    await fetchBanners();
    await queryClient.invalidateQueries({ queryKey: ["banners"] });
  };

  // Drag & drop reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { handleDragEnd(); return; }
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    // Optimistic update
    const updated = reordered.map((b, i) => ({ ...b, sort_order: i }));
    setBanners(updated);
    handleDragEnd();

    // Persist all sort_order changes
    try {
      const promises = updated.map((b) =>
        supabase.from("banners").update({ sort_order: b.sort_order }).eq("id", b.id)
      );
      await Promise.all(promises);
      toast.success("순서가 변경되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["banners"] });
    } catch {
      toast.error("순서 변경 실패");
      await fetchBanners();
    }
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, sort_order: banners.length });
    setEditOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm({
      title: banner.title, subtitle: banner.subtitle || "", image_url: banner.image_url || "",
      link_url: banner.link_url || "", active: banner.active, sort_order: banner.sort_order,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요."); return; }
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("banners").update({
          title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null,
          link_url: form.link_url || null, active: form.active, sort_order: form.sort_order,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("배너가 수정되었습니다.");
      } else {
        const { error } = await supabase.from("banners").insert({
          title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null,
          link_url: form.link_url || null, active: form.active, sort_order: form.sort_order,
        });
        if (error) throw error;
        toast.success("배너가 추가되었습니다.");
      }
      setEditOpen(false);
      await refreshBannerViews();
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { toast.error("삭제 실패: " + error.message); return; }
    toast.success("배너가 삭제되었습니다.");
    await refreshBannerViews();
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase.from("banners").update({ active: !banner.active }).eq("id", banner.id);
    if (error) { toast.error("상태 변경 실패"); return; }
    await refreshBannerViews();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) { toast.error("JPG, PNG, WebP, GIF만 가능합니다."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("파일 크기는 5MB 이하만 가능합니다."); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, "banner");
      const fileName = createBannerUploadPath(compressed.name);
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, compressed);
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
        <div className="space-y-1">
          {banners.map((banner, idx) => (
            <Card
              key={banner.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDrop={() => handleDrop(idx)}
              className={`transition-all ${!banner.active ? "opacity-50" : ""} ${dragIdx === idx ? "opacity-30 scale-95" : ""} ${dragOverIdx === idx && dragIdx !== idx ? "border-primary border-2" : ""}`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                <div className="w-20 h-12 bg-secondary rounded overflow-hidden flex items-center justify-center shrink-0">
                  {banner.image_url && !banner.image_url.endsWith(".mp4") ? (
                    <img src={getBannerDisplayImageUrl(banner.image_url) || banner.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{banner.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono w-6 text-center">{idx + 1}</span>
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
          <p className="text-xs text-muted-foreground pt-2">💡 드래그하여 배너 순서를 변경할 수 있습니다. 변경 즉시 메인 캐러셀에 반영됩니다.</p>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "배너 수정" : "새 배너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>제목</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>부제목</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div>
              <Label>배너 이미지</Label>
              {form.image_url && !form.image_url.endsWith(".mp4") && formPreviewImageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border">
                  <img src={formPreviewImageUrl} alt="배너 미리보기" className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="이미지 URL 직접 입력 또는 파일 업로드" className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileUpload} />
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3" />권장: <span className="font-medium">1920×600px</span> (PC), <span className="font-medium">768×400px</span> (모바일)</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF · 최대 5MB</p>
              </div>
            </div>
            <div><Label>링크 URL</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
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
