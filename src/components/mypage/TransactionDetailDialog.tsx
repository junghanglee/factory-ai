import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Sparkles, Calendar, Hash, Link2, FileText, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface TxDetail {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  reference_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: TxDetail | null;
  kind: "cash" | "point";
}

const TYPE_LABEL: Record<string, string> = {
  charge: "충전", earn: "구매적립", coupon: "쿠폰", use: "사용",
  refund: "환불", admin_grant: "관리자지급", admin_deduct: "관리자차감",
};

const TransactionDetailDialog = ({ open, onOpenChange, tx, kind }: Props) => {
  const [linkedOrder, setLinkedOrder] = useState<{ order_number: string; service_title: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !tx?.reference_id) {
      setLinkedOrder(null);
      return;
    }
    // reference_id 가 UUID 형태면 projects 조회 시도
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.reference_id);
    if (!isUuid) return;
    setLoading(true);
    supabase
      .from("projects")
      .select("order_number, service_title")
      .eq("id", tx.reference_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLinkedOrder(data);
        setLoading(false);
      });
  }, [open, tx?.reference_id]);

  if (!tx) return null;
  const isAdmin = tx.transaction_type.startsWith("admin_");
  const unit = kind === "cash" ? "원" : "P";
  const Icon = kind === "cash" ? Wallet : Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {kind === "cash" ? "캐시" : "포인트"} 거래 상세
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 금액 강조 */}
          <div className="rounded-lg bg-secondary/50 p-4 text-center">
            <Badge variant="outline" className="mb-2">
              {TYPE_LABEL[tx.transaction_type] || tx.transaction_type}
            </Badge>
            <p className={`text-2xl font-bold ${tx.amount > 0 ? "text-green-600" : "text-destructive"}`}>
              {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}{unit}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              거래 후 잔액: {tx.balance_after.toLocaleString()}{unit}
            </p>
          </div>

          {/* 상세 필드 */}
          <div className="space-y-2 text-sm">
            <Row icon={<Calendar className="h-3.5 w-3.5" />} label="일시"
                 value={new Date(tx.created_at).toLocaleString("ko-KR")} />
            <Row icon={<Hash className="h-3.5 w-3.5" />} label="거래 ID"
                 value={<span className="font-mono text-xs break-all">{tx.id}</span>} />
            {tx.reference_id && (
              <Row icon={<Link2 className="h-3.5 w-3.5" />} label="연결 참조"
                   value={
                     loading ? <span className="text-muted-foreground">조회 중...</span> :
                     linkedOrder ? (
                       <span>
                         <span className="font-mono text-xs">{linkedOrder.order_number}</span>
                         <span className="text-muted-foreground"> · {linkedOrder.service_title}</span>
                       </span>
                     ) : <span className="font-mono text-xs break-all">{tx.reference_id}</span>
                   } />
            )}
            <Row icon={<UserIcon className="h-3.5 w-3.5" />} label="처리자"
                 value={isAdmin ? "관리자" : tx.transaction_type === "coupon" ? "시스템(쿠폰)" : tx.transaction_type === "earn" ? "시스템(자동적립)" : "본인"} />
            <Row icon={<FileText className="h-3.5 w-3.5" />} label="메모"
                 value={tx.description || <span className="text-muted-foreground">-</span>} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-2 py-1.5 border-b last:border-0">
    <div className="flex items-center gap-1.5 text-muted-foreground min-w-[80px]">
      {icon}<span className="text-xs">{label}</span>
    </div>
    <div className="flex-1 text-right">{value}</div>
  </div>
);

export default TransactionDetailDialog;
