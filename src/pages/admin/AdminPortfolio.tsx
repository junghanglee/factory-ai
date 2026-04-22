import { useState, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Save, GripVertical, Upload, X, FileText, Film, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCategories } from "@/hooks/useSupabaseData";
import { compressFiles } from "@/utils/imageCompression";
import { useTranslation } from "react-i18next";

interface PortfolioItem {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  image_url: string | null;
  category: string | null;
  active: boolean;
  sort_order: number;
  files: string[];
  detail_images: string[];
  final_outputs: string[];
  client_name: string | null;
  duration: string | null;
  cost: string | null;
  show_extra_info: boolean;
}

interface FormState {
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  image_url: string;
  category: string;
  active: boolean;
  files: string[];
  detail_images: string[];
  final_outputs: string[];
  client_name: string;
  duration: string;
  cost: string;
  show_extra_info: boolean;
}

const emptyForm: FormState = {
  title: "", title_en: "", description: "", description_en: "", image_url: "", category: "",
  active: true, files: [], detail_images: [], final_outputs: [], client_name: "", duration: "", cost: "", show_extra_info: false,
};

function SortableCard({ item, onEdit, onDelete, onToggle }: {
  item: PortfolioItem; onEdit: () => void; onDelete: () => void; onToggle: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const thumbnail = item.image_url || "";
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || url.includes("unsplash");

  return (
    <Card ref={setNodeRef} style={style} className={`overflow-hidden ${!item.active ? "opacity-50" : ""}`}>
      <div className="relative">
        {thumbnail && isImage(thumbnail) ? (
          <img src={thumbnail} alt={item.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-secondary flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <button {...attributes} {...listeners} className="absolute top-2 left-2 bg-background/80 rounded p-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="absolute top-2 right-2">
          <Switch checked={item.active} onCheckedChange={onToggle} />
        </div>
      </div>
      <CardContent className="p-4">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-sm text-muted-foreground mb-1 truncate">{item.description}</p>
        {item.category && <span className="text-xs bg-secondary px-2 py-0.5 rounded">{item.category}</span>}
        {item.detail_images?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">🖼 상세이미지 {item.detail_images.length}개</p>
        )}
        {item.files?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">📎 파일 {item.files.length}개</p>
        )}
        <div className="flex gap-1 mt-3">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1"><Edit className="h-3 w-3" /> 수정</Button>
          <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={onDelete}><Trash2 className="h-3 w-3" /> 삭제</Button>
        </div>
      </CardContent>
    </Card>
  );
}

const AdminPortfolio = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finalOutputInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["portfolio_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, files: d.files || [], detail_images: d.detail_images || [], final_outputs: d.final_outputs || [] })) as PortfolioItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; data: Partial<PortfolioItem> }) => {
      if (payload.id) {
        const { error } = await supabase.from("portfolio_items").update(payload.data).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("portfolio_items").insert(payload.data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["portfolio_items"] }); toast.success("저장되었습니다"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["portfolio_items"] }); toast.success("삭제되었습니다"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      for (const item of ordered) {
        await supabase.from("portfolio_items").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio_items"] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    const updates = reordered.map((item, idx) => ({ id: item.id, sort_order: idx }));
    queryClient.setQueryData(["portfolio_items"], reordered.map((item, idx) => ({ ...item, sort_order: idx })));
    reorderMutation.mutate(updates);
  };

  const openNew = () => { setEditId(null); setForm({ ...emptyForm }); setEditOpen(true); };
  const openEdit = (item: PortfolioItem) => {
    setEditId(item.id);
    setForm({
      title: item.title, title_en: (item as any).title_en || "", description: item.description || "", description_en: (item as any).description_en || "",
      image_url: item.image_url || "", category: item.category || "", active: item.active, files: item.files || [],
      detail_images: item.detail_images || [], final_outputs: item.final_outputs || [],
      client_name: item.client_name || "", duration: item.duration || "", cost: item.cost || "",
      show_extra_info: item.show_extra_info,
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요"); return; }
    const payload: Partial<PortfolioItem> = {
      title: form.title, title_en: form.title_en || null, description: form.description || null, description_en: form.description_en || null,
      image_url: form.image_url || null, category: form.category || null, active: form.active, files: form.files,
      detail_images: form.detail_images, final_outputs: form.final_outputs,
      client_name: form.client_name || null, duration: form.duration || null, cost: form.cost || null,
      show_extra_info: form.show_extra_info,
    };
    if (!editId) payload.sort_order = items.length;
    saveMutation.mutate({ id: editId ?? undefined, data: payload }, { onSuccess: () => setEditOpen(false) });
  };

  const handleDelete = (id: string) => { if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate(id); };
  const handleToggle = (id: string, active: boolean) => { saveMutation.mutate({ id, data: { active } }); };

  const uploadToStorage = useCallback(async (fileList: FileList | File[]): Promise<string[]> => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return [];
    // Compress images for web (videos pass through)
    const files = await compressFiles(rawFiles);
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("portfolio-files").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("portfolio-files").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  }, []);

  const uploadThumbnail = useCallback(async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      const urls = await uploadToStorage(fileList);
      if (urls.length > 0) setForm((prev) => ({ ...prev, image_url: urls[0] }));
      toast.success("대표이미지 업로드 완료");
    } catch (e: any) { toast.error("업로드 실패: " + e.message); }
    finally { setUploading(false); }
  }, [uploadToStorage]);

  const uploadDetailImages = useCallback(async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      const urls = await uploadToStorage(fileList);
      setForm((prev) => ({ ...prev, detail_images: [...prev.detail_images, ...urls] }));
      toast.success(`${urls.length}개 상세이미지 업로드 완료`);
    } catch (e: any) { toast.error("업로드 실패: " + e.message); }
    finally { setUploading(false); }
  }, [uploadToStorage]);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      const urls = await uploadToStorage(fileList);
      setForm((prev) => ({ ...prev, files: [...prev.files, ...urls] }));
      toast.success(`${urls.length}개 파일 업로드 완료`);
    } catch (e: any) { toast.error("업로드 실패: " + e.message); }
    finally { setUploading(false); }
  }, [uploadToStorage]);

  const uploadFinalOutputs = useCallback(async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      const urls = await uploadToStorage(fileList);
      setForm((prev) => ({ ...prev, final_outputs: [...prev.final_outputs, ...urls] }));
      toast.success(`${urls.length}개 최종결과물 업로드 완료`);
    } catch (e: any) { toast.error("업로드 실패: " + e.message); }
    finally { setUploading(false); }
  }, [uploadToStorage]);

  const removeDetailImage = (idx: number) => {
    setForm((prev) => ({ ...prev, detail_images: prev.detail_images.filter((_, i) => i !== idx) }));
  };
  const removeFile = (idx: number) => {
    setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
  };
  const removeFinalOutput = (idx: number) => {
    setForm((prev) => ({ ...prev, final_outputs: prev.final_outputs.filter((_, i) => i !== idx) }));
  };

  const getFileName = (url: string) => {
    try { return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file"); } catch { return "file"; }
  };
  const isImageFile = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">포트폴리오 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 항목</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">등록된 포트폴리오가 없습니다.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <SortableCard key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} onToggle={(v) => handleToggle(item.id, v)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "포트폴리오 수정" : "새 포트폴리오 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <Label>제목 (한국어) *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="포트폴리오 제목" />
            </div>
            <div>
              <Label>Title (English)</Label>
              <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} placeholder="Portfolio title in English" />
            </div>
            {/* 설명 */}
            <div>
              <Label>설명 (한국어, 50자 이내)</Label>
              <Textarea
                value={form.description}
                maxLength={50}
                onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 50) })}
                rows={2}
                placeholder="간단한 설명"
              />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length}/50</p>
            </div>
            <div>
              <Label>Description (English, max 100 chars)</Label>
              <Textarea
                value={form.description_en}
                maxLength={100}
                onChange={(e) => setForm({ ...form, description_en: e.target.value.slice(0, 100) })}
                rows={2}
                placeholder="Short description in English"
              />
              <p className="text-xs text-muted-foreground mt-1">{form.description_en.length}/100</p>
            </div>

            {/* 대표이미지 */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="font-semibold">📸 대표이미지 (리스트 썸네일)</Label>
              {form.image_url ? (
                <div className="relative inline-block">
                  <img src={form.image_url} alt="대표이미지" className="h-32 rounded object-cover" />
                  <button onClick={() => setForm({ ...form, image_url: "" })} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => thumbnailInputRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) uploadThumbnail(e.dataTransfer.files); }}
                  onDragOver={(e) => { e.preventDefault(); }}
                >
                  <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{uploading ? "업로드 중..." : "클릭 또는 드래그하여 대표이미지 등록"}</p>
                </div>
              )}
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="또는 이미지 URL 직접 입력" className="text-xs" />
              <input ref={thumbnailInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files) uploadThumbnail(e.target.files); e.target.value = ""; }} />
            </div>

            {/* 상세이미지 */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="font-semibold">🖼 상세이미지 (상세페이지 노출, 다수 등록 가능)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => detailInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) uploadDetailImages(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); }}
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploading ? "업로드 중..." : "클릭 또는 드래그하여 상세이미지 추가"}</p>
              </div>
              <input ref={detailInputRef} type="file" multiple className="hidden" accept="image/*" onChange={(e) => { if (e.target.files) uploadDetailImages(e.target.files); e.target.value = ""; }} />
              {form.detail_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {form.detail_images.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="h-20 w-full object-cover rounded" />
                      <button onClick={() => removeDetailImage(idx)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 첨부파일 */}
            <div>
              <Label>📎 첨부파일 (동영상, 문서 등)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); }}
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploading ? "업로드 중..." : "클릭 또는 드래그하여 파일 추가"}</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }} />
              {form.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.files.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary rounded px-2 py-1">
                      {isImageFile(url) ? <img src={url} alt="" className="h-8 w-8 object-cover rounded" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="text-xs truncate flex-1">{getFileName(url)}</span>
                      <button onClick={() => removeFile(idx)} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최종결과물 */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="font-semibold">🎬 최종결과물 (영상/이미지, 상세페이지 최상단 노출, 다수 등록 가능)</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => finalOutputInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) uploadFinalOutputs(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); }}
              >
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploading ? "업로드 중..." : "클릭 또는 드래그하여 최종결과물 추가 (영상/이미지)"}</p>
              </div>
              <input ref={finalOutputInputRef} type="file" multiple className="hidden" accept="image/*,video/*" onChange={(e) => { if (e.target.files) uploadFinalOutputs(e.target.files); e.target.value = ""; }} />
              {/* URL 직접 입력 */}
              <div className="flex gap-2">
                <Input
                  placeholder="URL 직접 입력 (영상/이미지)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) { setForm((prev) => ({ ...prev, final_outputs: [...prev.final_outputs, val] })); (e.target as HTMLInputElement).value = ""; }
                    }
                  }}
                  className="text-xs"
                />
              </div>
              {form.final_outputs.length > 0 && (
                <div className="space-y-2 mt-2">
                  {form.final_outputs.map((url, idx) => {
                    const isVideo = /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-secondary rounded px-2 py-1">
                        {isVideo ? <Film className="h-4 w-4 text-primary shrink-0" /> : isImageFile(url) ? <img src={url} alt="" className="h-8 w-8 object-cover rounded" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <span className="text-xs truncate flex-1">{getFileName(url)}</span>
                        <span className="text-[10px] text-muted-foreground">{idx + 1}번</span>
                        <button onClick={() => removeFinalOutput(idx)} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <Label>카테고리</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 노출 */}
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>사이트 노출</Label>
            </div>

            {/* 추가정보 */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.show_extra_info} onCheckedChange={(v) => setForm({ ...form, show_extra_info: !!v })} />
                <Label className="cursor-pointer">추가 정보 표시</Label>
              </div>
              {form.show_extra_info && (
                <div className="space-y-3 pl-6">
                  <div><Label>고객 (회사명)</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="예: ABC 주식회사" /></div>
                  <div><Label>제작기간</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="예: 2주" /></div>
                  <div><Label>제작비용</Label><Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="예: 500,000원" /></div>
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full gap-2" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" /> {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPortfolio;
