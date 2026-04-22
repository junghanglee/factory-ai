import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEventLog, clearPaddleEventLog, type PaddleEventLogEntry } from "@/lib/paddle";
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, ExternalLink, Globe, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface DiagnosticsResult {
  environment: "sandbox" | "live";
  client_token_prefix: string | null;
  api_key_prefix: string;
  api_key_valid: boolean;
  api_key_error: any;
  approved_domains: {
    status: number;
    ok: boolean;
    data: any;
  };
}

const REQUIRED_DOMAINS = [
  "linktofactory.com",
  "factory-ai.lovable.app",
];

export default function AdminPaddleDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PaddleEventLogEntry[]>([]);
  const [currentOrigin, setCurrentOrigin] = useState("");

  const refreshEvents = () => setEvents(getPaddleEventLog());

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("paddle-diagnostics");
      if (error) throw error;
      setResult(data as DiagnosticsResult);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      toast.error("진단 호출 실패: " + (e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    refreshEvents();
    fetchDiagnostics();
  }, []);

  const approvedDomains: string[] = (() => {
    const list = result?.approved_domains?.data?.data;
    if (!Array.isArray(list)) return [];
    return list.map((d: any) => d?.domain ?? d?.url ?? "").filter(Boolean);
  })();

  const errorEvents = events.filter(
    (e) => e.name === "checkout.error" || e.name === "checkout.warning"
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Paddle 결제 진단</h1>
            <p className="text-sm text-muted-foreground mt-1">
              도메인 승인 상태와 최근 체크아웃 에러를 확인합니다.
            </p>
          </div>
          <Button onClick={fetchDiagnostics} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {/* 환경 / API 키 상태 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-4 w-4" />
            <h2 className="font-semibold">환경 & API 키</h2>
          </div>
          {error && (
            <div className="text-sm text-destructive flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {result ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Environment</p>
                <Badge variant={result.environment === "live" ? "default" : "secondary"}>
                  {result.environment.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">API Key 유효성</p>
                {result.api_key_valid ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> 유효함
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" /> 무효 / 권한 부족
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Client Token (prefix)</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {result.client_token_prefix ?? "(none)"}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">API Key (prefix)</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{result.api_key_prefix}</code>
              </div>
              {!result.api_key_valid && result.api_key_error && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">API 응답</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.api_key_error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          )}
        </Card>

        {/* 도메인 승인 상태 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4" />
            <h2 className="font-semibold">승인된 도메인</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            현재 페이지: <code className="bg-muted px-1.5 py-0.5 rounded">{currentOrigin}</code>
          </p>

          {result?.approved_domains?.ok === false && (
            <div className="text-sm text-destructive flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Paddle API 응답 오류 (status {result.approved_domains.status}). API 키 권한을 확인하세요.
              </span>
            </div>
          )}

          {/* 필수 도메인 체크 */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground">필수 도메인 확인</p>
            {[...REQUIRED_DOMAINS, currentOrigin.replace(/^https?:\/\//, "")].map((d) => {
              const approved = approvedDomains.some((ad) => ad.includes(d) || d.includes(ad));
              return (
                <div key={d} className="flex items-center justify-between border rounded px-3 py-2">
                  <code className="text-xs">{d}</code>
                  {approved ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> 승인됨
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" /> 미승인
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* 전체 승인 도메인 목록 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Paddle에 등록된 전체 승인 도메인 ({approvedDomains.length}개)
            </p>
            {approvedDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 도메인이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {approvedDomains.map((d) => (
                  <code key={d} className="block text-xs bg-muted px-2 py-1 rounded">
                    {d}
                  </code>
                ))}
              </div>
            )}
          </div>

          <a
            href={
              result?.environment === "sandbox"
                ? "https://sandbox-vendors.paddle.com/checkout-settings"
                : "https://vendors.paddle.com/checkout-settings"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-4"
          >
            Paddle 대시보드에서 도메인 추가 <ExternalLink className="h-3 w-3" />
          </a>
        </Card>

        {/* 최근 체크아웃 에러 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <h2 className="font-semibold">최근 체크아웃 이벤트</h2>
              <Badge variant="outline">{events.length}</Badge>
              {errorEvents.length > 0 && (
                <Badge variant="destructive">{errorEvents.length} 에러</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshEvents} variant="ghost" size="sm">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> 새로고침
              </Button>
              <Button
                onClick={() => {
                  clearPaddleEventLog();
                  setEvents([]);
                  toast.success("이벤트 로그를 비웠습니다.");
                }}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> 비우기
              </Button>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 기록된 이벤트가 없습니다. 결제 모듈을 한 번 열어보세요.
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {events.map((evt, idx) => {
                const isError = evt.name === "checkout.error" || evt.name === "checkout.warning";
                return (
                  <details
                    key={idx}
                    className={`border rounded p-3 ${
                      isError ? "border-destructive/50 bg-destructive/5" : ""
                    }`}
                  >
                    <summary className="cursor-pointer text-sm flex items-center gap-2">
                      {isError && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                      <span className="font-mono text-xs">{evt.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">
                        {new Date(evt.ts).toLocaleString()}
                      </span>
                    </summary>
                    <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-72">
                      {JSON.stringify(evt.data, null, 2)}
                    </pre>
                  </details>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
