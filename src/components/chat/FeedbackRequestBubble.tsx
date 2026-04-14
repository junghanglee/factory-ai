import { useState, useEffect, useMemo } from "react";
import { MessageSquareText, CheckCircle2, Send, Clock, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface AttachedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface FeedbackFieldDef {
  field_key: string;
  field_label: string;
  field_type: "select" | "textarea" | "text";
  field_options: string[];
}

export default function FeedbackRequestBubble({ msg, isMine, roomId }: FeedbackRequestBubbleProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<FeedbackFieldDef[]>([]);

  const meta = useMemo(() => {
    try {
      if (msg.file_name) return JSON.parse(msg.file_name) as { categoryName?: string; files?: AttachedFile[]; serviceId?: string; categoryId?: string };
    } catch {}
    return null;
  }, [msg.file_name]);

  const categoryName = meta?.categoryName || "";
  const attachedFiles = meta?.files || [];

  // Fetch feedback record + fields from DB
  useEffect(() => {
    (async () => {
      // Fetch feedback record
      const { data: fbData } = await supabase
        .from("feedback_requests")
        .select("id, status, response_text, responded_at")
        .eq("message_id", msg.id)
        .maybeSingle();
      if (fbData) setFeedback(fbData as FeedbackData);

      // Fetch fields: service-level first, then category-level fallback
      let fieldRows: any[] = [];
      if (meta?.serviceId) {
        const { data } = await supabase
          .from("feedback_fields")
          .select("field_key, field_label, field_type, field_options")
          .eq("service_id", meta.serviceId)
          .order("sort_order");
        if (data && data.length > 0) fieldRows = data;
      }
      if (fieldRows.length === 0 && meta?.categoryId) {
        const { data } = await supabase
          .from("feedback_fields")
          .select("field_key, field_label, field_type, field_options")
          .eq("category_id", meta.categoryId)
          .order("sort_order");
        if (data && data.length > 0) fieldRows = data;
      }
      // Fallback: generic fields
      if (fieldRows.length === 0) {
        fieldRows = [
          { field_key: "quality", field_label: "결과물 품질", field_type: "select", field_options: ["만족", "수정필요", "전면수정"] },
          { field_key: "modification", field_label: "수정 요청사항", field_type: "textarea", field_options: [] },
          { field_key: "overall", field_label: "전반적인 의견", field_type: "textarea", field_options: [] },
        ];
      }
      setFields(fieldRows as FeedbackFieldDef[]);
      setLoading(false);
    })();
  }, [msg.id, meta?.serviceId, meta?.categoryId]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!feedback) return;
    setSubmitting(true);
    const responseLines: string[] = [];
    fields.forEach((f) => {
      const val = formValues[f.field_key];
      if (val && val.trim()) responseLines.push(`[${f.field_label}] ${val.trim()}`);
    });
    const responseText = responseLines.join("\n") || "컨펌완료";

    // Update feedback_requests record
    await supabase.from("feedback_requests").update({
      response_text: responseText,
      status: "responded",
      responded_at: new Date().toISOString(),
    }).eq("id", feedback.id);

    // Also send a styled chat message so it appears in realtime
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && msg.room_id) {
      const responseFields = fields
        .map((f) => {
          const val = formValues[f.field_key];
          return val?.trim() ? { label: f.field_label, value: val.trim() } : null;
        })
        .filter(Boolean);
      const responseMeta = JSON.stringify({ fields: responseFields, categoryName });
      await supabase.from("chat_messages").insert({
        room_id: msg.room_id,
        sender_id: currentUser.id,
        message: responseText,
        message_type: "feedback_response",
        file_name: responseMeta,
      });
      await supabase.from("chat_rooms").update({
        last_message: "💬 피드백 응답",
        last_message_at: new Date().toISOString(),
      }).eq("id", msg.room_id);
    }

    setFeedback({ ...feedback, status: "responded", response_text: responseText, responded_at: new Date().toISOString() });
    setFormValues({});
    setSubmitting(false);
  };

  const isPending = feedback?.status === "pending";
  const isResponded = feedback?.status === "responded";
  const hasAnyValue = fields.some((f) => formValues[f.field_key]?.trim());

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
      <div className="max-w-[85%] rounded-2xl overflow-hidden border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800">
          <MessageSquareText className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">피드백 요청</span>
          {categoryName && (
            <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">{categoryName}</span>
          )}
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
        {msg.message && (
          <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800">
            <p className="text-sm whitespace-pre-wrap text-foreground">{msg.message}</p>
          </div>
        )}

        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">📎 첨부파일 ({attachedFiles.length}개)</p>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white dark:bg-background rounded-lg border px-3 py-2 hover:bg-accent transition-colors text-xs max-w-[200px]">
                  {file.type.startsWith("image/") ? (
                    <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                  <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="px-4 py-1">
          <p className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</p>
        </div>

        {/* Response - completed */}
        {isResponded && feedback?.response_text && (
          <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800 bg-white/50 dark:bg-background/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">💬 피드백 응답</p>
            <p className="text-sm whitespace-pre-wrap">{feedback.response_text}</p>
            {feedback.responded_at && (
              <p className="text-[10px] text-muted-foreground mt-1">{formatTime(feedback.responded_at)}</p>
            )}
          </div>
        )}

        {/* Feedback form for user (not admin, pending) */}
        {!isMine && isPending && !loading && (
          <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">피드백을 입력해주세요</p>
            {fields.map((field) => (
              <div key={field.field_key}>
                <Label className="text-xs">{field.field_label}</Label>
                {field.field_type === "select" && field.field_options?.length > 0 ? (
                  <Select value={formValues[field.field_key] || ""} onValueChange={(v) => handleFieldChange(field.field_key, v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs bg-white dark:bg-background">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.field_options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.field_type === "textarea" ? (
                  <Textarea
                    value={formValues[field.field_key] || ""}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    placeholder="의견을 입력해주세요..."
                    className="mt-1 text-xs min-h-[60px] resize-none bg-white dark:bg-background"
                  />
                ) : (
                  <Input
                    value={formValues[field.field_key] || ""}
                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                    className="mt-1 h-8 text-xs bg-white dark:bg-background"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                setFormValues({});
                handleFieldChange("overall", "컨펌완료");
                setTimeout(() => handleSubmitResponse(), 0);
              }}>
                ✅ 컨펌완료
              </Button>
              <Button size="sm" className="text-xs h-7 gap-1" onClick={handleSubmitResponse} disabled={!hasAnyValue || submitting}>
                <Send className="h-3 w-3" /> 피드백 전송
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
