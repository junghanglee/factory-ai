import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, ExternalLink, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import PaddleWebhookEventsTab from "@/components/admin/PaddleWebhookEventsTab";
import AdminPaymentsTab from "@/components/admin/AdminPaymentsTab";

type Resource = "payments" | "transactions" | "customers" | "adjustments" | "notifications" | "events" | "products" | "prices" | "subscriptions" | "webhook_log";

interface PaddleResponse {
  ok: boolean;
  status: number;
  environment: "sandbox" | "live";
  data: {
    data?: any[] | any;
    meta?: { pagination?: { has_more?: boolean; next?: string; per_page?: number } };
    error?: { type?: string; code?: string; detail?: string };
  };
}

function fetchPaddle(resource: Resource, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ resource, ...params });
  return supabase.functions.invoke<PaddleResponse>(`paddle-admin?${qs.toString()}`, {
    method: "GET",
  });
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const map: Record<string, string> = {
    completed: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    paid: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    active: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    delivered: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    ready: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    draft: "bg-muted text-muted-foreground border-border",
    canceled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    past_due: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    failed: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={map[status] || ""}>
      {status}
    </Badge>
  );
}

function fmtMoney(amount?: string | number, currency = "USD") {
  if (amount === undefined || amount === null) return "-";
  // Paddle returns amounts as minor units string ("1500" = $15.00)
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "-";
  const major = n / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR");
}

