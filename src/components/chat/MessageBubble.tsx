import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText, Download, Play, MessageCircle, Reply, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/useChat";
import VideoReviewDialog from "./VideoReviewDialog";
import FeedbackRequestBubble from "./FeedbackRequestBubble";
import FeedbackResponseBubble from "./FeedbackResponseBubble";
import { supabase } from "@/integrations/supabase/client";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

// URL detection and linkification
function linkify(text: string): (string | JSX.Element)[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all hover:opacity-80"
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

// Avatar cache hook
const avatarCache = new Map<string, string | null>();

function useAvatar(senderId: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarCache.get(senderId) ?? null);

  useEffect(() => {
    if (avatarCache.has(senderId)) {
      setAvatarUrl(avatarCache.get(senderId) ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", senderId)
        .maybeSingle();
      if (!cancelled) {
        const url = data?.avatar_url || null;
        avatarCache.set(senderId, url);
        setAvatarUrl(url);
      }
    })();
    return () => { cancelled = true; };
  }, [senderId]);

  return avatarUrl;
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  onReply?: (msg: ChatMessage) => void;
  roomId?: string;
}

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function MessageBubble({ msg, isMine, onReply, roomId }: MessageBubbleProps) {
  const [showReview, setShowReview] = useState(false);
  const avatarUrl = useAvatar(msg.sender_id);

  // Delegate feedback_request messages to FeedbackRequestBubble
  if (msg.message_type === "feedback_request") {
    return <FeedbackRequestBubble msg={msg} isMine={isMine} roomId={roomId} />;
  }
  // Delegate feedback_response messages to FeedbackResponseBubble
  if (msg.message_type === "feedback_response") {
    return <FeedbackResponseBubble msg={msg} isMine={isMine} />;
  }

  const isSystem = msg.sender_id === SYSTEM_USER_ID || msg.message_type === "system";

  if (isSystem) {
    // System/auto messages always display as admin (left-aligned, not "mine")
    return (
      <div className="flex justify-start gap-2 group">
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mt-0.5">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <div className="max-w-[70%]">
          <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-2.5">
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-1">{formatTime(msg.created_at)}</p>
        </div>
      </div>
    );
  }

  const bubbleClass = isMine ? "bg-primary text-primary-foreground" : "bg-secondary";
  const timeClass = isMine ? "text-primary-foreground/70" : "text-muted-foreground";

  const isConfirmVideo = msg.message_type === "confirm_video";
  const isImage = msg.message_type === "image";
  const isVideo = msg.message_type === "video" || isConfirmVideo;
  const isFile = msg.message_type === "file";

  const attachedText = (isImage || isVideo || isFile) && msg.message && msg.file_name && msg.message !== msg.file_name && !msg.message.startsWith("📎") && !msg.message.startsWith("📦")
    ? msg.message
    : null;

  const Avatar = () => (
    <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center mt-0.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2 group`}>
      {!isMine && <Avatar />}
      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${bubbleClass} relative`}>
        {/* Image */}
        {isImage && msg.file_url && (
          <div className="relative group/img">
            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
              <img src={msg.file_url} alt={msg.file_name || "image"} className="rounded-lg max-w-full max-h-36 mb-1" />
            </a>
          </div>
        )}

        {/* Video */}
        {isVideo && msg.file_url && (
          <div className="relative">
            <video src={msg.file_url} controls className="rounded-lg max-w-full max-h-36 mb-1" />
            {isConfirmVideo && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-3 right-2 text-xs h-7 gap-1"
                onClick={() => setShowReview(true)}
              >
                <MessageCircle className="h-3 w-3" /> 피드백
              </Button>
            )}
          </div>
        )}

        {/* File */}
        {isFile && msg.file_url && (
          <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 p-1.5 rounded-lg mb-1 ${isMine ? "bg-primary-foreground/10" : "bg-background/50"}`}>
            <FileText className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs truncate">{msg.file_name}</p>
              {msg.file_size && <p className={`text-[10px] ${timeClass}`}>{formatFileSize(msg.file_size)}</p>}
            </div>
            <Download className="h-3.5 w-3.5 shrink-0 ml-auto" />
          </a>
        )}

        {attachedText && (
          <p className="text-sm whitespace-pre-wrap mt-1">{linkify(attachedText)}</p>
        )}

        {msg.message_type === "text" && msg.message && (
          <p className="text-sm whitespace-pre-wrap">{linkify(msg.message)}</p>
        )}
        {msg.message_type === "order" && msg.message && (
          <div className="text-sm">
            <p className="font-semibold mb-1">📋 주문서</p>
            <p className="whitespace-pre-wrap">{linkify(msg.message)}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-xs ${timeClass}`}>{formatTime(msg.created_at)}</p>
          {msg.file_url && (
            <button
              onClick={() => downloadFile(msg.file_url!, msg.file_name || "file")}
              className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                isMine
                  ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
                  : "bg-background/50 hover:bg-background/80 text-foreground"
              }`}
              title="저장"
            >
              <Download className="h-3 w-3" /> 저장
            </button>
          )}
        </div>

        {/* Hover actions */}
        <div className={`absolute top-1 ${isMine ? "left-0 -translate-x-full pl-0 pr-1" : "right-0 translate-x-full pl-1 pr-0"} hidden group-hover:flex items-center gap-0.5`}>
          {onReply && (
            <button onClick={() => onReply(msg)} className="p-1 rounded hover:bg-accent" title="답장">
              <Reply className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {isMine && <Avatar />}

      {isConfirmVideo && showReview && roomId && (
        <VideoReviewDialog
          open={showReview}
          onClose={() => setShowReview(false)}
          messageId={msg.id}
          roomId={roomId}
          videoUrl={msg.file_url || ""}
        />
      )}
    </div>
  );
}
