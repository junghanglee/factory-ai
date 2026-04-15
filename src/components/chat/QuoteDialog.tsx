import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (quote: {
    serviceTitle: string;
    packageName: string;
    price: number;
    deliveryDays: number;
    memo: string;
  }) => Promise<void>;
  defaultServiceTitle?: string;
  defaultPrice?: number;
  defaultDeliveryDays?: number;
}

export default function QuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultServiceTitle = "",
  defaultPrice = 0,
  defaultDeliveryDays = 7,
}: QuoteDialogProps) {
  const [serviceTitle, setServiceTitle] = useState(defaultServiceTitle);
  const [packageName, setPackageName] = useState("");
  const [price, setPrice] = useState(defaultPrice.toString());
  const [deliveryDays, setDeliveryDays] = useState(defaultDeliveryDays.toString());
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const priceNum = parseInt(price) || 0;
    if (!serviceTitle.trim() || priceNum <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        serviceTitle: serviceTitle.trim(),
        packageName: packageName.trim(),
        price: priceNum,
        deliveryDays: parseInt(deliveryDays) || 7,
        memo: memo.trim(),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            견적서 발송
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">서비스명 *</label>
            <Input
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="서비스명을 입력하세요"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">패키지명</label>
            <Input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="예: 베이직, 스탠다드, 프리미엄"
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
              <label className="text-sm font-medium mb-1.5 block">납기 (일)</label>
              <Input
                type="number"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                placeholder="7"
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">메모</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가 안내사항이 있으면 입력하세요"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !serviceTitle.trim() || !(parseInt(price) > 0)}>
            {submitting ? "발송중..." : "견적서 발송"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
