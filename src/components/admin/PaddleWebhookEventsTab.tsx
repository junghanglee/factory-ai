import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Search, Eye, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface WebhookEventRow {
  id: string;
  event_id: string | null;
  event_type: string;
  paddle_transaction_id: string | null;
  paddle_adjustment_id: string | null;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  signature_valid: boolean;
  processing_status: string;
  processing_error: string | null;
  payload: unknown;
  received_at: string;
  processed_at: string | null;
}

const statusStyles: Record<string, string> = {
  processed: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  ignored: "bg-muted text-muted-foreground border-border",
  received: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  error: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  invalid_signature: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  invalid_json: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR");
}

export default function PaddleWebhookEventsTab() {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<WebhookEventRow | null>(null);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["paddle-webhook-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paddle_webhook_events")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as WebhookEventRow[];
    },
  });

  const rows = data ?? [];
  const filtered = search.trim()
    ? rows.filter((r) =>
        [r.event_id, r.event_type, r.paddle_transaction_id, r.paddle_adjustment_id, r.paddle_customer_id, r.processing_error]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search.trim().toLowerCase())),
      )
    : rows;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이벤트 타입, transaction id, customer id 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          최근 {rows.length}건
        </Badge>
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
              <TableHead className="w-10"></TableHead>
              <TableHead>수신 시각</TableHead>
              <TableHead>이벤트 타입</TableHead>
              <TableHead>처리 상태</TableHead>
              <TableHead>서명</TableHead>
              <TableHead>관련 ID</TableHead>
              <TableHead>오류</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  웹훅 이벤트 불러오는 중...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  수신된 웹훅 이벤트가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.processing_status === "processed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : row.processing_status === "ignored" ? (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{fmtDate(row.received_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.event_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[row.processing_status] || ""}>
                      {row.processing_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.signature_valid ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                        valid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30">
                        invalid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] max-w-[220px] truncate" title={row.paddle_transaction_id || row.paddle_adjustment_id || ""}>
                    {row.paddle_transaction_id || row.paddle_adjustment_id || row.paddle_customer_id || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[220px] truncate" title={row.processing_error || ""}>
                    {row.processing_error || "-"}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => setDetail(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {detail?.event_type} · {detail?.event_id ?? detail?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">수신</div>
                <div className="font-mono">{fmtDate(detail?.received_at)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">처리</div>
                <div className="font-mono">{fmtDate(detail?.processed_at)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">서명</div>
                <div>{detail?.signature_valid ? "valid" : "invalid"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">처리 상태</div>
                <div>{detail?.processing_status}</div>
              </div>
            </div>
            {detail?.processing_error && (
              <div className="text-xs bg-destructive/10 text-destructive border border-destructive/30 rounded-md p-2">
                {detail.processing_error}
              </div>
            )}
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto whitespace-pre-wrap break-all">
              {JSON.stringify(detail?.payload, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
