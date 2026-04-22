import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Eye, Undo2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentRow {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  environment: string;
  paddle_transaction_id: string | null;
  paddle_customer_id: string | null;
  refunded_amount: number;
  refund_status: string | null;
  created_at: string | null;
  // joined
  projects?: {
    order_number: string;
    service_title: string;
    customer: string;
    payment_status: string;
  } | null;
}

function fmtAmount(amount: number, currency = "USD") {
  // payments.amount is stored as minor units (cents)
  const major = (Number(amount) || 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR");
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const map: Record<string, string> = {
    completed: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    paid: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    refunded: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    partially_refunded: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  };
  return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
}

export default function AdminPaymentsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<PaymentRow | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentRow | null>(null);

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, projects:project_id(order_number, service_title, customer, payment_status)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as PaymentRow[];
    },
  });

  const rows = data || [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.trim().toLowerCase())
      )
    : rows;

  const totalPaid = rows
    .filter((r) => r.status === "completed" || r.status === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalRefunded = rows.reduce((sum, r) => sum + (Number(r.refunded_amount) || 0) * 100, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border p-3 bg-card">
          <div className="text-xs text-muted-foreground">총 결제 건</div>
          <div className="text-xl font-bold mt-1">{rows.length} 건</div>
        </div>
        <div className="rounded-md border p-3 bg-card">
          <div className="text-xs text-muted-foreground">완료된 결제 합계 (USD)</div>
          <div className="text-xl font-bold text-green-600 mt-1">{fmtAmount(totalPaid)}</div>
        </div>
        <div className="rounded-md border p-3 bg-card">
          <div className="text-xs text-muted-foreground">환불 누적 (USD)</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{fmtAmount(totalRefunded)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="주문번호, 고객명, Paddle ID 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {(error as Error).message}
        </div>
      )}

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>결제일</TableHead>
              <TableHead>주문번호</TableHead>
              <TableHead>고객</TableHead>
              <TableHead>서비스</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>환불</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> 불러오는 중...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  결제 내역이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const canRefund =
                  (r.status === "completed" || r.status === "paid") &&
                  !!r.paddle_transaction_id &&
                  r.refund_status !== "refunded";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.created_at)}</TableCell>
                    <TableCell className="text-xs font-mono">{r.projects?.order_number || "-"}</TableCell>
                    <TableCell className="text-xs">{r.projects?.customer || "-"}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{r.projects?.service_title || "-"}</TableCell>
                    <TableCell className="text-xs font-medium">{fmtAmount(r.amount, r.currency)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs">
                      {r.refund_status ? (
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={r.refund_status} />
                          {r.refunded_amount > 0 && (
                            <span className="text-muted-foreground text-[10px]">
                              -{r.refunded_amount.toFixed(2)} {r.currency.toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDetail(r)} title="상세보기">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={!canRefund}
                          onClick={() => setRefundTarget(r)}
                          title={canRefund ? "환불 처리" : "환불할 수 없는 결제"}
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" /> 환불
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{detail?.id}</DialogTitle>
            <DialogDescription>결제 상세 정보 (Paddle 연동)</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <Row label="주문번호" value={detail.projects?.order_number} />
              <Row label="서비스" value={detail.projects?.service_title} />
              <Row label="고객" value={detail.projects?.customer} />
              <Row label="금액" value={fmtAmount(detail.amount, detail.currency)} />
              <Row label="상태" value={detail.status} />
              <Row label="환경" value={detail.environment} />
              <Row label="결제수단" value={detail.provider} />
              <Row label="Paddle 거래 ID" value={detail.paddle_transaction_id} mono />
              <Row label="Paddle 고객 ID" value={detail.paddle_customer_id} mono />
              <Row label="결제일시" value={fmtDate(detail.created_at)} />
              <Row label="환불 상태" value={detail.refund_status} />
              <Row label="환불 금액" value={detail.refunded_amount > 0 ? `${detail.refunded_amount} ${detail.currency.toUpperCase()}` : "-"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <RefundDialog
        target={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => {
          setRefundTarget(null);
          qc.invalidateQueries({ queryKey: ["admin-payments"] });
          qc.invalidateQueries({ queryKey: ["paddle-admin"] });
        }}
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: any; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xs text-right ${mono ? "font-mono" : ""}`}>{value || "-"}</span>
    </div>
  );
}

function RefundDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: PaymentRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRefundType("full");
    setAmount("");
    setReason("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!target) return;
    if (!reason.trim()) {
      toast.error("환불 사유를 입력해주세요.");
      return;
    }
    if (refundType === "partial") {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) {
        toast.error("부분 환불 금액을 정확히 입력해주세요.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("paddle-create-refund", {
        body: {
          payment_id: target.id,
          reason: reason.trim(),
          action: "refund",
          refund_type: refundType,
          ...(refundType === "partial" ? { amount: parseFloat(amount) } : {}),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Paddle 환불 요청이 접수되었습니다.");
      reset();
      onSuccess();
    } catch (err: any) {
      console.error("Refund failed:", err);
      toast.error("환불 요청 실패: " + (err?.message ?? "알 수 없는 오류"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-destructive" /> 결제 환불 요청
          </DialogTitle>
          <DialogDescription>
            Paddle API를 통해 즉시 환불 요청이 전송되며, 결과는 웹훅으로 자동 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4 py-2">
            <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문</span>
                <span className="font-mono text-xs">{target.projects?.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">서비스</span>
                <span>{target.projects?.service_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제금액</span>
                <span className="font-bold">{fmtAmount(target.amount, target.currency)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">환불 유형</label>
              <Select value={refundType} onValueChange={(v) => setRefundType(v as "full" | "partial")}>
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
                <label className="text-sm font-medium mb-1.5 block">
                  환불 금액 ({target.currency.toUpperCase()})
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">환불 사유 *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="고객에게 안내할 환불 사유를 입력해주세요"
                rows={3}
              />
            </div>

            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2">
              ⚠️ 한번 처리된 환불은 되돌릴 수 없습니다. 신중히 진행해주세요.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> 처리중...</>
            ) : (
              <>환불 요청</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
