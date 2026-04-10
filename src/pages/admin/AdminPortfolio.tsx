import { useState, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Save, GripVertical, Upload, X, ChevronDown, ChevronUp, FileText, Film, ImageIcon } from "lucide-react";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCategories } from "@/hooks/useSupabaseData";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  active: boolean;
  sort_order: number;
  files: string[];
  client_name: string | null;
  duration: string | null;
  cost: string | null;
  show_extra_info: boolean;
}

interface FormState {
  title: string;
  description: string;
  image_url: string;
  category: string;
  active: boolean;
  files: string[];
  client_name: string;
  duration: string;
  cost: string;
  show_extra_info: boolean;
}

const emptyForm: FormState = {
  title: "", description: "", image_url: "", category: "",
  active: true, files: [], client_name: "", duration: "", cost: "", show_extra_info: false,
};

function SortableCard({ item, onEdit, onDelete, onToggle }: {
  item: PortfolioItem; onEdit: () => void; onDelete: () => void; onToggle: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const thumbnail = item.image_url || item.files?.[0] || "";
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || url.includes("unsplash");
  const isVideo = (url: string) => /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);

  return (
    <Card ref={setNodeRef} style={style} className={`overflow-hidden ${!item.active ? "opacity-50" : ""}`}>
      <div className="relative">
        {thumbnail && isImage(thumbnail) ? (
          <img src={thumbnail} alt={item.title} className="w-full h-40 object-cover" />
        ) : thumbnail && isVideo(thumbnail) ? (
          <div className="w-full h-40 bg-secondary flex items-center justify-center">
            <Film className="h-10 w-10 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-40 bg-secondary flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <button
          {...attributes} {...listeners}
          className="absolute top-2 left-2 bg-background/80 rounded p-1 cursor-grab active:cursor-grabbing"
        >
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
        {item.show_extra_info && (item.client_name || item.duration || item.cost) && (
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {item.client_name && <p>고객: {item.client_name}</p>}
            {item.duration && <p>기간: {item.duration}</p>}
            {item.cost && <p>비용: {item.cost}</p>}
          </div>
        )}
        {item.files && item.files.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">📎 파일 {item.files.length}개</p>
        )}
        <div className="flex gap-1 mt-3">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
            <Edit className="h-3 w-3" /> 수정
          </Button>
          <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> 삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const AdminPortfolio = () => {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useCategories();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["portfolio_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PortfolioItem[];
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
      title: item.title, description: item.description || "", image_url: item.image_url || "",
      category: item.category || "", active: item.active, files: item.files || [],
      client_name: item.client_name || "", duration: item.duration || "", cost: item.cost || "",
      show_extra_info: item.show_extra_info,
    });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요"); return; }
    const payload: Partial<PortfolioItem> = {
      title: form.title, description: form.description || null, image_url: form.image_url || null,
      category: form.category || null, active: form.active, files: form.files,
      client_name: form.client_name || null, duration: form.duration || null, cost: form.cost || null,
      show_extra_info: form.show_extra_info,
    };
    if (!editId) payload.sort_order = items.length;
    saveMutation.mutate({ id: editId ?? undefined, data: payload }, { onSuccess: () => setEditOpen(false) });
  };

  const handleDelete = (id: string) => { if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate(id); };

  const handleToggle = (id: string, active: boolean) => {
    saveMutation.mutate({ id, data: { active } });
  };

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("portfolio-files").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("portfolio-files").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setForm((prev) => ({ ...prev, files: [...prev.files, ...urls] }));
      toast.success(`${urls.length}개 파일 업로드 완료`);
    } catch (e: any) {
      toast.error("업로드 실패: " + e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const removeFile = (idx: number) => {
    setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
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
                <SortableCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                  onToggle={(v) => handleToggle(item.id, v)}
                />
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
            <div>
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="포트폴리오 제목" />
            </div>
            <div>
              <Label>설명 (50자 이내)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => { if (e.target.value.length <= 50) setForm({ ...form, description: e.target.value }); }}
                rows={2} placeholder="간단한 설명"
              />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length}/50</p>
            </div>
            <div>
              <Label>이미지 URL (직접 입력)</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>파일 업로드 (이미지, 동영상, 문서 등)</Label>
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploading ? "업로드 중..." : "클릭 또는 드래그하여 파일 추가"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">이미지, 동영상, 문서 등 다수 파일 가능</p>
              </div>
              <input
                ref={fileInputRef} type="file" multiple className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }}
              />
              {form.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.files.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary rounded px-2 py-1">
                      {isImageFile(url) ? (
                        <img src={url} alt="" className="h-8 w-8 object-cover rounded" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs truncate flex-1">{getFileName(url)}</span>
                      <button onClick={() => removeFile(idx)} className="text-destructive hover:text-destructive/80">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>카테고리</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>사이트 노출</Label>
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.show_extra_info}
                  onCheckedChange={(v) => setForm({ ...form, show_extra_info: !!v })}
                />
                <Label className="cursor-pointer">추가 정보 표시</Label>
              </div>
              {form.show_extra_info && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label>고객 (회사명)</Label>
                    <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="예: ABC 주식회사" />
                  </div>
                  <div>
                    <Label>제작기간</Label>
                    <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="예: 2주" />
                  </div>
                  <div>
                    <Label>제작비용</Label>
                    <Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="예: 500,000원" />
                  </div>
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
