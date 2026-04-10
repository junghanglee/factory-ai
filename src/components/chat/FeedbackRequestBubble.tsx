import { useState, useEffect } from "react";
import { MessageSquareText, CheckCircle2, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "@/hooks/useChat";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

interface FeedbackRequestBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  roomId?: string;
}

interface FeedbackData {
  id: string;
  status: string;
  response_text: string | null;
  responded_at: string | null;
}

export default function FeedbackRequestBubble({ msg, isMine, roomId }: FeedbackRequestBubbleProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("feedback_requests")
        .select("id, status, response_text, responded_at")
        .eq("message_id", msg.id)
        .maybeSingle();
      if (data) setFeedback(data as FeedbackData);
      setLoading(false);
    })();
  }, [msg.id]);

  const handleSubmitResponse = async () => {
    if (!feedback || !response.trim()) return;
    setSubmitting(true);
    await supabase.from("feedback_requests").update({
      response_text: response.trim(),
      status: "responded",
      responded_at: new Date().toISOString(),
    }).eq("id", feedback.id);
    setFeedback({ ...feedback, status: "responded", response_text: response.trim(), responded_at: new Date().toISOString() });
    setResponse("");
    setSubmitting(false);
  };

  const isPending = feedback?.status === "pending";
  const isResponded = feedback?.status === "responded";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
      <div className="max-w-[80%] rounded-2xl overflow-hidden border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800">
          <MessageSquareText className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">피드백 요청</span>
          {isPending && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-600">
              <Clock className="h-3 w-3" /> 대기중
            </span>
          )}
          {isResponded && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600">
              <CheckCircle2 className="h-3 w-3" /> 응답완료
            </span>
          )}
        </div>

        {/* Request text */}
        <div className="px-4 py-3">
          <p className="text-sm whitespace-pre-wrap text-foreground">{msg.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
        </div>

        {/* Response section */}
        {isResponded && feedback?.response_text && (
          <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800 bg-white/50 dark:bg-background/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">💬 피드백 응답</p>
            <p className="text-sm whitespace-pre-wrap">{feedback.response_text}</p>
            {feedback.responded_at && (
              <p className="text-[10px] text-muted-foreground mt-1">{formatTime(feedback.responded_at)}</p>
            )}
          </div>
        )}

        {/* Input for user (not admin, pending) */}
        {!isMine && isPending && !loading && (
          <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800 space-y-2">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="피드백을 입력하세요... (수정사항 또는 컨펌완료)"
              className="text-xs min-h-[60px] resize-none bg-white dark:bg-background"
            />
            <div className="flex justify-end">
              <Button size="sm" className="text-xs h-7 gap-1" onClick={handleSubmitResponse} disabled={!response.trim() || submitting}>
                <Send className="h-3 w-3" /> 피드백 전송
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