function ResourceTable({ resource, columns }: { resource: Resource; columns: { key: string; label: string; render: (row: any) => React.ReactNode }[] }) {
  const [search, setSearch] = useState("");
  const [detailRow, setDetailRow] = useState<any | null>(null);

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ["paddle-admin", resource],
    queryFn: async () => {
      const { data, error } = await fetchPaddle(resource, { per_page: "50" });
      if (error) throw error;
      if (!data?.ok) {
        const detail = data?.data?.error?.detail || `HTTP ${data?.status}`;
        throw new Error(detail);
      }
      return data;
    },
  });

  const rows: any[] = Array.isArray(data?.data?.data) ? data!.data.data : [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(search.trim().toLowerCase())
      )
    : rows;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ID, 이메일, 금액 등으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {data && (
          <Badge variant="outline" className={data.environment === "live" ? "border-green-500 text-green-700" : "border-amber-500 text-amber-700"}>
            {data.environment.toUpperCase()}
          </Badge>
        )}
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          ❌ {(error as Error).message}
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Paddle에서 데이터 가져오는 중...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                  데이터가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, idx) => (
                <TableRow key={row.id || idx}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className="font-mono text-xs">
                      {c.render(row)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setDetailRow(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detailRow} onOpenChange={(o) => !o && setDetailRow(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{detailRow?.id}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(detailRow, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPaddle() {
  const [tab, setTab] = useState<Resource>("payments");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paddle 결제 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paddle 계정의 실제 거래·환불·고객·웹훅 이벤트를 직접 조회합니다.
            </p>
          </div>
          <a
            href="https://vendors.paddle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Paddle 공식 대시보드 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">데이터 조회</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Resource)}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-9 w-full">
                <TabsTrigger value="webhook_log">웹훅 로그</TabsTrigger>
                <TabsTrigger value="transactions">거래내역</TabsTrigger>
                <TabsTrigger value="adjustments">환불/조정</TabsTrigger>
                <TabsTrigger value="customers">고객</TabsTrigger>
                <TabsTrigger value="subscriptions">구독</TabsTrigger>
                <TabsTrigger value="products">상품</TabsTrigger>
                <TabsTrigger value="prices">가격</TabsTrigger>
                <TabsTrigger value="notifications">웹훅 알림</TabsTrigger>
                <TabsTrigger value="events">이벤트</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="webhook_log">
                  <PaddleWebhookEventsTab />
                </TabsContent>

                <TabsContent value="transactions">
                  <ResourceTable
                    resource="transactions"
                    columns={[
                      { key: "id", label: "Transaction ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "amount", label: "금액", render: (r) => fmtMoney(r.details?.totals?.total, r.currency_code) },
                      { key: "customer_id", label: "Customer", render: (r) => <span className="text-xs">{r.customer_id || "-"}</span> },
                      { key: "created_at", label: "생성일", render: (r) => fmtDate(r.created_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="adjustments">
                  <ResourceTable
                    resource="adjustments"
                    columns={[
                      { key: "id", label: "Adjustment ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "action", label: "유형", render: (r) => <Badge variant="outline">{r.action}</Badge> },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "amount", label: "금액", render: (r) => fmtMoney(r.totals?.total, r.currency_code) },
                      { key: "transaction_id", label: "Transaction", render: (r) => <span className="text-xs">{r.transaction_id}</span> },
                      { key: "created_at", label: "생성일", render: (r) => fmtDate(r.created_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="customers">
                  <ResourceTable
                    resource="customers"
                    columns={[
                      { key: "id", label: "Customer ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "email", label: "이메일", render: (r) => r.email },
                      { key: "name", label: "이름", render: (r) => r.name || "-" },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "created_at", label: "가입일", render: (r) => fmtDate(r.created_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="subscriptions">
                  <ResourceTable
                    resource="subscriptions"
                    columns={[
                      { key: "id", label: "Subscription ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "customer_id", label: "Customer", render: (r) => <span className="text-xs">{r.customer_id}</span> },
                      { key: "next_billed_at", label: "다음 청구", render: (r) => fmtDate(r.next_billed_at) },
                      { key: "created_at", label: "생성일", render: (r) => fmtDate(r.created_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="products">
                  <ResourceTable
                    resource="products"
                    columns={[
                      { key: "id", label: "Product ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "name", label: "상품명", render: (r) => r.name },
                      { key: "type", label: "유형", render: (r) => <Badge variant="outline">{r.type}</Badge> },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "created_at", label: "생성일", render: (r) => fmtDate(r.created_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="prices">
                  <ResourceTable
                    resource="prices"
                    columns={[
                      { key: "id", label: "Price ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "description", label: "설명", render: (r) => r.description || "-" },
                      { key: "amount", label: "금액", render: (r) => fmtMoney(r.unit_price?.amount, r.unit_price?.currency_code) },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "product_id", label: "Product", render: (r) => <span className="text-xs">{r.product_id}</span> },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="notifications">
                  <ResourceTable
                    resource="notifications"
                    columns={[
                      { key: "id", label: "Notification ID", render: (r) => <span className="text-xs">{r.id}</span> },
                      { key: "type", label: "이벤트", render: (r) => <Badge variant="outline">{r.type}</Badge> },
                      { key: "status", label: "상태", render: (r) => <StatusBadge status={r.status} /> },
                      { key: "occurred_at", label: "발생", render: (r) => fmtDate(r.occurred_at) },
                      { key: "delivered_at", label: "전송", render: (r) => fmtDate(r.delivered_at) },
                    ]}
                  />
                </TabsContent>

                <TabsContent value="events">
                  <ResourceTable
                    resource="events"
                    columns={[
                      { key: "event_id", label: "Event ID", render: (r) => <span className="text-xs">{r.event_id}</span> },
                      { key: "event_type", label: "타입", render: (r) => <Badge variant="outline">{r.event_type}</Badge> },
                      { key: "occurred_at", label: "발생일", render: (r) => fmtDate(r.occurred_at) },
                    ]}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">안내</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 데이터는 Paddle API에서 <strong>실시간으로</strong> 가져옵니다 (캐시 60초).</p>
            <p>• 환경(Sandbox/Live)은 등록된 <code className="px-1 bg-muted rounded">PADDLE_API_KEY</code> 에 따라 자동 결정됩니다.</p>
            <p>• 환불 처리·웹훅 재전송 같은 쓰기 작업은 보안상 Paddle 공식 대시보드에서 직접 진행해 주세요.</p>
            <p>• 행 우측 👁 아이콘을 클릭하면 전체 JSON 응답을 확인할 수 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
