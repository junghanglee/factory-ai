import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, FileText, Clock, Package, DollarSign, Hash, Monitor, Bot, Film } from "lucide-react";

interface OrderRequestTabProps {
  metadata: Record<string, any> | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export default function OrderRequestTab({ metadata }: OrderRequestTabProps) {
  if (!metadata?.orderRequest) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center py-8">
        요청사항이 없습니다
      </div>
    );
  }

  const req = metadata.orderRequest;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Package summary */}
        <div className="rounded-lg border bg-accent/30 p-3 space-y-2">
          <h4 className="font-semibold text-sm">{req.serviceTitle}</h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {req.packageName}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {Number(req.price).toLocaleString()}원</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.deliveryDays}일</span>
            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {req.categoryName}</span>
          </div>
        </div>

        {/* Requester */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">요청자</h4>
          <div className="text-sm">
            <p className="font-medium">{req.requesterName}</p>
            <p className="text-muted-foreground text-xs">{req.requesterEmail}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">의뢰 상세</h4>
          <div className="space-y-2">
            {req.subject && <InfoRow icon={Hash} label="주제" value={req.subject} />}
            {req.refUrl && (
              <div className="flex items-start gap-2 text-sm">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">참고 URL: </span>
                  <a href={req.refUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {req.refUrl}
                  </a>
                </div>
              </div>
            )}
            {req.productionTime && <InfoRow icon={Film} label="제작시간(편당)" value={req.productionTime} />}
            {req.videoTime && <InfoRow icon={Film} label="영상시간" value={req.videoTime} />}
            {req.quantity && <InfoRow icon={Hash} label="제작 수량" value={req.quantity} />}
            {req.llmOwned && <InfoRow icon={Bot} label="LLM 보유" value={req.llmOwned} />}
            {req.pcMemory && <InfoRow icon={Monitor} label="PC 메모리" value={req.pcMemory} />}
            {req.aiAgentExp && <InfoRow icon={Bot} label="AI에이전트 경험" value={req.aiAgentExp} />}
          </div>
        </div>

        {/* Description */}
        {req.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">상세설명</h4>
            <p className="text-sm whitespace-pre-wrap leading-relaxed bg-secondary rounded-lg p-3">{req.description}</p>
          </div>
        )}

        {/* Attached files info */}
        {req.fileNames && req.fileNames.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">첨부파일</h4>
            <div className="space-y-1">
              {req.fileNames.map((name: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs bg-secondary rounded-md px-3 py-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
