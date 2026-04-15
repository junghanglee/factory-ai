import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, XCircle, FileText, ExternalLink, Store } from "lucide-react";
import { useTranslation } from "react-i18next";

const statusColors: Record<string, string> = {
  "신청": "bg-yellow-100 text-yellow-800",
  "승인": "bg-green-100 text-green-800",
  "반려": "bg-red-100 text-red-800",
  "정지": "bg-gray-100 text-gray-800",
};

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const AdminSellers = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editCommission, setEditCommission] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seller_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests").select("*, seller_profiles(business_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("seller_profiles").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "승인" && selectedSeller) {
        const { error: roleError } = await supabase.from("user_roles").upsert({ user_id: selectedSeller.user_id, role: "seller" as any }, { onConflict: "user_id,role" });
        if (roleError) console.error("Role assignment error:", roleError);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-sellers"] }); toast.success(t("admin.statusChanged")); setSelectedSeller(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCommission = async (id: string) => {
    const rate = Number(editCommission);
    if (isNaN(rate) || rate < 0 || rate > 100) { toast.error(t("admin.validCommission")); return; }
    const { error } = await supabase.from("seller_profiles").update({ commission_rate: rate }).eq("id", id);
    if (error) { toast.error(t("admin.changeFailed")); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
    toast.success(t("admin.commissionChanged"));
    if (selectedSeller?.id === id) setSelectedSeller({ ...selectedSeller, commission_rate: rate });
  };

  const processWithdrawal = async (id: string, status: string, memo?: string) => {
    const updateData: any = { status, processed_at: new Date().toISOString() };
    if (memo) updateData.admin_memo = memo;
    const { error } = await supabase.from("withdrawal_requests").update(updateData).eq("id", id);
    if (error) { toast.error(t("admin.processFailed")); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    toast.success(status === "완료" ? t("admin.withdrawalApproved") : t("admin.withdrawalRejected"));
  };

  const filtered = sellers.filter((s: any) => {
    const matchSearch = !search || s.business_name?.includes(search) || s.phone?.includes(search);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDocuments = (seller: any): string[] => {
    try { const info = JSON.parse(seller.bank_info || "{}"); return info.documents || []; } catch { return []; }
  };

  const stats = {
    total: sellers.length,
    pending: sellers.filter((s: any) => s.status === "신청").length,
    approved: sellers.filter((s: any) => s.status === "승인").length,
    rejected: sellers.filter((s: any) => s.status === "반려").length,
  };

  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "신청");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              {t("admin.sellerManageTitle")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("admin.sellerManageDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: t("admin.all"), value: stats.total, color: "text-foreground" },
            { label: t("admin.pendingApply"), value: stats.pending, color: "text-yellow-600" },
            { label: t("admin.approved"), value: stats.approved, color: "text-green-600" },
            { label: t("admin.rejectedLabel"), value: stats.rejected, color: "text-red-600" },
            { label: t("admin.withdrawalPending"), value: pendingWithdrawals.length, color: "text-orange-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("admin.searchSellerPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                {[{ label: t("admin.all"), value: "all" }, { label: "신청", value: "신청" }, { label: "승인", value: "승인" }, { label: "반려", value: "반려" }, { label: "정지", value: "정지" }].map(s => (
                  <Button key={s.value} size="sm" variant={statusFilter === s.value ? "default" : "outline"} onClick={() => setStatusFilter(s.value)}>
                    {s.value === "all" ? s.label : s.value}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.businessName")}</TableHead>
                  <TableHead>{t("admin.businessType")}</TableHead>
                  <TableHead>{t("admin.contact")}</TableHead>
                  <TableHead>{t("admin.commissionRate")}</TableHead>
                  <TableHead>{t("admin.salesSettlement")}</TableHead>
                  <TableHead>{t("admin.bankInfo")}</TableHead>
                  <TableHead>{t("admin.applicationDate")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead className="text-right">{t("admin.manage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("admin.noSellers")}</TableCell></TableRow>
                ) : (
                  filtered.map((seller: any) => (
                    <TableRow key={seller.id}>
                      <TableCell className="font-medium">{seller.business_name}</TableCell>
                      <TableCell className="text-sm">{seller.business_type || t("admin.individual")}</TableCell>
                      <TableCell className="text-sm">{seller.phone || "-"}</TableCell>
                      <TableCell className="text-sm font-medium">{seller.commission_rate}%</TableCell>
                      <TableCell className="text-xs">
                        <div>{t("admin.revenue")}: {formatPrice(seller.total_revenue || 0)}{t("common.won")}</div>
                        <div className="text-muted-foreground">{t("admin.salesCount")}: {seller.total_sales || 0}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {seller.bank_name ? `${seller.bank_name} ${seller.bank_account || ""}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(seller.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[seller.status] || ""}>{seller.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedSeller(seller); setEditCommission(String(seller.commission_rate)); }}>
                          <Eye className="h-4 w-4 mr-1" /> {t("admin.detail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {pendingWithdrawals.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3">{t("admin.withdrawalRequests")} ({t("admin.withdrawalCount", { count: pendingWithdrawals.length })})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.sellerLabel")}</TableHead>
                    <TableHead>{t("admin.amount")}</TableHead>
                    <TableHead>{t("admin.account")}</TableHead>
                    <TableHead>{t("admin.applicationDate")}</TableHead>
                    <TableHead className="text-right">{t("admin.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingWithdrawals.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{(w as any).seller_profiles?.business_name || "-"}</TableCell>
                      <TableCell className="font-medium">{formatPrice(w.amount)}{t("common.won")}</TableCell>
                      <TableCell className="text-sm">{w.bank_name} {w.bank_account} ({w.bank_holder})</TableCell>
                      <TableCell className="text-sm">{new Date(w.created_at).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-right flex gap-1 justify-end">
                        <Button size="sm" onClick={() => processWithdrawal(w.id, "완료")}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {t("admin.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => processWithdrawal(w.id, "반려", "관리자 반려")}>
                          <XCircle className="h-3 w-3 mr-1" /> {t("admin.reject")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.sellerDetail")}</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground text-xs">{t("admin.businessName")}</Label><p className="font-medium">{selectedSeller.business_name}</p></div>
                <div><Label className="text-muted-foreground text-xs">{t("admin.contact")}</Label><p className="font-medium">{selectedSeller.phone || "-"}</p></div>
                <div><Label className="text-muted-foreground text-xs">{t("admin.businessType")}</Label><p>{selectedSeller.business_type || t("admin.individual")}</p></div>
                <div><Label className="text-muted-foreground text-xs">{t("admin.businessNumber")}</Label><p>{selectedSeller.business_number || "-"}</p></div>
                <div><Label className="text-muted-foreground text-xs">{t("admin.representative")}</Label><p>{selectedSeller.business_owner || "-"}</p></div>
                <div><Label className="text-muted-foreground text-xs">{t("admin.status")}</Label><Badge className={statusColors[selectedSeller.status] || ""}>{selectedSeller.status}</Badge></div>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">{t("admin.bankInfoTitle")}</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">{t("admin.bank")}:</span> {selectedSeller.bank_name || "-"}</div>
                  <div><span className="text-muted-foreground">{t("admin.account")}:</span> {selectedSeller.bank_account || "-"}</div>
                  <div><span className="text-muted-foreground">{t("admin.accountHolder")}:</span> {selectedSeller.bank_holder || "-"}</div>
                </div>
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">{t("admin.revenueCommission")}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">{t("admin.totalRevenue")}:</span> {formatPrice(selectedSeller.total_revenue || 0)}{t("common.won")}</div>
                  <div><span className="text-muted-foreground">{t("admin.totalSales")}:</span> {selectedSeller.total_sales || 0}</div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Label className="text-xs whitespace-nowrap">{t("admin.commissionRateLabel")}</Label>
                  <Input type="number" className="h-8 w-24 text-sm" value={editCommission} onChange={e => setEditCommission(e.target.value)} />
                  <Button size="sm" className="h-8" onClick={() => updateCommission(selectedSeller.id)}>{t("admin.apply")}</Button>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t("admin.introExpertise")}</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">{selectedSeller.bio || t("admin.noContent")}</p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t("admin.attachedDocs")}</Label>
                <div className="mt-2 space-y-2">
                  {getDocuments(selectedSeller).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("admin.noAttachments")}</p>
                  ) : (
                    getDocuments(selectedSeller).map((url: string, idx: number) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          {isImage ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`${t("admin.docLabel")} ${idx + 1}`} className="w-full max-h-60 object-contain bg-secondary/30" />
                            </a>
                          ) : (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors">
                              <FileText className="h-5 w-5 text-orange-500" />
                              <span className="text-sm flex-1 truncate">{t("admin.docLabel")} {idx + 1}</span>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedSeller.status === "신청" && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "승인" })} disabled={updateStatus.isPending}>
                      <CheckCircle className="h-4 w-4 mr-2" /> {t("admin.approve")}
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => {
                      if (!rejectReason.trim()) { toast.error(t("admin.enterRejectReason")); return; }
                      updateStatus.mutate({ id: selectedSeller.id, status: "반려" });
                    }} disabled={updateStatus.isPending}>
                      <XCircle className="h-4 w-4 mr-2" /> {t("admin.reject")}
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">{t("admin.rejectReasonLabel")}</Label>
                    <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t("admin.rejectReasonPlaceholder")} rows={2} />
                  </div>
                </div>
              )}

              {selectedSeller.status === "승인" && (
                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "정지" })} disabled={updateStatus.isPending}>
                    {t("admin.suspendSeller")}
                  </Button>
                </div>
              )}

              {selectedSeller.status === "정지" && (
                <div className="pt-4 border-t">
                  <Button onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "승인" })} disabled={updateStatus.isPending}>
                    {t("admin.unsuspendSeller")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellers;
