import { useMemo } from "react";
import { MessageSquareText, CheckCircle2 } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

interface FeedbackResponseBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
}

interface ResponseField {
  label: string;
  value: string;
}

export default function FeedbackResponseBubble({ msg, isMine }: FeedbackResponseBubbleProps) {
  const { fields, categoryName } = useMemo(() => {
    try {
      if (msg.file_name) {
        const meta = JSON.parse(msg.file_name) as { fields?: ResponseField[]; categoryName?: string };
        return { fields: meta.fields || [], categoryName: meta.categoryName || "" };
      }
    } catch {}
    // Fallback: parse from plain text
    const lines = (msg.message || "").split("\n").filter(Boolean);
    const parsed: ResponseField[] = lines.map((line) => {
      const match = line.match(/^\[(.+?)\]\s*(.+)$/);
      return match ? { label: match[1], value: match[2] } : { label: "", value: line };
    });
    return { fields: parsed, categoryName: "" };
  }, [msg.file_name, msg.message]);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
      <div className="max-w-[85%] rounded-2xl overflow-hidden border-2 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-400">피드백 응답</span>
          {categoryName && (
            <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{categoryName}</span>
          )}
        </div>

        {/* Response fields */}
        <div className="px-4 py-3 space-y-2">
          {fields.map((field, idx) => (
            <div key={idx}>
              {field.label && (
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-400 mb-0.5">{field.label}</p>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">{field.value}</p>
            </div>
          ))}
          {fields.length === 0 && msg.message && (
            <p className="text-sm whitespace-pre-wrap text-foreground">{msg.message}</p>
          )}
        </div>

        {/* Timestamp */}
        <div className="px-4 py-1 border-t border-green-200 dark:border-green-800">
          <p className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
