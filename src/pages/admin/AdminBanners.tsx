import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
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
import { compressImage } from "@/utils/imageCompression";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      catch (err: any) { if (!cancelled) toast.error(t("admin.bannerListFailed") + err.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchBanners]);

  const refreshBannerViews = async () => {
    await fetchBanners();
    await queryClient.invalidateQueries({ queryKey: ["banners"] });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { handleDragEnd(); return; }
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((b, i) => ({ ...b, sort_order: i }));
    setBanners(updated);
    handleDragEnd();
    try {
      const promises = updated.map((b) =>
        supabase.from("banners").update({ sort_order: b.sort_order }).eq("id", b.id)
      );
      await Promise.all(promises);
      toast.success(t("admin.orderChanged"));
      await queryClient.invalidateQueries({ queryKey: ["banners"] });
    } catch {
      toast.error(t("admin.orderChangeFailed"));
      await fetchBanners();
    }
  };

  const openNew = () => { setEditId(null); setForm({ ...emptyForm, sort_order: banners.length }); setEditOpen(true); };
  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm({ title: banner.title, subtitle: banner.subtitle || "", image_url: banner.image_url || "", link_url: banner.link_url || "", active: banner.active, sort_order: banner.sort_order });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error(t("admin.enterTitle")); return; }
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("banners").update({ title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null, link_url: form.link_url || null, active: form.active, sort_order: form.sort_order }).eq("id", editId);
        if (error) throw error;
        toast.success(t("admin.bannerUpdated"));
      } else {
        const { error } = await supabase.from("banners").insert({ title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null, link_url: form.link_url || null, active: form.active, sort_order: form.sort_order });
        if (error) throw error;
        toast.success(t("admin.bannerAdded"));
      }
      setEditOpen(false);
      await refreshBannerViews();
    } catch (err: any) {
      toast.error(t("common.saveFailed") + ": " + err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.deleteConfirm"))) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { toast.error(t("common.deleteFailed") + ": " + error.message); return; }
    toast.success(t("admin.bannerDeleted"));
    await refreshBannerViews();
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase.from("banners").update({ active: !banner.active }).eq("id", banner.id);
    if (error) { toast.error(t("admin.statusChangeFailed")); return; }
    await refreshBannerViews();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) { toast.error(t("admin.imageTypeError")); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t("admin.imageSizeError")); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, "banner");
      const fileName = createBannerUploadPath(compressed.name);
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, compressed);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
      toast.success(t("admin.imageUploaded"));
    } catch (err) {
      console.error(err);
      toast.error(t("admin.imageUploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.bannerTitle")}</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.newBanner")}</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">{t("common.loading")}</p>
      ) : banners.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">{t("admin.noBanners")}</p>
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
                    <span className="text-xs text-muted-foreground">{banner.active ? t("common.active") : t("common.inactive")}</span>
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
          <p className="text-xs text-muted-foreground pt-2">{t("admin.dragHint")}</p>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? t("admin.editBanner") : t("admin.addBanner")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.titleLabel")}</Label><Textarea rows={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="줄바꿈: Enter키" /></div>
            <div><Label>{t("admin.subtitle")}</Label><Textarea rows={3} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="줄바꿈: Enter키" /></div>
            <div>
              <Label>{t("admin.bannerImage")}</Label>
              {form.image_url && !form.image_url.endsWith(".mp4") && formPreviewImageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border">
                  <img src={formPreviewImageUrl} alt={t("admin.bannerPreview")} className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder={t("admin.imageUrlPlaceholder")} className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="shrink-0">
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileUpload} />
              <div className="mt-1.5 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3" />{t("admin.recommend")}: <span className="font-medium">1920×600px</span> (PC), <span className="font-medium">768×400px</span> (Mobile)</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF · {t("admin.maxSize")}</p>
              </div>
            </div>
            <div><Label>{t("admin.linkUrl")}</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>{t("admin.activate")}</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" /> {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanners;
