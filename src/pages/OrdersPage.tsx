import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Receipt,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Package,
  AlertTriangle,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface PaymentRow {
  id: string;
  project_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  environment: string;
  created_at: string | null;
  refunded_amount: number;
  refund_status: string | null;
  paddle_transaction_id: string | null;
}

interface ProjectRow {
  id: string;
  order_number: string;
  service_title: string;
  package_name: string | null;
  status: string;
  confirm_status: string;
  payment_status: string;
  price: number;
  order_date: string;
  due_date: string;
  completed_date: string | null;
  quote_details: any;
}

interface PackageRow {
  id: string;
  service_id: string;
  name: string;
  delivery_days: number;
  revisions: number;
  features: string[] | null;
  price: number;
}

interface OrderItem {
  payment: PaymentRow | null;
  project: ProjectRow;
  pkg?: PackageRow | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const STAGES = ["대기", "작업중", "검수중", "완료"];

const PROJECT_STATUS_META: Record<string, { label: string; cls: string }> = {
  "대기": { label: "대기", cls: "bg-muted text-muted-foreground" },
  "작업중": { label: "작업중", cls: "bg-blue-100 text-blue-700" },
  "검수중": { label: "검수중", cls: "bg-amber-100 text-amber-700" },
  "수정중": { label: "수정중", cls: "bg-orange-100 text-orange-700" },
  "완료": { label: "완료", cls: "bg-green-100 text-green-700" },
};

function paymentBadge(status: string, refundStatus: string | null) {
  if (refundStatus === "refunded" || status === "refunded") {
    return { label: "환불완료", cls: "bg-rose-100 text-rose-700", Icon: RotateCcw };
  }
  if (refundStatus === "partial") {
    return { label: "부분환불", cls: "bg-rose-50 text-rose-600", Icon: RotateCcw };
  }
  switch (status) {
    case "completed":
    case "paid":
    case "succeeded":
      return { label: "결제완료", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 };
    case "pending":
      return { label: "결제대기", cls: "bg-amber-100 text-amber-700", Icon: Clock };
    case "failed":
    case "canceled":
    case "cancelled":
      return { label: "결제실패", cls: "bg-rose-100 text-rose-700", Icon: XCircle };
    default:
      return { label: status || "상태불명", cls: "bg-muted text-muted-foreground", Icon: AlertTriangle };
  }
}

function formatMoney(amount: number, currency = "USD") {
  if (currency.toUpperCase() === "KRW") {
    return `${Math.round(amount).toLocaleString()}원`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase() || "USD",
    minimumFractionDigits: 2,
  }).format(Number(amount) / 100);
}

