import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, CheckCircle, XCircle, DollarSign, Wallet, BarChart3 } from "lucide-react";

const formatPrice = (n: number) => n.toLocaleString("ko-KR");

const AdminSettlements = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all settlements
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

  // Fetch projects with seller_id that don't have settlements yet
  const { data: unsettledProjects = [] } = useQuery({
    queryKey: ["unsettled-projects"],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*, seller_profiles:seller_id(id, business_name, commission_rate)")
        .not("seller_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Filter out projects that already have settlements
      const { data: existingSettlements } = await supabase
        .from("settlements")
        .select("project_id");
      const settledIds = new Set((existingSettlements || []).map((s: any) => s.project_id));
      return (projects || []).filter((p: any) => !settledIds.has(p.id));
    },
  });

  const handleCreateSettlement = async (project: any) => {
    const sellerProfile = project.seller_profiles;
    if (!sellerProfile) { toast.error("판매자 정보가 없습니다."); return; }

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
      toast.success("정산이 생성되었습니다.");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error("정산 생성 실패: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const settlement = settlements.find((s: any) => s.id === id);
      const updateData: any = { status: newStatus };
      if (newStatus === "완료") updateData.settled_at = new Date().toISOString();
      const { error } = await supabase.from("settlements").update(updateData).eq("id", id);
      if (error) throw error;

      // Send notification to seller on completion
      if (newStatus === "완료" && settlement) {
        await supabase.from("seller_notifications").insert({
          seller_id: settlement.seller_id,
          type: "settlement_complete",
          title: "정산이 완료되었습니다",
          message: `정산금액: ${settlement.seller_amount.toLocaleString("ko-KR")}원\n주문: ${settlement.projects?.service_title || ""}`,
          metadata: { settlement_id: id },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-settlements"] });
      toast.success(`정산 상태가 '${newStatus}'(으)로 변경되었습니다.`);
    } catch (err: any) {
      toast.error("상태 변경 실패: " + err.message);
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
          <h1 className="text-2xl font-bold">정산 관리</h1>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> 정산 생성
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">전체 정산액</p>
                <p className="text-xl font-bold">{formatPrice(totalAll)}원</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">대기 중</p>
                <p className="text-xl font-bold">{formatPrice(totalPending)}원</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">정산 완료</p>
                <p className="text-xl font-bold">{formatPrice(totalCompleted)}원</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {["all", "대기", "완료", "취소"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
              onClick={() => setStatusFilter(s)}>
              {s === "all" ? "전체" : s}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">정산 내역이 없습니다</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>판매자</TableHead>
                    <TableHead>주문번호</TableHead>
                    <TableHead>서비스</TableHead>
                    <TableHead className="text-right">주문금액</TableHead>
                    <TableHead className="text-right">수수료({"%"})</TableHead>
                    <TableHead className="text-right">정산금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>정산일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.seller_profiles?.business_name || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.projects?.order_number || "-"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{s.projects?.service_title || "-"}</TableCell>
                      <TableCell className="text-right">{formatPrice(s.order_amount)}원</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.commission_rate}% ({formatPrice(s.commission_amount)}원)</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(s.seller_amount)}원</TableCell>
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

      {/* Create Settlement Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>정산 생성 - 미정산 주문 선택</DialogTitle>
          </DialogHeader>
          {unsettledProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">미정산 주문이 없습니다</div>
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
                        {p.order_number} · {p.customer} · 판매자: {sp?.business_name || "-"}
                      </p>
                      <p className="text-sm">
                        주문 {formatPrice(p.price)}원 → 수수료 {rate}% ({formatPrice(commission)}원) → 정산 {formatPrice(sellerAmt)}원
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleCreateSettlement(p)}>정산 생성</Button>
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
