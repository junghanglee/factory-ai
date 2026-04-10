import { useState, useEffect } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackField {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: "select" | "textarea" | "text";
  field_options: string[];
  sort_order: number;
}

interface FeedbackFieldsEditorProps {
  serviceId?: string | null;
  categoryId?: string | null;
  /** If true, show "카테고리 기본값" badge */
  isCategoryLevel?: boolean;
}

export default function FeedbackFieldsEditor({ serviceId, categoryId, isCategoryLevel }: FeedbackFieldsEditorProps) {
  const [fields, setFields] = useState<FeedbackField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ownerId = serviceId || categoryId;
  const ownerColumn = serviceId ? "service_id" : "category_id";

  useEffect(() => {
    if (!ownerId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("feedback_fields")
        .select("*")
        .eq(ownerColumn, ownerId)
        .order("sort_order");
      if (data) setFields(data.map((d: any) => ({
        id: d.id,
        field_key: d.field_key,
        field_label: d.field_label,
        field_type: d.field_type,
        field_options: d.field_options || [],
        sort_order: d.sort_order,
      })));
      setLoading(false);
    })();
  }, [ownerId]);

  const addField = () => {
    setFields(prev => [...prev, {
      field_key: `field_${Date.now()}`,
      field_label: "",
      field_type: "select",
      field_options: ["만족", "수정필요", "전면수정"],
      sort_order: prev.length + 1,
    }]);
  };

  const removeField = (idx: number) => {
    setFields(prev => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, sort_order: i + 1 })));
  };

  const updateField = (idx: number, patch: Partial<FeedbackField>) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  const handleSave = async () => {
    if (!ownerId) return;
    setSaving(true);
    try {
      // Delete existing
      await supabase.from("feedback_fields").delete().eq(ownerColumn, ownerId);

      if (fields.length > 0) {
        const inserts = fields.map((f, i) => ({
          [ownerColumn]: ownerId,
          field_key: f.field_key || f.field_label.replace(/\s/g, "_").toLowerCase(),
          field_label: f.field_label,
          field_type: f.field_type,
          field_options: f.field_type === "select" ? f.field_options.filter(Boolean) : [],
          sort_order: i + 1,
        }));
        const { error } = await supabase.from("feedback_fields").insert(inserts);
        if (error) throw error;
      }
      toast.success("피드백 항목이 저장되었습니다.");
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">로딩중...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            피드백 항목 설정
            {isCategoryLevel && <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded">카테고리 기본값</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {serviceId 
              ? "서비스별 피드백 항목을 설정합니다. 미설정 시 카테고리 기본값이 사용됩니다."
              : "이 카테고리에 속한 서비스의 기본 피드백 항목입니다."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="h-4 w-4 mr-1" /> 항목 추가
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
          설정된 피드백 항목이 없습니다. {serviceId ? "카테고리 기본값이 사용됩니다." : "항목을 추가해주세요."}
        </p>
      )}

      {fields.map((field, idx) => (
        <Card key={idx}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">항목 {idx + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeField(idx)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">항목명</Label>
                <Input
                  value={field.field_label}
                  onChange={(e) => updateField(idx, { field_label: e.target.value })}
                  placeholder="예: 구도/레이아웃"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">키</Label>
                <Input
                  value={field.field_key}
                  onChange={(e) => updateField(idx, { field_key: e.target.value })}
                  placeholder="예: composition"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">입력 형식</Label>
                <Select value={field.field_type} onValueChange={(v) => updateField(idx, { field_type: v as any })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">선택형 (드롭다운)</SelectItem>
                    <SelectItem value="textarea">장문 (텍스트영역)</SelectItem>
                    <SelectItem value="text">단문 (텍스트)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {field.field_type === "select" && (
              <div>
                <Label className="text-xs">선택 옵션 (쉼표 구분)</Label>
                <Input
                  value={field.field_options.join(", ")}
                  onChange={(e) => updateField(idx, { field_options: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="만족, 수정필요, 전면수정"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
        {saving ? "저장 중..." : "피드백 항목 저장"}
      </Button>
    </div>
  );
}
