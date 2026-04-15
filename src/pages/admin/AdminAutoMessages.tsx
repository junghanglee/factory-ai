import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AutoMessage {
  id: string;
  trigger_type: string;
  message: string;
  active: boolean;
  sort_order: number;
}

const AdminAutoMessages = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<AutoMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const TRIGGER_LABELS: Record<string, string> = {
    new_room: t("autoMessages.triggers.new_room"),
    order_received: t("autoMessages.triggers.order_received"),
    project_started: t("autoMessages.triggers.project_started"),
  };

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
    if (error) { toast.error(t("autoMessages.saveFailed")); return; }
    toast.success(t("autoMessages.saved"));
  };

  const handleAdd = async () => {
    const { error } = await supabase.from("auto_messages").insert({
      trigger_type: "new_room",
      message: "",
      sort_order: messages.length,
    });
    if (error) { toast.error(t("autoMessages.addFailed")); return; }
    await fetchMessages();
    toast.success(t("autoMessages.added"));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("auto_messages").delete().eq("id", id);
    if (error) { toast.error(t("autoMessages.deleteFailed")); return; }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success(t("autoMessages.deleted"));
  };

  const updateLocal = (id: string, field: keyof AutoMessage, value: any) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("autoMessages.title")}</h1>
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> {t("autoMessages.add")}</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
      ) : messages.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("autoMessages.noMessages")}</p>
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
                    <span className="text-xs text-muted-foreground">{msg.active ? t("common.active") : t("common.inactive")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdate(msg)}>
                    <Save className="h-3.5 w-3.5 mr-1" /> {t("autoMessages.save")}
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
                placeholder={t("autoMessages.placeholder")}
              />
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAutoMessages;
