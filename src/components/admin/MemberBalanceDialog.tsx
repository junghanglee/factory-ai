import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, Coins, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberId: string;        // members.id (= auth user id in this project)
  memberName: string;
  memberEmail: string;
}

interface Tx {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const MemberBalanceDialog = ({ open, onOpenChange, memberId, memberName, memberEmail }: Props) => {
  const [cash, setCash] = useState(0);
  const [point, setPoint] = useState(0);
  const [cashTx, setCashTx] = useState<Tx[]>([]);
  const [pointTx, setPointTx] = useState<Tx[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState("");
  const [kind, setKind] = useState<"cash" | "point">("cash");
  const [op, setOp] = useState<"grant" | "deduct">("grant");
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    const [bal, ctx, ptx] = await Promise.all([
      supabase.from("user_balances").select("cash_balance, point_balance").eq("user_id", memberId).maybeSingle(),
      supabase.from("cash_transactions").select("*").eq("user_id", memberId).order("created_at", { ascending: false }).limit(20),
      supabase.from("point_transactions").select("*").eq("user_id", memberId).order("created_at", { ascending: false }).limit(20),
    ]);
    setCash(bal.data?.cash_balance ?? 0);
    setPoint(bal.data?.point_balance ?? 0);
    setCashTx((ctx.data as Tx[]) || []);
    setPointTx((ptx.data as Tx[]) || []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const adjust = async () => {
    const v = Number(amount);
    if (!v || v <= 0) {
      toast.error("금액을 입력하세요.");
      return;
    }
    setAdjusting(true);
    const signed = op === "grant" ? v : -v;
    const { data, error } = await supabase.rpc("admin_adjust_balance", {
      _user_id: memberId,
      _kind: kind,
      _amount: signed,
      _description: memo || null,
    });
    setAdjusting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (!result?.success) {
      toast.error(result?.error || "조정 실패");
      return;
    }
    toast.success(`${kind === "cash" ? "캐시" : "포인트"} ${op === "grant" ? "지급" : "차감"} 완료`);
    setAmount("");
    setMemo("");
    load();
  };

  const txTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      charge: "충전", earn: "적립", coupon: "쿠폰", use: "사용",
      refund: "환불", admin_grant: "관리자지급", admin_deduct: "관리자차감",
    };
    return map[t] || t;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> {memberName} 캐시/포인트 관리
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{memberEmail}</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> 캐시</p>
                <p className="text-xl font-bold">₩{cash.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3 w-3" /> 포인트</p>
                <p className="text-xl font-bold text-primary">{point.toLocaleString()}P</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg p-3 space-y-2 bg-secondary/30">
          <p className="text-sm font-medium">수동 조정</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <Button size="sm" variant={kind === "cash" ? "default" : "outline"} onClick={() => setKind("cash")} className="flex-1">캐시</Button>
              <Button size="sm" variant={kind === "point" ? "default" : "outline"} onClick={() => setKind("point")} className="flex-1">포인트</Button>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={op === "grant" ? "default" : "outline"} onClick={() => setOp("grant")} className="flex-1 gap-1"><Plus className="h-3 w-3" />지급</Button>
              <Button size="sm" variant={op === "deduct" ? "destructive" : "outline"} onClick={() => setOp("deduct")} className="flex-1 gap-1"><Minus className="h-3 w-3" />차감</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">금액</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 10000" />
            </div>
            <div>
              <Label className="text-xs">메모(선택)</Label>
              <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="사유" />
            </div>
          </div>
          <Button size="sm" onClick={adjust} disabled={adjusting} className="w-full">
            {adjusting ? "처리 중..." : "적용"}
          </Button>
        </div>

        <Tabs defaultValue="cash" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="cash" className="flex-1">캐시 내역 ({cashTx.length})</TabsTrigger>
            <TabsTrigger value="point" className="flex-1">포인트 내역 ({pointTx.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="cash">
            <div className="border rounded-lg max-h-64 overflow-auto">
              {loading ? <p className="p-4 text-center text-muted-foreground text-sm">불러오는 중...</p>
                : cashTx.length === 0 ? <p className="p-4 text-center text-muted-foreground text-sm">내역 없음</p>
                : cashTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{txTypeLabel(tx.transaction_type)}</p>
                      <p className="text-xs text-muted-foreground">{tx.description} · {new Date(tx.created_at).toLocaleString("ko-KR")}</p>
                    </div>
                    <div className="text-right">
                      <p className={tx.amount > 0 ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">잔액 ₩{tx.balance_after.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="point">
            <div className="border rounded-lg max-h-64 overflow-auto">
              {loading ? <p className="p-4 text-center text-muted-foreground text-sm">불러오는 중...</p>
                : pointTx.length === 0 ? <p className="p-4 text-center text-muted-foreground text-sm">내역 없음</p>
                : pointTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{txTypeLabel(tx.transaction_type)}</p>
                      <p className="text-xs text-muted-foreground">{tx.description} · {new Date(tx.created_at).toLocaleString("ko-KR")}</p>
                    </div>
                    <div className="text-right">
                      <p className={tx.amount > 0 ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}P
                      </p>
                      <p className="text-xs text-muted-foreground">잔액 {tx.balance_after.toLocaleString()}P</p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MemberBalanceDialog;
