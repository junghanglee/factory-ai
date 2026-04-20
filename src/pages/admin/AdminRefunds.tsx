import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, RotateCcw, Search, ExternalLink } from "lucide-react";

interface PaymentRow {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  refund_status: string | null;
  refunded_amount: number;
  paddle_transaction_id: string | null;
  created_at: string;
  projects?: { order_number: string; service_title: string; customer: string } | null;
}

interface RefundRow {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  reason: string | null;
  refund_type: string;
  status: string;
  paddle_status: string | null;
  paddle_adjustment_id: string | null;
  paddle_transaction_id: string | null;
  created_at: string;
  processed_at: string | null;
  admin_memo: string | null;
}

const statusBadge = (s: string) => {
  const map: Record<string, { variant: any; label: string }> = {
    pending: { variant: "secondary", label: "대기" },
    completed: { variant: "default", label: "완료" },
    failed: { variant: "destructive", label: "실패" },
    rejected: { variant: "destructive", label: "거부됨" },
  };
  const v = map[s] || { variant: "outline", label: s };
  return <Badge variant={v.variant}>{v.label}</Badge>;
};

export default function AdminRefunds() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 환불 다이얼로그
  const [refundOpen, setRefundOpen] = useState(false);
  const [target, setTarget] = useState<PaymentRow | null>(null);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [{ data: payData }, { data: refData }] = await Promise.all([
      supabase
        .from("payments")
        .select("id, project_id, user_id, amount, currency, status, refund_status, refunded_amount, paddle_transaction_id, created_at, projects:project_id(order_number, service_title, customer)")
        .eq("provider", "paddle")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setPayments((payData as any) || []);
    setRefunds((refData as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const ch = supabase
      .channel("admin-refunds")
      .on("postgres_changes", { event: "*", schema: "public", table: "refunds" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const openRefundDialog = (p: PaymentRow) => {
    setTarget(p);
    setRefundType("full");
    setRefundAmount(((p.amount - (p.refunded_amount || 0)) / 100).toFixed(2));
    setRefundReason("");
    setRefundOpen(true);
  };

  const handleSubmitRefund = async () => {
    if (!target) return;
    if (!refundReason.trim()) {
      toast.error("환불 사유를 입력해주세요.");
      return;
    }
    if (refundType === "partial") {
      const amt = parseFloat(refundAmount);
      if (!amt || amt <= 0) {
        toast.error("부분 환불 금액을 올바르게 입력해주세요.");
        return;
      }
      const remaining = (target.amount - (target.refunded_amount || 0)) / 100;
      if (amt > remaining) {
        toast.error(`환불 가능 금액(${remaining.toFixed(2)})을 초과했습니다.`);
        return;
      }
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("paddle-create-refund", {
      body: {
        payment_id: target.id,
        reason: refundReason.trim(),
        refund_type: refundType,
        amount: refundType === "partial" ? parseFloat(refundAmount) : undefined,
        action: "refund",
      },
    });
    setSubmitting(false);

    if (error || (data as any)?.error) {
      toast.error("환불 요청 실패: " + ((data as any)?.error || error?.message || ""));
      return;
    }
    toast.success("환불 요청이 Paddle에 전송되었습니다.");
    setRefundOpen(false);
    loadData();
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.projects?.order_number?.toLowerCase().includes(s) ||
      p.projects?.service_title?.toLowerCase().includes(s) ||
      p.projects?.customer?.toLowerCase().includes(s) ||
      p.paddle_transaction_id?.toLowerCase().includes(s)
    );
  });

  const filteredRefunds = refunds.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.paddle_adjustment_id?.toLowerCase().includes(s) ||
      r.paddle_transaction_id?.toLowerCase().includes(s) ||
      r.reason?.toLowerCase().includes(s)
    );
  });

  const fmt = (minor: number, currency: string) =>
    `${currency.toUpperCase()} ${(minor / 100).toFixed(2)}`;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">환불 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paddle 결제에 대한 환불 요청 및 처리 내역을 관리합니다.
            </p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="주문번호, 고객, 트랜잭션 ID 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">결제 내역 ({filteredPayments.length})</TabsTrigger>
            <TabsTrigger value="refunds">환불 내역 ({filteredRefunds.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>고객 / 서비스</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>환불액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>Paddle TX</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => {
                    const remaining = p.amount - (p.refunded_amount || 0);
                    const canRefund =
                      !!p.paddle_transaction_id && p.status !== "refunded" && remaining > 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">
                          {p.projects?.order_number || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{p.projects?.customer || "-"}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {p.projects?.service_title || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{fmt(p.amount, p.currency)}</TableCell>
                        <TableCell className="text-destructive">
                          {p.refunded_amount > 0 ? fmt(p.refunded_amount, p.currency) : "-"}
                        </TableCell>
                        <TableCell>
                          {p.refund_status === "refunded" ? (
                            <Badge variant="destructive">전액 환불</Badge>
                          ) : p.refund_status === "partially_refunded" ? (
                            <Badge variant="secondary">부분 환불</Badge>
                          ) : (
                            <Badge variant="outline">{p.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.paddle_transaction_id?.slice(0, 18) || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canRefund}
                            onClick={() => openRefundDialog(p)}
                          >
                            환불
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredPayments.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        결제 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="refunds" className="mt-4">
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>요청일</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>Paddle Status</TableHead>
                    <TableHead>Adjustment ID</TableHead>
                    <TableHead>처리일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {new Date(r.created_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="font-medium">{fmt(r.amount, r.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {r.refund_type === "full" ? "전액" : "부분"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {r.reason || "-"}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.paddle_status || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.paddle_adjustment_id?.slice(0, 18) || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.processed_at
                          ? new Date(r.processed_at).toLocaleString("ko-KR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredRefunds.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                        환불 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>환불 처리</DialogTitle>
            <DialogDescription>
              {target?.projects?.service_title} ({target ? fmt(target.amount, target.currency) : ""})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>환불 유형</Label>
              <Select value={refundType} onValueChange={(v: any) => setRefundType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">전액 환불</SelectItem>
                  <SelectItem value="partial">부분 환불</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {refundType === "partial" && (
              <div>
                <Label>환불 금액 ({target?.currency.toUpperCase()})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  환불 가능: {target ? ((target.amount - (target.refunded_amount || 0)) / 100).toFixed(2) : "0"}
                </p>
              </div>
            )}

            <div>
              <Label>환불 사유 *</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="고객 요청, 서비스 불만족 등"
                rows={3}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              ⚠️ Paddle에 즉시 환불 요청이 전송됩니다. Paddle의 검토 결과는 웹훅으로 자동 동기화됩니다.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmitRefund} disabled={submitting} variant="destructive">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              환불 요청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