function formatDate(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
type FilterKey = "all" | "completed" | "pending" | "failed" | "refunded";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingData(true);

      // 1) User's projects (covers cases where payment hasn't been recorded yet)
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      // 2) Payments for the user
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const projectList = (projects ?? []) as ProjectRow[];
      const paymentList = (payments ?? []) as PaymentRow[];

      // 3) Resolve service packages by name+title (no FK on projects→packages)
      const titles = Array.from(new Set(projectList.map((p) => p.service_title)));
      let packagesByKey = new Map<string, PackageRow>();
      if (titles.length > 0) {
        const { data: services } = await supabase
          .from("services")
          .select("id,title")
          .in("title", titles);
        const serviceIds = (services ?? []).map((s) => s.id);
        if (serviceIds.length > 0) {
          const { data: pkgs } = await supabase
            .from("service_packages")
            .select("*")
            .in("service_id", serviceIds);
          const titleById = new Map((services ?? []).map((s) => [s.id, s.title]));
          (pkgs ?? []).forEach((p: any) => {
            const title = titleById.get(p.service_id);
            if (!title) return;
            const key = `${title}::${p.name}`;
            packagesByKey.set(key, p as PackageRow);
          });
        }
      }

      // 4) Build order items: prefer most recent payment per project, else show project alone
      const paymentByProject = new Map<string, PaymentRow>();
      paymentList.forEach((pay) => {
        if (!paymentByProject.has(pay.project_id)) paymentByProject.set(pay.project_id, pay);
      });

      const merged: OrderItem[] = projectList.map((project) => {
        const payment = paymentByProject.get(project.id) ?? null;
        const key = `${project.service_title}::${project.package_name ?? ""}`;
        const pkg = packagesByKey.get(key) ?? null;
        return { project, payment, pkg };
      });

      // Include orphan payments (project deleted or different) at the bottom
      const projectIdsSet = new Set(projectList.map((p) => p.id));
      paymentList
        .filter((pay) => !projectIdsSet.has(pay.project_id))
        .forEach((pay) => {
          merged.push({
            payment: pay,
            project: {
              id: pay.project_id,
              order_number: pay.paddle_transaction_id || pay.id.slice(0, 8),
              service_title: "(연결된 주문 없음)",
              package_name: null,
              status: "대기",
              confirm_status: "-",
              payment_status: pay.status,
              price: 0,
              order_date: pay.created_at ?? new Date().toISOString(),
              due_date: pay.created_at ?? new Date().toISOString(),
              completed_date: null,
              quote_details: null,
            },
            pkg: null,
          });
        });

      setItems(merged);
      setLoadingData(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(({ payment }) => {
      if (!payment) return filter === "pending";
      if (filter === "refunded") {
        return payment.refund_status === "refunded" || payment.refund_status === "partial" || payment.status === "refunded";
      }
      if (filter === "completed") return ["completed", "paid", "succeeded"].includes(payment.status);
      if (filter === "pending") return payment.status === "pending";
      if (filter === "failed") return ["failed", "canceled", "cancelled"].includes(payment.status);
      return true;
    });
  }, [items, filter]);

  const totals = useMemo(() => {
    const completed = items.filter(
      (i) => i.payment && ["completed", "paid", "succeeded"].includes(i.payment.status),
    );
    const totalUsd = completed
      .filter((i) => (i.payment!.currency || "").toUpperCase() === "USD")
      .reduce((sum, i) => sum + Number(i.payment!.amount) / 100, 0);
    return { count: completed.length, totalUsd };
  }, [items]);

  const goToChat = async (projectId: string) => {
    if (!user) return;
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);
    if (rooms && rooms.length > 0) {
      navigate("/chat", { state: { openRoomId: rooms[0].id } });
    } else {
      navigate("/chat");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">로그인이 필요합니다</h1>
          <p className="text-sm text-muted-foreground mb-6">결제·주문 내역을 보려면 먼저 로그인해 주세요.</p>
          <Link to="/login">
            <Button>로그인 하러 가기</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" /> 주문·결제 내역
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              최근 결제와 각 주문의 패키지·견적·진행 상태를 한눈에 확인하세요.
            </p>
          </div>
          <Card className="px-4 py-3 flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">결제 완료 건수</p>
              <p className="text-lg font-bold">{totals.count}건</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">총 결제액 (USD)</p>
              <p className="text-lg font-bold text-primary">
                {totals.totalUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </p>
            </div>
          </Card>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="completed">결제완료</TabsTrigger>
            <TabsTrigger value="pending">대기</TabsTrigger>
            <TabsTrigger value="failed">실패</TabsTrigger>
            <TabsTrigger value="refunded">환불</TabsTrigger>
          </TabsList>
        </Tabs>

        {loadingData ? (
          <p className="text-center text-muted-foreground py-12">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {filter === "all" ? "아직 결제·주문 내역이 없습니다." : "조건에 맞는 내역이 없습니다."}
              </p>
              <Link to="/">
                <Button size="sm">서비스 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ payment, project, pkg }) => {
              const open = expanded === project.id;
              const pStatus = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META["대기"];
              const payBadge = payment
                ? paymentBadge(payment.status, payment.refund_status)
                : { label: "결제정보없음", cls: "bg-muted text-muted-foreground", Icon: AlertTriangle };
              const PayIcon = payBadge.Icon;
              const stageIdx = STAGES.indexOf(project.status === "수정중" ? "검수중" : project.status);
              const quoteDetails = project.quote_details && typeof project.quote_details === "object"
                ? (project.quote_details as Record<string, any>)
                : null;

              return (
                <Card key={`${project.id}-${payment?.id ?? "noPay"}`} className="overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpanded(open ? null : project.id)}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold truncate">{project.service_title}</h3>
                          {project.package_name && (
                            <span className="text-xs text-muted-foreground">({project.package_name})</span>
                          )}
                          <Badge variant="outline" className={`${pStatus.cls} border-0`}>
                            {pStatus.label}
                          </Badge>
                          <Badge variant="outline" className={`${payBadge.cls} border-0 flex items-center gap-1`}>
                            <PayIcon className="h-3 w-3" />
                            {payBadge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          주문번호 {project.order_number} · {formatDate(project.order_date)}
                          {payment && (
                            <>
                              {" · "}
                              <span className="font-medium text-foreground/80">
                                {formatMoney(payment.amount, payment.currency)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToChat(project.id);
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {open ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      {STAGES.map((s, idx) => (
                        <div
                          key={s}
                          className={`h-1.5 rounded-full ${idx <= stageIdx ? "bg-primary" : "bg-muted"}`}
                          title={s}
                        />
                      ))}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t bg-muted/20 px-5 py-4 space-y-4">
                      {/* Payment details */}
                      <section>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4" /> 결제 정보
                        </h4>
                        {payment ? (
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <dt className="text-muted-foreground">결제 수단</dt>
                            <dd className="font-medium">{payment.provider} ({payment.environment})</dd>
                            <dt className="text-muted-foreground">결제 금액</dt>
                            <dd className="font-medium">{formatMoney(payment.amount, payment.currency)}</dd>
                            <dt className="text-muted-foreground">결제 일시</dt>
                            <dd>{formatDate(payment.created_at)}</dd>
                            <dt className="text-muted-foreground">상태</dt>
                            <dd>
                              <span className={`px-2 py-0.5 rounded-full ${payBadge.cls}`}>{payBadge.label}</span>
                            </dd>
                            {payment.paddle_transaction_id && (
                              <>
                                <dt className="text-muted-foreground">거래 ID</dt>
                                <dd className="font-mono text-[11px] break-all">{payment.paddle_transaction_id}</dd>
                              </>
                            )}
                            {Number(payment.refunded_amount) > 0 && (
                              <>
                                <dt className="text-muted-foreground">환불 금액</dt>
                                <dd className="font-medium text-rose-600">
                                  {formatMoney(Number(payment.refunded_amount), payment.currency)}
                                </dd>
                              </>
                            )}
                          </dl>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            아직 결제가 완료되지 않았습니다. 채팅으로 결제 안내를 받으셨다면 다시 확인해 주세요.
                          </p>
                        )}
                      </section>

                      {/* Package details */}
                      {pkg && (
                        <section>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                            <Package className="h-4 w-4" /> 패키지 구성
                          </h4>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <dt className="text-muted-foreground">패키지명</dt>
                            <dd className="font-medium">{pkg.name}</dd>
                            <dt className="text-muted-foreground">납기</dt>
                            <dd>{pkg.delivery_days}일</dd>
                            <dt className="text-muted-foreground">수정 횟수</dt>
                            <dd>{pkg.revisions}회</dd>
                          </dl>
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="mt-2 text-xs space-y-1">
                              {pkg.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      )}

                      {/* Quote details */}
                      {quoteDetails && Object.keys(quoteDetails).length > 0 && (
                        <section>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                            <Receipt className="h-4 w-4" /> 견적 상세
                          </h4>
                          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            {Object.entries(quoteDetails).map(([k, v]) => (
                              <div key={k} className="contents">
                                <dt className="text-muted-foreground">{k}</dt>
                                <dd className="break-all">
                                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      )}

                      {/* Project status */}
                      <section>
                        <h4 className="text-sm font-semibold mb-2">진행 상태</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <span className="text-muted-foreground">현재 단계</span>
                          <span className="font-medium">{pStatus.label}</span>
                          <span className="text-muted-foreground">납기일</span>
                          <span>{new Date(project.due_date).toLocaleDateString("ko-KR")}</span>
                          {project.completed_date && (
                            <>
                              <span className="text-muted-foreground">완료일</span>
                              <span>{new Date(project.completed_date).toLocaleDateString("ko-KR")}</span>
                            </>
                          )}
                          <span className="text-muted-foreground">구매 확정</span>
                          <span>{project.confirm_status}</span>
                        </div>
                      </section>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => goToChat(project.id)}>
                          <MessageCircle className="h-4 w-4 mr-1.5" /> 채팅으로 문의
                        </Button>
                        <Link to="/my-projects">
                          <Button size="sm" variant="ghost">신청내역 보기</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
