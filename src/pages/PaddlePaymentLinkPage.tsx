import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPaddle, getPaddleEnvironment } from "@/lib/paddle";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { COMPANY } from "@/pages/legal/CompanyInfo";

const PaddlePaymentLinkPage = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "opened" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<"sandbox" | "production" | null>(null);
  const transactionId = params.get("_ptxn");

  const canLaunch = useMemo(() => Boolean(transactionId), [transactionId]);

  const openCheckout = async () => {
    if (!transactionId) return;
    try {
      setStatus("loading");
      setMessage(null);
      const [Paddle, env] = await Promise.all([loadPaddle(), getPaddleEnvironment()]);
      setEnvironment(env);
      Paddle.Checkout.open({
        transactionId,
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "ko",
        },
      });
      setStatus("opened");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "결제 창을 열지 못했습니다.");
    }
  };

  useEffect(() => {
    if (!transactionId) return;
    openCheckout();
  }, [transactionId]);

  return (
    <MainLayout>
      <section className="min-h-[calc(100vh-8rem)] bg-background">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-md border bg-accent/50 px-3 py-1 text-sm text-accent-foreground">
              <ShieldCheck className="h-4 w-4" />
              Paddle 기본 결제 링크 페이지
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">안전하게 결제를 진행하고 있습니다</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              이 페이지는 Paddle 라이브 도메인 승인과 기본 결제 링크 검증을 위해 사용됩니다. 거래 정보가 포함되어 있으면 결제창이 자동으로 열립니다.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="h-5 w-5 text-primary" />
                  결제 상태
                </CardTitle>
                <CardDescription>
                  Paddle이 이 페이지를 기본 결제 링크로 사용하면 URL의 거래 번호를 읽어 체크아웃을 엽니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4 text-sm text-foreground">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">거래 ID</p>
                      <p className="mt-1 break-all font-mono text-xs">{transactionId ?? "전달된 거래 ID가 없습니다."}</p>
                    </div>
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : status === "opened" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : status === "error" ? (
                      <TriangleAlert className="h-4 w-4 text-destructive" />
                    ) : null}
                  </div>
                </div>

                {status === "loading" && (
                  <p className="text-sm text-muted-foreground">결제창을 여는 중입니다. 잠시만 기다려 주세요.</p>
                )}
                {status === "opened" && (
                  <p className="text-sm text-muted-foreground">
                    결제창이 열리지 않았다면 팝업 차단을 해제한 뒤 아래 버튼으로 다시 시도해 주세요.
                  </p>
                )}
                {status === "error" && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
                    <p className="font-medium text-foreground">결제창을 열지 못했습니다</p>
                    <p className="mt-1 text-muted-foreground break-all">{message}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={openCheckout} disabled={!canLaunch || status === "loading"}>
                    {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    결제 다시 열기
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">홈으로 이동</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">검증 정보</CardTitle>
                <CardDescription>라이브 승인 과정에서 확인되는 기본 정보입니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="text-xs">현재 주소</p>
                  <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">{window.location.href}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs">결제 환경</p>
                  <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">{environment ?? "확인 전"}</p>
                </div>
                <div className="rounded-lg border bg-accent/30 p-4">
                  <p className="font-medium text-foreground">Paddle에 등록할 기본 결제 링크</p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">{window.location.origin}/pay</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-xs text-foreground">
                  <p className="font-medium">{COMPANY.legalName}</p>
                  <p className="text-muted-foreground">대표 {COMPANY.representative} · 사업자등록 {COMPANY.bizNumber}</p>
                  <p className="text-muted-foreground">{COMPANY.address}</p>
                  <p className="text-muted-foreground">
                    문의:{" "}
                    <a href={`mailto:${COMPANY.email}`} className="text-primary hover:underline">
                      {COMPANY.email}
                    </a>
                  </p>
                </div>
                <nav className="flex flex-wrap gap-x-3 gap-y-2 text-xs">
                  <Link to="/terms" className="text-primary hover:underline">이용약관</Link>
                  <Link to="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>
                  <Link to="/refund-policy" className="text-primary hover:underline">환불 정책</Link>
                  <Link to="/acceptable-use" className="text-primary hover:underline">이용 정책</Link>
                </nav>
                <a
                  href="https://vendors.paddle.com/checkout-settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Paddle 체크아웃 설정 열기 <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default PaddlePaymentLinkPage;
