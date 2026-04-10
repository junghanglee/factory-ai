import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutoMessage {
  id: string;
  trigger_type: string;
  message: string;
  active: boolean;
  sort_order: number;
}

const TRIGGER_LABELS: Record<string, string> = {
  new_room: "신규 문의 입장",
  order_received: "주문 접수",
  project_started: "프로젝트 시작",
};

const AdminAutoMessages = () => {
  const [messages, setMessages] = useState<AutoMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase.from("auto_messages").select("*").order("sort_order");
    if (data) setMessages(data as AutoMessage[]);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleUpdate = async (msg: AutoMessage) => {
    const { error } = await supabase.from("auto_messages").update({
      message: msg.message,
      active: msg.active,
      trigger_type: msg.trigger_type,
    }).eq("id", msg.id);
    if (error) { toast.error("저장 실패"); return; }
    toast.success("저장되었습니다");
  };

  const handleAdd = async () => {
    const { error } = await supabase.from("auto_messages").insert({
      trigger_type: "new_room",
      message: "새 자동 메시지를 입력하세요.",
      sort_order: messages.length,
    });
    if (error) { toast.error("추가 실패"); return; }
    await fetchMessages();
    toast.success("추가되었습니다");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("auto_messages").delete().eq("id", id);
    if (error) { toast.error("삭제 실패"); return; }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("삭제되었습니다");
  };

  const updateLocal = (id: string, field: keyof AutoMessage, value: any) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">자동 메시지 설정</h1>
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> 추가</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">로딩 중...</p>
      ) : messages.length === 0 ? (
        <p className="text-muted-foreground text-sm">등록된 자동 메시지가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="border rounded-xl p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={msg.trigger_type}
                    onChange={(e) => updateLocal(msg.id, "trigger_type", e.target.value)}
                    className="text-sm border rounded-lg px-3 py-1.5 bg-background"
                  >
                    {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Switch checked={msg.active} onCheckedChange={(v) => updateLocal(msg.id, "active", v)} />
                    <span className="text-xs text-muted-foreground">{msg.active ? "활성" : "비활성"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdate(msg)}>
                    <Save className="h-3.5 w-3.5 mr-1" /> 저장
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(msg.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={msg.message}
                onChange={(e) => updateLocal(msg.id, "message", e.target.value)}
                rows={3}
                className="text-sm"
                placeholder="자동 전송될 메시지를 입력하세요..."
              />
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAutoMessages;
