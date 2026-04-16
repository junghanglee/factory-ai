import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, CreditCard, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useChat";

interface QuoteDetails {
  serviceTitle: string;
  packageName?: string;
  price: number;
  deliveryDays: number;
  memo?: string;
  orderNumber?: string;
}

interface QuoteBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  paymentStatus?: string;
  isAdmin?: boolean;
  onConfirmPayment?: () => void;
  projectId?: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function QuoteBubble({ msg, isMine, paymentStatus, isAdmin, onConfirmPayment, projectId }: QuoteBubbleProps) {
  const navigate = useNavigate();

  let quote: QuoteDetails | null = null;
  try {
    quote = JSON.parse(msg.file_name || "{}");
  } catch {
    quote = null;
  }

  if (!quote) return null;

  const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    "견적발송": { label: "견적 발송됨", color: "text-blue-600 bg-blue-50", icon: <FileText className="h-3.5 w-3.5" /> },
    "입금대기": { label: "입금 대기중", color: "text-amber-600 bg-amber-50", icon: <Clock className="h-3.5 w-3.5" /> },
    "입금완료": { label: "결제 완료", color: "text-green-600 bg-green-50", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    "구매확정": { label: "구매 확정됨", color: "text-primary bg-primary/10", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  };

  const status = statusLabels[paymentStatus || "견적발송"] || statusLabels["견적발송"];

  const handleCardPayment = () => {
    if (!projectId) {
      toast.error("프로젝트 정보를 찾을 수 없습니다.");
      return;
    }
    const title = quote!.serviceTitle + (quote!.packageName ? ` - ${quote!.packageName}` : "");
    const params = new URLSearchParams({
      project_id: projectId,
      amount: quote!.price.toString(),
      currency: "krw",
      title,
    });
    navigate(`/checkout?${params.toString()}`);
  };

  const canPay = !isMine && !isAdmin && (paymentStatus === "견적발송" || paymentStatus === "입금대기");

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
      <div className="max-w-[360px] w-full">
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          {/* Header */}
          <div className="bg-primary/5 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">견적서</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">서비스</span>
              <span className="font-medium text-right max-w-[200px] truncate">{quote.serviceTitle}</span>
            </div>
            {quote.packageName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">패키지</span>
                <span>{quote.packageName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">금액</span>
              <span className="font-bold text-primary">{quote.price.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">납기일</span>
              <span>{quote.deliveryDays}일</span>
            </div>
            {quote.orderNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-mono text-xs">{quote.orderNumber}</span>
              </div>
            )}
            {quote.memo && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{quote.memo}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {(canPay || (isAdmin && paymentStatus === "견적발송")) && (
            <div className="px-4 py-3 border-t bg-muted/30 space-y-2">
              {canPay && projectId && (
                <Button
                  size="sm"
                  className="w-full text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleCardPayment}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> 카드결제하기
                </Button>
              )}
              {isAdmin && paymentStatus === "견적발송" && onConfirmPayment && (
                <Button size="sm" className="w-full text-xs" onClick={onConfirmPayment}>
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> 입금 확인 처리
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-1">{formatTime(msg.created_at)}</p>
      </div>
    </div>
  );
}
