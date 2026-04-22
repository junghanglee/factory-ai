import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServicePackage {
  id: string;
  name: string;
  price: number;
  price_usd: number | null;
  delivery_days: number;
}

export interface QuoteSubmitParams {
  serviceTitle: string;
  packageName: string;
  packageId?: string | null;
  price: number;
  priceUsd: number | null;
  deliveryDays: number;
  memo: string;
  quoteType: "new" | "addon"; // 신규 견적 / 추가금
}

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (quote: QuoteSubmitParams) => Promise<void>;
  defaultServiceTitle?: string;
  defaultPrice?: number;
  defaultDeliveryDays?: number;
  serviceId?: string | null; // 챗 룸의 service_id → 패키지 자동 로딩
  hasExistingPayment?: boolean; // 이미 결제된 프로젝트 → 추가금 모드 우선 노출
}

export default function QuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultServiceTitle = "",
  defaultPrice = 0,
  defaultDeliveryDays = 7,
  serviceId,
  hasExistingPayment = false,
}: QuoteDialogProps) {
  const [quoteType, setQuoteType] = useState<"new" | "addon">(hasExistingPayment ? "addon" : "new");
  const [mode, setMode] = useState<"package" | "manual">("manual");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");

  const [serviceTitle, setServiceTitle] = useState(defaultServiceTitle);
  const [packageName, setPackageName] = useState("");
  const [price, setPrice] = useState(defaultPrice ? String(defaultPrice) : "");
  const [priceUsd, setPriceUsd] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(String(defaultDeliveryDays));
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset and reload when dialog opens
  useEffect(() => {
    if (!open) return;
    setQuoteType(hasExistingPayment ? "addon" : "new");
    setServiceTitle(defaultServiceTitle);
    setPrice(defaultPrice ? String(defaultPrice) : "");
    setDeliveryDays(String(defaultDeliveryDays));
    setPriceUsd("");
    setPackageName("");
    setMemo("");
    setSelectedPkgId("");
    setMode(serviceId ? "package" : "manual");
  }, [open, hasExistingPayment, defaultServiceTitle, defaultPrice, defaultDeliveryDays, serviceId]);

  // Load packages when service_id is provided
  useEffect(() => {
    if (!open || !serviceId) {
      setPackages([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("service_packages")
        .select("id, name, price, price_usd, delivery_days")
        .eq("service_id", serviceId)
        .order("sort_order");
      setPackages(data || []);
      if (data && data.length > 0) setMode("package");
    })();
  }, [open, serviceId]);

  // Auto-fill when a package is selected
  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;
    setPackageName(pkg.name);
    setPrice(String(pkg.price));
    setPriceUsd(pkg.price_usd ? String(pkg.price_usd) : "");
    setDeliveryDays(String(pkg.delivery_days));
  };

  const handleSubmit = async () => {
    const priceNum = parseInt(price) || 0;
    if (!serviceTitle.trim() || priceNum <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        serviceTitle: serviceTitle.trim(),
        packageName: packageName.trim(),
        packageId: selectedPkgId || null,
        price: priceNum,
        priceUsd: priceUsd.trim() ? parseFloat(priceUsd) : null,
        deliveryDays: parseInt(deliveryDays) || 7,
        memo: memo.trim(),
        quoteType,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const titleText = quoteType === "addon" ? "추가금 청구서 발송" : "견적서 발송";
  const submitText = quoteType === "addon" ? "추가금 발송" : "견적서 발송";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {titleText}
          </DialogTitle>
        </DialogHeader>

        {/* 견적 유형 토글 (신규 / 추가금) */}
        <Tabs value={quoteType} onValueChange={(v) => setQuoteType(v as "new" | "addon")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">신규 견적</TabsTrigger>
            <TabsTrigger value="addon">
              <Plus className="h-3.5 w-3.5 mr-1" /> 추가금
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {quoteType === "addon" && (
          <p className="text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded-md p-2">
            ⚡ 추가금은 별도 결제건으로 처리되며, 사용자에게 추가 결제 버튼이 표시됩니다.
          </p>
        )}

        {/* 입력 모드 토글: 패키지 선택 vs 직접 입력 */}
        {packages.length > 0 && quoteType === "new" && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "package" | "manual")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="package">상품 패키지 선택</TabsTrigger>
              <TabsTrigger value="manual">직접 입력</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-3 py-1">
          {mode === "package" && packages.length > 0 && quoteType === "new" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">패키지 선택 *</label>
              <Select value={selectedPkgId} onValueChange={handleSelectPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="등록된 패키지 중 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.price.toLocaleString()}원 / {p.delivery_days}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">서비스명 *</label>
            <Input
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder={quoteType === "addon" ? "예: 추가 수정 작업" : "서비스명을 입력하세요"}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {quoteType === "addon" ? "항목명" : "패키지명"}
            </label>
            <Input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder={quoteType === "addon" ? "예: 추가 리비전, 긴급 작업비" : "예: 베이직, 스탠다드, 프리미엄"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">금액 (원) *</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">금액 (USD)</label>
              <Input
                type="number"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">납기 (일)</label>
            <Input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              placeholder="7"
              min="1"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">메모</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={quoteType === "addon" ? "추가금이 발생한 사유를 안내해주세요" : "추가 안내사항이 있으면 입력하세요"}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !serviceTitle.trim() || !(parseInt(price) > 0)}>
            {submitting ? "발송중..." : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
