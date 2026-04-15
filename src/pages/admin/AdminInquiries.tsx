import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Trash2, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const statusColors: Record<string, string> = {
  "신규": "bg-blue-100 text-blue-700",
  "확인": "bg-yellow-100 text-yellow-700",
  "완료": "bg-green-100 text-green-700",
};

const AdminInquiries = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<any>(null);
  const [memo, setMemo] = useState("");
  const [reply, setReply] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["contact_inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openDetail = (item: any) => {
    setSelected(item);
    setMemo(item.admin_memo || "");
    setReply(item.admin_reply || "");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_inquiries").update({ status }).eq("id", id);
    if (error) { toast.error(t("admin.statusChangeFailed")); return; }
    toast.success(t("admin.statusChanged"));
    queryClient.invalidateQueries({ queryKey: ["contact_inquiries"] });
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveMemo = async () => {
    if (!selected) return;
    const { error } = await supabase.from("contact_inquiries").update({ admin_memo: memo }).eq("id", selected.id);
    if (error) { toast.error(t("admin.memoSaveFailed")); return; }
    toast.success(t("admin.memoSaved"));
    queryClient.invalidateQueries({ queryKey: ["contact_inquiries"] });
  };

  const saveReply = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("contact_inquiries")
      .update({
        admin_reply: reply,
        replied_at: reply.trim() ? new Date().toISOString() : null,
        status: reply.trim() ? "완료" : selected.status,
      } as any)
      .eq("id", selected.id);
    if (error) { toast.error(t("admin.replySaveFailed")); return; }
    toast.success(t("admin.replySaved"));
    queryClient.invalidateQueries({ queryKey: ["contact_inquiries"] });
    setSelected({ ...selected, admin_reply: reply, status: reply.trim() ? "완료" : selected.status });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.deleteConfirm"))) return;
    const { error } = await supabase.from("contact_inquiries").delete().eq("id", id);
    if (error) { toast.error(t("common.deleteFailed")); return; }
    toast.success(t("common.deleted"));
    queryClient.invalidateQueries({ queryKey: ["contact_inquiries"] });
    if (selected?.id === id) setSelected(null);
  };

  const newCount = inquiries.filter((i: any) => i.status === "신규").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("admin.inquiryManage")}</h1>
          {newCount > 0 && (
            <Badge className="bg-red-500 text-white">{t("admin.newInquiryCount", { count: newCount })}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.status")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("common.name")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("common.email")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.inquiryType")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.receivedDate")}</th>
                <th className="text-left p-4 font-medium text-muted-foreground">{t("admin.manage")}</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item: any) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="p-4">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[item.status] || "bg-gray-100 text-gray-700"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-muted-foreground">{item.email}</td>
                  <td className="p-4 text-muted-foreground">{item.inquiry_type}</td>
                  <td className="p-4 text-muted-foreground">{format(new Date(item.created_at), "yyyy.MM.dd HH:mm")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("admin.noInquiries")}</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.inquiryDetail")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="신규">{t("admin.statusNew")}</SelectItem>
                    <SelectItem value="확인">{t("admin.statusConfirmed")}</SelectItem>
                    <SelectItem value="완료">{t("admin.statusCompleted")}</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">{selected.inquiry_type}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(selected.created_at), "yyyy.MM.dd HH:mm")}
                </span>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{selected.name}</span>
                  {selected.company && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="h-3 w-3" />{selected.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-1 hover:text-foreground">
                    <Mail className="h-3 w-3" />{selected.email}
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="flex items-center gap-1 hover:text-foreground">
                      <Phone className="h-3 w-3" />{selected.phone}
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{t("admin.inquiryContent")}</label>
                <div className="bg-background border rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{t("admin.writeReply")}</label>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder={t("admin.replyPlaceholder")} />
                <Button size="sm" className="mt-2" onClick={saveReply}>{t("admin.saveReply")}</Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{t("admin.internalMemo")}</label>
                <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder={t("admin.memoPlaceholder")} />
                <Button size="sm" variant="outline" className="mt-2" onClick={saveMemo}>{t("admin.saveMemo")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInquiries;
