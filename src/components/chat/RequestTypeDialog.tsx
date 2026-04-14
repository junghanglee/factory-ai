import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquareText, FolderKanban } from "lucide-react";

interface RequestTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFeedback: () => void;
  onSelectProduction: () => void;
}

export default function RequestTypeDialog({
  open, onOpenChange, onSelectFeedback, onSelectProduction,
}: RequestTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>요청 유형 선택</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">어떤 유형의 요청을 보내시겠습니까?</p>

          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-start gap-3 justify-start text-left"
            onClick={() => { onOpenChange(false); onSelectFeedback(); }}
          >
            <MessageSquareText className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">피드백 요청</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                고객(사용자)에게 피드백을 요청합니다. 채팅창에 피드백 양식이 전송됩니다.
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-start gap-3 justify-start text-left"
            onClick={() => { onOpenChange(false); onSelectProduction(); }}
          >
            <FolderKanban className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">제작 요청</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                제작관리자에게 작업을 지시합니다. 프로젝트 관리 화면으로 전송됩니다.
              </p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
