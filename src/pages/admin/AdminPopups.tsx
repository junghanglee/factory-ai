import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Image as ImageIcon, Paperclip, Megaphone, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleRichEditor from "@/components/admin/SimpleRichEditor";

interface Popup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  position: string;
  width: number;
  height: number | null;
  offset_x: number;
  offset_y: number;
  show_pages: string[];
  start_at: string | null;
  end_at: string | null;
  show_today_close: boolean;
  show_close_button: boolean;
  active: boolean;
  sort_order: number;
}

const POSITIONS = [
  { value: "center", label: "중앙" },
  { value: "top-left", label: "좌상단" },
  { value: "top-right", label: "우상단" },
  { value: "bottom-left", label: "좌하단" },
  { value: "bottom-right", label: "우하단" },
];

const PAGE_OPTIONS = [
  { value: "/", label: "메인" },
  { value: "/about", label: "회사소개" },
  { value: "/category", label: "카테고리" },
  { value: "/service", label: "서비스 상세" },
  { value: "*", label: "전체 페이지" },
];

const emptyForm: Omit<Popup, "id"> = {
  title: "",
  content: "",
  image_url: null,
  link_url: null,
  attachment_url: null,
  attachment_name: null,
  position: "center",
  width: 480,
  height: null,
  offset_x: 0,
  offset_y: 0,
  show_pages: ["/"],
  start_at: null,
  end_at: null,
  show_today_close: true,
  show_close_button: true,
  active: true,
  sort_order: 0,
};

const AdminPopups = () => {
  const [items, setItems] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState<Omit<Popup, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("popups").select("*").order("sort_order").order("created_at", { ascending: false });
    if (data) setItems(data as Popup[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Popup) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm({
      ...rest,
      start_at: rest.start_at ? rest.start_at.slice(0, 16) : null,
      end_at: rest.end_at ? rest.end_at.slice(0, 16) : null,
    });
    setOpen(true);
  };

  const uploadFile = async (file: File, kind: "image" | "attachment") => {
    const ext = file.name.split(".").pop();
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("popup-files").upload(path, file);
    if (error) {
      toast.error("업로드 실패: " + error.message);
      return;
    }
    const { data } = supabase.storage.from("popup-files").getPublicUrl(path);
    if (kind === "image") {
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } else {
      setForm((f) => ({ ...f, attachment_url: data.publicUrl, attachment_name: file.name }));
    }
    toast.success("업로드 완료");
  };

  const togglePage = (page: string) => {
    setForm((f) => {
      const has = f.show_pages.includes(page);
      const pages = has ? f.show_pages.filter((p) => p !== page) : [...f.show_pages, page];
      return { ...f, show_pages: pages.length ? pages : ["/"] };
    });
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("popups").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("popups").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "수정되었습니다." : "생성되었습니다.");
    setOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("이 팝업을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("삭제되었습니다.");
    fetchData();
  };

  const toggleActive = async (p: Popup) => {
    const { error } = await supabase.from("popups").update({ active: !p.active }).eq("id", p.id);
    if (!error) {
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> 팝업 관리
          </h1>
          <Button onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> 새 팝업</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 w-12">순서</th>
                  <th className="text-left p-3">제목</th>
                  <th className="text-left p-3">위치</th>
                  <th className="text-left p-3">노출 페이지</th>
                  <th className="text-left p-3">기간</th>
                  <th className="text-center p-3">활성</th>
                  <th className="text-center p-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">불러오는 중...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">등록된 팝업이 없습니다.</td></tr>
                ) : items.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-3">{p.sort_order}</td>
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        {p.image_url && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
                        {p.attachment_url && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        {p.title}
                      </div>
                    </td>
                    <td className="p-3 text-xs">{POSITIONS.find((x) => x.value === p.position)?.label}</td>
                    <td className="p-3 text-xs text-muted-foreground">{p.show_pages.join(", ")}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {p.start_at ? new Date(p.start_at).toLocaleDateString() : "-"} ~ {p.end_at ? new Date(p.end_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 text-center"><Switch checked={p.active} onCheckedChange={() => toggleActive(p)} /></td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "팝업 수정" : "새 팝업 생성"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>제목 *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div>
                <Label>본문 (리치 텍스트 - 폰트/색상/크기 조정 가능)</Label>
                <SimpleRichEditor value={form.content || ""} onChange={(v) => setForm({ ...form, content: v })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>이미지</Label>
                  <div className="flex gap-2">
                    <Input value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value || null })} placeholder="URL 또는 업로드" />
                    <Button type="button" variant="outline" size="icon" onClick={() => imgInput.current?.click()}><Upload className="h-4 w-4" /></Button>
                    <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "image")} />
                  </div>
                  {form.image_url && <img src={form.image_url} alt="" className="mt-2 max-h-24 rounded border" />}
                </div>
                <div>
                  <Label>첨부파일</Label>
                  <div className="flex gap-2">
                    <Input value={form.attachment_name || ""} onChange={(e) => setForm({ ...form, attachment_name: e.target.value || null })} placeholder="파일명" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" /></Button>
                    <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "attachment")} />
                  </div>
                  {form.attachment_url && <p className="text-xs text-muted-foreground mt-1 truncate">📎 {form.attachment_name}</p>}
                </div>
              </div>

              <div>
                <Label>링크 URL (이미지/팝업 클릭 시 이동)</Label>
                <Input value={form.link_url || ""} onChange={(e) => setForm({ ...form, link_url: e.target.value || null })} placeholder="https://... 또는 /path" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>위치</Label>
                  <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>너비 (px)</Label>
                  <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>오프셋 X (px)</Label>
                  <Input type="number" value={form.offset_x} onChange={(e) => setForm({ ...form, offset_x: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>오프셋 Y (px)</Label>
                  <Input type="number" value={form.offset_y} onChange={(e) => setForm({ ...form, offset_y: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label>노출 페이지 (복수 선택, * = 전체)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PAGE_OPTIONS.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      size="sm"
                      variant={form.show_pages.includes(p.value) ? "default" : "outline"}
                      onClick={() => togglePage(p.value)}
                    >{p.label}</Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>노출 시작</Label>
                  <Input type="datetime-local" value={form.start_at || ""} onChange={(e) => setForm({ ...form, start_at: e.target.value || null })} />
                </div>
                <div>
                  <Label>노출 종료</Label>
                  <Input type="datetime-local" value={form.end_at || ""} onChange={(e) => setForm({ ...form, end_at: e.target.value || null })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <Label>활성</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.show_today_close} onCheckedChange={(v) => setForm({ ...form, show_today_close: v })} />
                  <Label>오늘 그만보기</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.show_close_button} onCheckedChange={(v) => setForm({ ...form, show_close_button: v })} />
                  <Label>닫기 버튼</Label>
                </div>
              </div>

              <div>
                <Label>정렬 순서</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
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

export default AdminPopups;
