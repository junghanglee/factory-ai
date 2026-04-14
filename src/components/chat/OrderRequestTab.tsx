import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, FileText, Clock, Package, DollarSign, Hash, Monitor, Bot, Film, MessageSquareText, CheckCircle2, FolderKanban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderRequestTabProps {
  metadata: Record<string, any> | null;
  roomId?: string;
}

interface FeedbackItem {
  id: string;
  request_text: string;
  response_text: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface ProjectItem {
  id: string;
  order_number: string;
  service_title: string;
  status: string;
  price: number;
  due_date: string;
  created_at: string;
  notes: string | null;
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

function formatTime(d: string) {
  return new Date(d).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderRequestTab({ metadata, roomId }: OrderRequestTabProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    if (!roomId) return;

    // Fetch feedback requests
    (async () => {
      const { data } = await supabase
        .from("feedback_requests")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (data) setFeedbacks(data as FeedbackItem[]);
    })();

    // Fetch linked projects via chat_rooms.project_id
    (async () => {
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("project_id")
        .eq("id", roomId)
        .maybeSingle();
      if (room?.project_id) {
        const { data } = await supabase
          .from("projects")
          .select("id, order_number, service_title, status, price, due_date, created_at, notes")
          .eq("id", room.project_id);
        if (data) setProjects(data as ProjectItem[]);
      }
    })();

    // Realtime subscription for feedback updates
    const channel = supabase
      .channel(`feedback_${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback_requests", filter: `room_id=eq.${roomId}` }, () => {
        supabase
          .from("feedback_requests")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .then(({ data }) => { if (data) setFeedbacks(data as FeedbackItem[]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const req = metadata?.orderRequest;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Order request info */}
        {req ? (
          <>
            <div className="rounded-lg border bg-accent/30 p-3 space-y-2">
              <h4 className="font-semibold text-sm">{req.serviceTitle}</h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {req.packageName}</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {Number(req.price).toLocaleString()}원</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.deliveryDays}일</span>
                {req.categoryName && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {req.categoryName}</span>}
              </div>
            </div>

            {req.requesterName && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">요청자</h4>
                <div className="text-sm">
                  <p className="font-medium">{req.requesterName}</p>
                  {req.requesterEmail && <p className="text-muted-foreground text-xs">{req.requesterEmail}</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">의뢰 상세</h4>
              <div className="space-y-2">
                {req.subject && <InfoRow icon={Hash} label="주제" value={req.subject} />}
                {req.refUrl && (
                  <div className="flex items-start gap-2 text-sm">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-muted-foreground">참고 URL: </span>
                      <a href={req.refUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{req.refUrl}</a>
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

            {req.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">상세설명</h4>
                <p className="text-sm whitespace-pre-wrap leading-relaxed bg-secondary rounded-lg p-3">{req.description}</p>
              </div>
            )}

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
          </>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">요청사항이 없습니다</div>
        )}

        {/* Production request history */}
        {projects.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" /> 제작 요청 이력 ({projects.length})
            </h4>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="rounded-lg border overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{proj.order_number}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{proj.status}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{proj.service_title}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                      <span>{proj.price.toLocaleString()}원</span>
                      <span>납기: {new Date(proj.due_date).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(proj.created_at)}</p>
                  </div>
                  {proj.notes && (
                    <div className="px-3 py-2 bg-secondary/50">
                      <p className="text-xs text-muted-foreground">📝 메모: {proj.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback history */}
        {feedbacks.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MessageSquareText className="h-3.5 w-3.5" /> 피드백 이력 ({feedbacks.length})
            </h4>
            <div className="space-y-3">
              {feedbacks.map((fb, idx) => (
                <div key={fb.id} className="rounded-lg border overflow-hidden">
                  <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">#{idx + 1} 피드백 요청</span>
                      {fb.status === "responded" ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-600"><CheckCircle2 className="h-3 w-3" /> 응답완료</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600"><Clock className="h-3 w-3" /> 대기중</span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{fb.request_text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(fb.created_at)}</p>
                  </div>
                  {fb.response_text && (
                    <div className="px-3 py-2 bg-green-50 dark:bg-green-950/20">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-0.5">💬 응답</p>
                      <p className="text-sm">{fb.response_text}</p>
                      {fb.responded_at && <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(fb.responded_at)}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
