import { useState, useEffect, useMemo } from "react";
import { MessageSquareText, CheckCircle2, Send, Clock, Download, FileText, Image as ImageIcon } from "lucide-react";
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

type CategoryType = "ai-image" | "ai-video" | "ai-webtoon" | "ai-ads" | "ai-assistant" | "mini-game" | "other";

function getCategoryType(categoryName: string): CategoryType {
  if (categoryName.includes("이미지")) return "ai-image";
  if (categoryName.includes("영상제작") || categoryName.includes("모션")) return "ai-video";
  if (categoryName.includes("웹툰")) return "ai-webtoon";
  if (categoryName.includes("바이럴") || categoryName.includes("광고")) return "ai-ads";
  if (categoryName.includes("비서") || categoryName.includes("크레딧")) return "ai-assistant";
  if (categoryName.includes("미니게임")) return "mini-game";
  return "other";
}

function getFeedbackFields(catType: CategoryType): { key: string; label: string; type: "text" | "textarea" | "select"; options?: string[] }[] {
  const common = [
    { key: "overall", label: "전반적인 의견", type: "textarea" as const },
  ];

  switch (catType) {
    case "ai-image":
      return [
        { key: "composition", label: "구도/레이아웃", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "color", label: "색감/톤", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "detail", label: "디테일/요소", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    case "ai-video":
      return [
        { key: "flow", label: "영상 흐름/구성", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "visual", label: "비주얼/효과", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "audio", label: "음향/BGM", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "timing", label: "타이밍/속도", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    case "ai-webtoon":
      return [
        { key: "drawing", label: "그림체/스타일", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "story", label: "스토리/연출", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "layout", label: "컷 구성/레이아웃", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    case "ai-ads":
      return [
        { key: "message", label: "메시지/카피", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "visual", label: "비주얼/효과", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "cta", label: "CTA/전환요소", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    case "ai-assistant":
      return [
        { key: "accuracy", label: "응답 정확도", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "speed", label: "처리 속도", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "usability", label: "사용 편의성", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    case "mini-game":
      return [
        { key: "gameplay", label: "게임플레이", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "design", label: "디자인/UI", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "function", label: "기능/동작", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
    default:
      return [
        { key: "quality", label: "결과물 품질", type: "select", options: ["만족", "수정필요", "전면수정"] },
        { key: "modification", label: "수정 요청사항", type: "textarea" },
        ...common,
      ];
  }
}

export default function FeedbackRequestBubble({ msg, isMine, roomId }: FeedbackRequestBubbleProps) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse metadata from file_name field
  const meta = useMemo(() => {
    try {
      if (msg.file_name) return JSON.parse(msg.file_name) as { categoryName?: string; files?: AttachedFile[] };
    } catch {}
    return null;
  }, [msg.file_name]);

  const categoryName = meta?.categoryName || "";
  const attachedFiles = meta?.files || [];
  const catType = getCategoryType(categoryName);
  const fields = getFeedbackFields(catType);

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

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!feedback) return;
    setSubmitting(true);

    // Build structured response
    const responseLines: string[] = [];
    fields.forEach((f) => {
      const val = formValues[f.key];
      if (val && val.trim()) responseLines.push(`[${f.label}] ${val.trim()}`);
    });
    const responseText = responseLines.join("\n") || "컨펌완료";

    await supabase.from("feedback_requests").update({
      response_text: responseText,
      status: "responded",
      responded_at: new Date().toISOString(),
    }).eq("id", feedback.id);

    setFeedback({ ...feedback, status: "responded", response_text: responseText, responded_at: new Date().toISOString() });
    setFormValues({});
    setSubmitting(false);
  };

  const isPending = feedback?.status === "pending";
  const isResponded = feedback?.status === "responded";
  const hasAnyValue = fields.some((f) => formValues[f.key]?.trim());

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

        {/* Response section - completed */}
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
              <div key={field.key}>
                <Label className="text-xs">{field.label}</Label>
                {field.type === "select" && field.options ? (
                  <Select value={formValues[field.key] || ""} onValueChange={(v) => handleFieldChange(field.key, v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs bg-white dark:bg-background">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    value={formValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.key === "modification" ? "구체적인 수정 요청사항을 입력해주세요..." : "의견을 입력해주세요..."}
                    className="mt-1 text-xs min-h-[60px] resize-none bg-white dark:bg-background"
                  />
                ) : (
                  <Input
                    value={formValues[field.key] || ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
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
