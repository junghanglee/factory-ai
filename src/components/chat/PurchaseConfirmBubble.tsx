import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import type { ChatMessage } from "@/hooks/useChat";

interface PurchaseConfirmBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  canConfirm: boolean; // Only buyer can confirm
  onConfirm?: () => Promise<void>;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function PurchaseConfirmBubble({ msg, isMine, canConfirm, onConfirm }: PurchaseConfirmBubbleProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Parse metadata from file_name
  let meta: { confirmed?: boolean; confirmedAt?: string } = {};
  try { meta = JSON.parse(msg.file_name || "{}"); } catch {}

  const isConfirmed = meta.confirmed === true;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm?.();
      setShowDialog(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="max-w-[400px] w-full">
        <div className={`border-2 rounded-xl overflow-hidden ${isConfirmed ? "border-green-200 bg-green-50/50" : "border-primary/20 bg-primary/5"}`}>
          <div className="px-4 py-3 text-center">
            {isConfirmed ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-700">구매가 확정되었습니다</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {meta.confirmedAt ? new Date(meta.confirmedAt).toLocaleString("ko-KR") : ""}
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">구매확정 요청</p>
                <p className="text-xs text-muted-foreground mt-1">{msg.message}</p>
                {canConfirm && !isConfirmed && (
                  <Button size="sm" className="mt-3 w-full" onClick={() => setShowDialog(true)}>
                    구매 확정하기
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">{formatTime(msg.created_at)}</p>

        {/* 2-step confirmation dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> 구매확정 최종 확인
              </DialogTitle>
              <DialogDescription>
                구매를 확정하면 되돌릴 수 없습니다. 결과물을 충분히 확인하셨나요?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 text-sm">
              <p>• 구매확정 후에는 수정 요청이 불가합니다.</p>
              <p>• 판매자에게 대금이 정산됩니다.</p>
              <p>• 리뷰를 작성할 수 있습니다.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
              <Button onClick={handleConfirm} disabled={confirming} className="bg-green-600 hover:bg-green-700">
                {confirming ? "처리중..." : "구매 확정"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
