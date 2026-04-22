import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, User, Package, Pencil, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type QuoteSource = "user" | "package" | "manual";

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
  addonMode?: "separate" | "merge"; // 추가금: 별도 청구서 vs 기존 결제건에 합산
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
  const [addonMode, setAddonMode] = useState<"separate" | "merge">("separate");
  const [source, setSource] = useState<QuoteSource>("manual");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");

  const [serviceTitle, setServiceTitle] = useState(defaultServiceTitle);
  const [packageName, setPackageName] = useState("");
  const [price, setPrice] = useState(defaultPrice ? String(defaultPrice) : "");
  const [priceUsd, setPriceUsd] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(String(defaultDeliveryDays));
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasUserSubmitted = defaultPrice > 0;

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
    setShowConfirm(false);
    // Default source: prefer user-submitted if exists, else package if loaded later, else manual
    setSource(hasUserSubmitted ? "user" : (serviceId ? "package" : "manual"));
  }, [open, hasExistingPayment, defaultServiceTitle, defaultPrice, defaultDeliveryDays, serviceId, hasUserSubmitted]);

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
    })();
  }, [open, serviceId]);

  // When source changes, prefill values appropriately
  useEffect(() => {
    if (source === "user" && hasUserSubmitted) {
      setPrice(String(defaultPrice));
      setDeliveryDays(String(defaultDeliveryDays));
      setPackageName("");
      setSelectedPkgId("");
      setPriceUsd("");
    } else if (source === "manual") {
      setSelectedPkgId("");
    }
    // package mode handled by handleSelectPackage
  }, [source, defaultPrice, defaultDeliveryDays, hasUserSubmitted]);

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

  const priceNum = parseInt(price) || 0;
  const canSend = !!serviceTitle.trim() && priceNum > 0 && (source !== "package" || !!selectedPkgId);

  const handleSubmit = async () => {
    if (!canSend) return;
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
      setShowConfirm(false);
    }
  };

  const titleText = quoteType === "addon" ? "추가금 청구서 발송" : "확정 견적 발송";
  const submitText = quoteType === "addon" ? "추가금 발송" : "확정 견적 발송";

  const sourceLabel: Record<QuoteSource, string> = {
    user: "사용자 신청 금액",
    package: "상품 패키지",
    manual: "직접 입력",
  };

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

        {/* 견적 출처 선택 (신규 견적일 때만) */}
        {quoteType === "new" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">견적 금액 출처</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => hasUserSubmitted && setSource("user")}
                disabled={!hasUserSubmitted}
                className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
                  source === "user"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-accent"
                } ${!hasUserSubmitted ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <User className="h-4 w-4" />
                <span>신청 금액</span>
              </button>
              <button
                type="button"
                onClick={() => packages.length > 0 && setSource("package")}
                disabled={packages.length === 0}
                className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
                  source === "package"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-accent"
                } ${packages.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <Package className="h-4 w-4" />
                <span>패키지 선택</span>
              </button>
              <button
                type="button"
                onClick={() => setSource("manual")}
                className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
                  source === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                <Pencil className="h-4 w-4" />
                <span>직접 입력</span>
              </button>
            </div>

            {/* 사용자 신청 금액 안내 */}
            {source === "user" && hasUserSubmitted && (
              <div className="text-xs bg-muted/60 border rounded-md p-2 flex items-start gap-2">
                <User className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <div>
                  사용자가 처음 신청한 금액 <span className="font-semibold">{defaultPrice.toLocaleString()}원</span>을 그대로 확정 견적으로 보냅니다. 필요하면 아래에서 수정 가능합니다.
                </div>
              </div>
            )}
          </div>
        )}


        <div className="space-y-3 py-1">
          {source === "package" && packages.length > 0 && quoteType === "new" && (
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
              {quoteType === "new" && hasUserSubmitted && priceNum !== defaultPrice && priceNum > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  사용자 신청: {defaultPrice.toLocaleString()}원
                  {priceNum > defaultPrice
                    ? ` (+${(priceNum - defaultPrice).toLocaleString()})`
                    : ` (-${(defaultPrice - priceNum).toLocaleString()})`}
                </p>
              )}
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

        {/* 확정 견적 미리보기 (확인 단계) */}
        {showConfirm && (
          <div className="border-2 border-primary/50 rounded-lg p-3 bg-primary/5 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
              <CheckCircle2 className="h-4 w-4" />
              확정 견적 미리보기
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">출처</span><span className="font-medium">{sourceLabel[source]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">서비스</span><span className="font-medium">{serviceTitle}</span></div>
              {packageName && <div className="flex justify-between"><span className="text-muted-foreground">{quoteType === "addon" ? "항목" : "패키지"}</span><span>{packageName}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">금액</span><span className="font-bold text-primary">{priceNum.toLocaleString()}원{priceUsd ? ` (≈ $${priceUsd})` : ""}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">납기</span><span>{deliveryDays}일</span></div>
            </div>
          </div>
        )}

        <DialogFooter>
          {showConfirm ? (
            <>
              <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={submitting}>← 수정</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "발송중..." : `✓ ${submitText}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button onClick={() => setShowConfirm(true)} disabled={!canSend}>
                다음: 미리보기
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

