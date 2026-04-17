import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ToggleDef {
  key: string;
  title: string;
  description: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: "certified_sellers_enabled",
    title: "인증 판매자 기능",
    description:
      "사용자 화면에서 '인증 판매자' 배지, 판매자 가입 페이지(/seller/apply), 카테고리/상세 페이지의 판매자 표시를 노출합니다. (관리자 페이지의 판매자/정산 메뉴는 항상 표시됩니다)",
  },
];

const AdminFeatureSettings = () => {
  const { settings, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const next: Record<string, boolean> = {};
      TOGGLES.forEach((t) => {
        next[t.key] = Boolean(settings[t.key]);
      });
      setLocal(next);
    }
  }, [isLoading, settings]);

  const handleToggle = async (key: string, next: boolean) => {
    setSaving(key);
    setLocal((prev) => ({ ...prev, [key]: next }));
    const { error } = await supabase
      .from("site_settings" as any)
      .upsert({ key, value: next as any }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("설정 저장 실패: " + error.message);
      setLocal((prev) => ({ ...prev, [key]: !next }));
      return;
    }
    toast.success("설정이 저장되었습니다");
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">기능 설정</h1>
          <p className="text-sm text-muted-foreground mt-1">
            사이트 전반의 기능을 켜고 끌 수 있습니다.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 로딩 중...
          </div>
        ) : (
          <div className="space-y-4">
            {TOGGLES.map((t) => (
              <Card key={t.key}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">{t.title}</CardTitle>
                      <CardDescription className="mt-1">{t.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {saving === t.key && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      <Switch
                        checked={Boolean(local[t.key])}
                        disabled={saving === t.key}
                        onCheckedChange={(v) => handleToggle(t.key, v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Label className="text-xs text-muted-foreground">
                    상태:{" "}
                    <span className={local[t.key] ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                      {local[t.key] ? "활성화됨" : "비활성화됨"}
                    </span>
                  </Label>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeatureSettings;
