import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Wallet, DollarSign, Building2, CreditCard } from "lucide-react";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

interface SellerSettlementTabProps {
  sellerProfile: any;
}

const SellerSettlementTab = ({ sellerProfile }: SellerSettlementTabProps) => {
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Settlement info form
  const [settleForm, setSettleForm] = useState({
    business_type: sellerProfile.business_type || "개인",
    business_number: sellerProfile.business_number || "",
    business_owner: sellerProfile.business_owner || "",
    bank_name: sellerProfile.bank_name || "",
    bank_account: sellerProfile.bank_account || "",
    bank_holder: sellerProfile.bank_holder || "",
  });

  // Fetch settlements
  const { data: settlements = [] } = useQuery({
    queryKey: ["seller-settlements", sellerProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*, projects(order_number, service_title, customer)")
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch withdrawal requests
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["seller-withdrawals", sellerProfile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalSettled = settlements.filter((s: any) => s.status === "완료").reduce((sum: number, s: any) => sum + s.seller_amount, 0);
  const totalPending = settlements.filter((s: any) => s.status === "대기").reduce((sum: number, s: any) => sum + s.seller_amount, 0);
  const totalWithdrawn = withdrawals.filter((w: any) => w.status === "완료").reduce((sum: number, w: any) => sum + w.amount, 0);
  const availableBalance = totalSettled - totalWithdrawn;

  const saveSettlementInfo = async () => {
    const { error } = await supabase
      .from("seller_profiles")
      .update(settleForm as any)
      .eq("id", sellerProfile.id);
    if (error) { toast.error("저장 실패: " + error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
    toast.success("정산 정보가 저장되었습니다");
  };

  const requestWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = Number(withdrawAmount);
      if (!amount || amount <= 0) throw new Error("금액을 입력해주세요");
      if (amount > availableBalance) throw new Error("출금 가능 금액을 초과합니다");
      if (!settleForm.bank_name || !settleForm.bank_account) throw new Error("계좌 정보를 먼저 입력해주세요");

      const { error } = await supabase.from("withdrawal_requests").insert({
        seller_id: sellerProfile.id,
        amount,
        bank_name: settleForm.bank_name,
        bank_account: settleForm.bank_account,
        bank_holder: settleForm.bank_holder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-withdrawals"] });
      toast.success("출금 신청이 완료되었습니다");
      setWithdrawOpen(false);
      setWithdrawAmount("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">정산 완료</p>
            <p className="text-xl font-bold text-green-600">{formatPrice(totalSettled)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">출금 가능</p>
            <p className="text-xl font-bold text-primary">{formatPrice(availableBalance)}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">정산 대기</p>
            <p className="text-xl font-bold text-orange-500">{formatPrice(totalPending)}원</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setWithdrawOpen(true)} className="gap-2">
          <CreditCard className="h-4 w-4" /> 출금 신청
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">정산 정보</TabsTrigger>
          <TabsTrigger value="history">정산 내역</TabsTrigger>
          <TabsTrigger value="withdrawals">출금 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> 정산 정보 관리</CardTitle>
              <CardDescription>출금을 위한 계좌 및 사업자 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>사업자 유형</Label>
                <Select value={settleForm.business_type} onValueChange={v => setSettleForm(p => ({ ...p, business_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="개인">개인</SelectItem>
                    <SelectItem value="개인사업자">개인사업자</SelectItem>
                    <SelectItem value="법인사업자">법인사업자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settleForm.business_type !== "개인" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>사업자번호</Label>
                    <Input value={settleForm.business_number} onChange={e => setSettleForm(p => ({ ...p, business_number: e.target.value }))} placeholder="000-00-00000" />
                  </div>
                  <div>
                    <Label>대표자명</Label>
                    <Input value={settleForm.business_owner} onChange={e => setSettleForm(p => ({ ...p, business_owner: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>은행명</Label>
                  <Input value={settleForm.bank_name} onChange={e => setSettleForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="국민은행" />
                </div>
                <div>
                  <Label>계좌번호</Label>
                  <Input value={settleForm.bank_account} onChange={e => setSettleForm(p => ({ ...p, bank_account: e.target.value }))} placeholder="000-0000-0000" />
                </div>
                <div>
                  <Label>예금주</Label>
                  <Input value={settleForm.bank_holder} onChange={e => setSettleForm(p => ({ ...p, bank_holder: e.target.value }))} />
                </div>
              </div>
              <Button onClick={saveSettlementInfo} className="gap-2">
                <Save className="h-4 w-4" /> 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>정산 내역</CardTitle>
              <CardDescription>수수료율: {sellerProfile.commission_rate}%</CardDescription>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3" />
                  <p>정산 내역이 없습니다</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문번호</TableHead>
                      <TableHead>서비스</TableHead>
                      <TableHead className="text-right">주문금액</TableHead>
                      <TableHead className="text-right">수수료</TableHead>
                      <TableHead className="text-right">정산금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>정산일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.projects?.order_number || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{s.projects?.service_title || "-"}</TableCell>
                        <TableCell className="text-right">{formatPrice(s.order_amount)}원</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatPrice(s.commission_amount)}원</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(s.seller_amount)}원</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "완료" ? "default" : s.status === "취소" ? "destructive" : "secondary"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.settled_at ? new Date(s.settled_at).toLocaleDateString("ko-KR") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>출금 신청 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3" />
                  <p>출금 신청 내역이 없습니다</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>신청일</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead>입금계좌</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>처리일</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-sm">{new Date(w.created_at).toLocaleDateString("ko-KR")}</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(w.amount)}원</TableCell>
                        <TableCell className="text-sm">{w.bank_name} {w.bank_account}</TableCell>
                        <TableCell>
                          <Badge variant={w.status === "완료" ? "default" : w.status === "반려" ? "destructive" : "secondary"}>
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {w.processed_at ? new Date(w.processed_at).toLocaleDateString("ko-KR") : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{w.admin_memo || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>출금 신청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">출금 가능 금액</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(availableBalance)}원</p>
            </div>
            <div>
              <Label>출금 금액 (원)</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="출금할 금액을 입력하세요"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>입금 계좌: {settleForm.bank_name} {settleForm.bank_account} ({settleForm.bank_holder})</p>
            </div>
            <Button
              onClick={() => requestWithdrawal.mutate()}
              disabled={requestWithdrawal.isPending}
              className="w-full"
            >
              출금 신청하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerSettlementTab;
