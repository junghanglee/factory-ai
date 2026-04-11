import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Star, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import ImageUploader from "@/components/admin/ImageUploader";

interface ReviewRow {
  id?: string;
  rating: number;
  review_text: string;
  nickname: string;
  image_url: string;
  is_admin_entry: boolean;
  isNew?: boolean;
}

interface ReviewManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceTitle: string;
}

export default function ReviewManager({ open, onOpenChange, serviceId, serviceTitle }: ReviewManagerProps) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open || !serviceId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });
      if (data) {
        setRows(data.map((d: any) => ({
          id: d.id,
          rating: d.rating,
          review_text: d.review_text || "",
          nickname: d.nickname,
          image_url: d.image_url || "",
          is_admin_entry: d.is_admin_entry,
        })));
      }
      setLoading(false);
    })();
  }, [open, serviceId]);

  const addRows = (count: number) => {
    const newRows: ReviewRow[] = Array.from({ length: count }, () => ({
      rating: 5,
      review_text: "",
      nickname: "",
      image_url: "",
      is_admin_entry: true,
      isNew: true,
    }));
    setRows(prev => [...newRows, ...prev]);
  };

  const updateRow = (idx: number, field: keyof ReviewRow, value: any) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing reviews for this service
      await supabase.from("service_reviews").delete().eq("service_id", serviceId);

      // Insert all rows
      const validRows = rows.filter(r => r.nickname.trim());
      if (validRows.length > 0) {
        const inserts = validRows.map(r => ({
          service_id: serviceId,
          rating: r.rating,
          review_text: r.review_text || null,
          nickname: r.nickname,
          image_url: r.image_url || null,
          is_admin_entry: r.is_admin_entry,
        }));
        const { error } = await supabase.from("service_reviews").insert(inserts);
        if (error) throw error;
      }

      // Update service rating/review_count
      const avgRating = validRows.length > 0
        ? Math.round((validRows.reduce((sum, r) => sum + r.rating, 0) / validRows.length) * 10) / 10
        : 5.0;
      await supabase.from("services").update({
        rating: avgRating,
        review_count: validRows.length,
      }).eq("id", serviceId);

      queryClient.invalidateQueries({ queryKey: ["service_reviews"] });
      queryClient.invalidateQueries({ queryKey: ["recent_reviews"] });
      queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`${validRows.length}개 리뷰가 저장되었습니다.`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>평점/리뷰 관리 - {serviceTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => addRows(1)}>
            <Plus className="h-4 w-4 mr-1" /> 1건 추가
          </Button>
          <Button variant="outline" size="sm" onClick={() => addRows(5)}>
            <Plus className="h-4 w-4 mr-1" /> 5건 추가
          </Button>
          <Button variant="outline" size="sm" onClick={() => addRows(10)}>
            <Plus className="h-4 w-4 mr-1" /> 10건 추가
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">총 {rows.length}건</span>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">로딩중...</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground w-10">구분</th>
                  <th className="text-left p-2 font-medium text-muted-foreground w-20">평점</th>
                  <th className="text-left p-2 font-medium text-muted-foreground w-24">닉네임</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">한줄평</th>
                  <th className="text-left p-2 font-medium text-muted-foreground w-24">이미지</th>
                  <th className="w-10 p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="p-2">
                      <span title={row.is_admin_entry ? "관리자 입력" : "실사용자"}>
                        {row.is_admin_entry ? (
                          <Shield className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-emerald-600" />
                        )}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        className="w-16 h-8 border rounded px-1 text-xs bg-background"
                        value={row.rating}
                        onChange={(e) => updateRow(idx, "rating", Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map(v => (
                          <option key={v} value={v}>★ {v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.nickname}
                        onChange={(e) => updateRow(idx, "nickname", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="닉네임"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.review_text}
                        onChange={(e) => updateRow(idx, "review_text", e.target.value)}
                        className="h-8 text-xs"
                        placeholder="리뷰 내용"
                      />
                    </td>
                    <td className="p-2">
                      {row.image_url ? (
                        <div className="flex items-center gap-1">
                          <img src={row.image_url} className="h-8 w-8 rounded object-cover" />
                          <button
                            className="text-xs text-destructive"
                            onClick={() => updateRow(idx, "image_url", "")}
                          >×</button>
                        </div>
                      ) : (
                        <ImageUploader
                          value=""
                          onChange={(url) => updateRow(idx, "image_url", url)}
                          folder="reviews"
                          sizePreset="thumbnail"
                        />
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => removeRow(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full mt-4 gap-2">
          <Save className="h-4 w-4" /> {saving ? "저장 중..." : "전체 저장"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
