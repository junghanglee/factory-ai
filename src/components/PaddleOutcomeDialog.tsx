import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Mail,
  MessageCircle,
  ListOrdered,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export type PaddleOutcomeKind = "success" | "error" | "cancelled" | "warning";

export interface PaddleOutcomeDetail {
  kind: PaddleOutcomeKind;
  /** Short title shown in the dialog header. */
  title: string;
  /** Main user-facing reason / description. */
  reason: string;
  /** Optional code / id to surface for support. */
  code?: string;
  /** Optional raw error message for collapsed details. */
  rawDetail?: string;
  /** Optional retry callback; when set a "재시도" button is shown. */
  onRetry?: () => void;
  /** Success-only: 결제 금액 표시 문자열 (예: "₩50,000 (≈ $36.50)") */
  amountStr?: string;
  /** Success-only: 영수증 발송 대상 이메일. 없으면 일반 안내 문구로 대체. */
  email?: string;
  /** Success-only: 결제된 프로젝트 ID. 채팅방 이동 버튼에 사용. */
  projectId?: string;
  /** Success-only: 채팅방 ID (있으면 우선 사용). */
  roomId?: string;
}

declare global {
  interface WindowEventMap {
    "paddle:outcome": CustomEvent<PaddleOutcomeDetail>;
  }
}

/** Dispatch a Paddle outcome to the global dialog. */
export function showPaddleOutcome(detail: PaddleOutcomeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("paddle:outcome", { detail }));
}

const KIND_META: Record<
  PaddleOutcomeKind,
  { Icon: typeof CheckCircle2; iconClass: string; ringClass: string }
> = {
  success: {
    Icon: CheckCircle2,
    iconClass: "text-green-600",
    ringClass: "bg-green-100",
  },
  error: {
    Icon: XCircle,
    iconClass: "text-destructive",
    ringClass: "bg-destructive/10",
  },
  cancelled: {
    Icon: Info,
    iconClass: "text-muted-foreground",
    ringClass: "bg-muted",
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: "text-amber-600",
    ringClass: "bg-amber-100",
  },
};

export default function PaddleOutcomeDialog() {
  const [outcome, setOutcome] = useState<PaddleOutcomeDetail | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (evt: CustomEvent<PaddleOutcomeDetail>) => {
      if (!evt.detail) return;
      setOutcome(evt.detail);
      setOpen(true);
    };
    window.addEventListener("paddle:outcome", handler as EventListener);
    return () => window.removeEventListener("paddle:outcome", handler as EventListener);
  }, []);

  if (!outcome) return null;

  const meta = KIND_META[outcome.kind];
  const Icon = meta.Icon;

  const handleRetry = () => {
    setOpen(false);
    setTimeout(() => outcome.onRetry?.(), 200);
  };

  const close = () => setOpen(false);

  // ───── 성공: 결제완료 안내 + 다음 단계 가이드 ─────
  if (outcome.kind === "success") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.ringClass}`}>
                <Icon className={`h-5 w-5 ${meta.iconClass}`} />
              </div>
              <DialogTitle className="text-lg">{outcome.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
              {outcome.amountStr
                ? `결제 금액 ${outcome.amountStr} 처리가 정상적으로 완료되었습니다.`
                : "결제가 정상적으로 완료되었습니다."}
            </DialogDescription>
          </DialogHeader>

          {/* 영수증 이메일 안내 */}
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 flex items-start gap-2.5 text-sm">
            <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div className="text-foreground/80 leading-relaxed">
              {outcome.email ? (
                <>
                  결제 영수증을{" "}
                  <span className="font-medium text-foreground break-all">{outcome.email}</span>{" "}
                  으로 발송해 드렸습니다. 메일이 보이지 않으면 스팸함도 확인해 주세요.
                </>
              ) : (
                <>결제 영수증이 가입하신 이메일로 발송됩니다. 도착까지 몇 분이 걸릴 수 있습니다.</>
              )}
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">다음 단계</p>
            <ol className="space-y-1.5 text-sm text-foreground/80">
              <li className="flex gap-2">
                <span className="text-primary font-semibold">1.</span>
                <span>담당 매니저가 채팅방에서 작업 일정과 진행 사항을 안내해 드립니다.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold">2.</span>
                <span>제작 완료 시 결과물을 채팅방에서 확인 후 구매확정을 진행해 주세요.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold">3.</span>
                <span>주문 내역과 결제 영수증은 마이페이지에서 언제든 확인하실 수 있습니다.</span>
              </li>
            </ol>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
            <Button asChild className="w-full justify-between" onClick={close}>
              <Link to="/chat">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  채팅방으로 이동
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button asChild variant="outline" onClick={close}>
                <Link to="/my-projects">
                  <ListOrdered className="h-4 w-4 mr-1.5" />
                  주문 내역
                </Link>
              </Button>
              <Button asChild variant="outline" onClick={close}>
                <Link to="/mypage">
                  <UserIcon className="h-4 w-4 mr-1.5" />
                  마이페이지
                </Link>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ───── 실패 / 취소 / 경고 ─────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.ringClass}`}>
              <Icon className={`h-5 w-5 ${meta.iconClass}`} />
            </div>
            <DialogTitle className="text-lg">{outcome.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
            {outcome.reason}
          </DialogDescription>
        </DialogHeader>

        {(outcome.code || outcome.rawDetail) && (
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground space-y-1">
            {outcome.code && (
              <div>
                <span className="font-medium text-foreground/70">코드: </span>
                <span className="font-mono">{outcome.code}</span>
              </div>
            )}
            {outcome.rawDetail && (
              <div className="break-all">
                <span className="font-medium text-foreground/70">상세: </span>
                {outcome.rawDetail}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          문제가 계속되면 결제 화면을 닫고 다시 시도하시거나, 도움이 필요하시면 고객센터로 문의해 주세요.
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" asChild>
            <Link to="/mypage" onClick={close}>
              고객센터 문의
            </Link>
          </Button>
          {outcome.onRetry ? (
            <Button onClick={handleRetry}>재시도</Button>
          ) : (
            <Button onClick={close}>닫기</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
