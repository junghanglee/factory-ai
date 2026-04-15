import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CheckCircle, XCircle, DollarSign, Wallet, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const formatPrice = (n: number) => n.toLocaleString("ko-KR");

const AdminSettlements = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*, seller_profiles(business_name), projects(order_number, service_title, customer, price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: unsettledProjects = [] } = useQuery({
    queryKey: ["unsettled-projects"],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*, seller_profiles:seller_id(id, business_name, commission_rate)")
        .not("seller_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: existingSettlements } = await supabase
        .from("settlements")
        .select("project_id");
      const settledIds = new Set((existingSettlements || []).map((s: any) => s.project_id));
      return (projects || []).filter((p: any) => !settledIds.has(p.id));
    },
  });

  const handleCreateSettlement = async (project: any) => {
    const sellerProfile = project.seller_profiles;
    if (!sellerProfile) { toast.error(t("admin.sellerNoInfo")); return; }

    const commissionRate = sellerProfile.commission_rate || 10;
    const orderAmount = project.price;
    const commissionAmount = Math.round(orderAmount * commissionRate / 100);
    const sellerAmount = orderAmount - commissionAmount;

    try {
      const { error } = await supabase.from("settlements").insert({
        seller_id: sellerProfile.id,
        project_id: project.id,
        order_amount: orderAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        seller_amount: sellerAmount,
        status: "대기",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-settlements"] });
      queryClient.invalidateQueries({ queryKey: ["unsettled-projects"] });
      toast.success(t("admin.settlementCreated"));
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(t("admin.settlementCreateFailed") + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const settlement = settlements.find((s: any) => s.id === id);
      const updateData: any = { status: newStatus };
      if (newStatus === "완료") updateData.settled_at = new Date().toISOString();
      const { error } = await supabase.from("settlements").update(updateData).eq("id", id);
      if (error) throw error;

      if (newStatus === "완료" && settlement) {
        await supabase.from("seller_notifications").insert({
          seller_id: settlement.seller_id,
          type: "settlement_complete",
          title: t("admin.completedSettlement"),
          message: `${t("admin.settlementAmount")}: ${settlement.seller_amount.toLocaleString("ko-KR")}원\n${t("admin.orderLabel")}: ${settlement.projects?.service_title || ""}`,
          metadata: { settlement_id: id },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-settlements"] });
      toast.success(t("admin.settlementStatusChanged", { status: newStatus }));
    } catch (err: any) {
      toast.error(t("admin.statusUpdateFailed") + err.message);
    }
  };

  const filtered = statusFilter === "all" ? settlements : settlements.filter((s: any) => s.status === statusFilter);
  const totalAll = settlements.reduce((s: number, r: any) => s + r.seller_amount, 0);
  const totalPending = settlements.filter((r: any) => r.status === "대기").reduce((s: number, r: any) => s + r.seller_amount, 0);
  const totalCompleted = settlements.filter((r: any) => r.status === "완료").reduce((s: number, r: any) => s + r.seller_amount, 0);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("admin.settlementTitle")}</h1>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t("admin.createSettlement")}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.totalSettlement")}</p>
                <p className="text-xl font-bold">{formatPrice(totalAll)}{t("common.won")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.pendingSettlement")}</p>
                <p className="text-xl font-bold">{formatPrice(totalPending)}{t("common.won")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.completedSettlement")}</p>
                <p className="text-xl font-bold">{formatPrice(totalCompleted)}{t("common.won")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          {[{ label: t("admin.all"), value: "all" }, { label: t("common.pending"), value: "대기" }, { label: t("common.completed"), value: "완료" }, { label: t("admin.cancelled"), value: "취소" }].map(s => (
            <Button key={s.value} variant={statusFilter === s.value ? "default" : "outline"} size="sm"
              onClick={() => setStatusFilter(s.value)}>
              {s.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">{t("admin.noSettlements")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.sellerLabel")}</TableHead>
                    <TableHead>{t("admin.orderNumber")}</TableHead>
                    <TableHead>{t("admin.service")}</TableHead>
                    <TableHead className="text-right">{t("admin.orderAmount")}</TableHead>
                    <TableHead className="text-right">{t("admin.commission")}({"%"})</TableHead>
                    <TableHead className="text-right">{t("admin.settlementAmount")}</TableHead>
                    <TableHead>{t("admin.status")}</TableHead>
                    <TableHead>{t("admin.settlementDate")}</TableHead>
                    <TableHead>{t("admin.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.seller_profiles?.business_name || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.projects?.order_number || "-"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{s.projects?.service_title || "-"}</TableCell>
                      <TableCell className="text-right">{formatPrice(s.order_amount)}{t("common.won")}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.commission_rate}% ({formatPrice(s.commission_amount)}{t("common.won")})</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(s.seller_amount)}{t("common.won")}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "완료" ? "default" : s.status === "취소" ? "destructive" : "secondary"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.settled_at ? new Date(s.settled_at).toLocaleDateString("ko-KR") : "-"}</TableCell>
                      <TableCell>
                        {s.status === "대기" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-emerald-600" onClick={() => handleUpdateStatus(s.id, "완료")}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleUpdateStatus(s.id, "취소")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.selectUnsettledOrder")}</DialogTitle>
          </DialogHeader>
          {unsettledProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("admin.noUnsettledOrders")}</div>
          ) : (
            <div className="space-y-2">
              {unsettledProjects.map((p: any) => {
                const sp = p.seller_profiles;
                const rate = sp?.commission_rate || 10;
                const commission = Math.round(p.price * rate / 100);
                const sellerAmt = p.price - commission;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/30">
                    <div>
                      <p className="font-medium">{p.service_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.order_number} · {p.customer} · {t("admin.sellerLabel")}: {sp?.business_name || "-"}
                      </p>
                      <p className="text-sm">
                        {t("admin.orderLabel")} {formatPrice(p.price)}{t("common.won")} → {t("admin.commission")} {rate}% ({formatPrice(commission)}{t("common.won")}) → {t("admin.settlementAmount")} {formatPrice(sellerAmt)}{t("common.won")}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleCreateSettlement(p)}>{t("admin.createBtn")}</Button>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSettlements;
