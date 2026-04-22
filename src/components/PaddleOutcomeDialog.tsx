import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
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
    // Slight delay so the dialog close animation doesn't conflict with reopening checkout.
    setTimeout(() => outcome.onRetry?.(), 200);
  };

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

        {outcome.kind !== "success" && (
          <div className="text-xs text-muted-foreground">
            문제가 계속되면 결제 화면을 닫고 다시 시도하시거나, 도움이 필요하시면 고객센터로 문의해 주세요.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {outcome.kind === "success" ? (
            <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
              확인
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/mypage" onClick={() => setOpen(false)}>
                  고객센터 문의
                </Link>
              </Button>
              {outcome.onRetry ? (
                <Button onClick={handleRetry}>재시도</Button>
              ) : (
                <Button onClick={() => setOpen(false)}>닫기</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
