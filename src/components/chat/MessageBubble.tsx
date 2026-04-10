import { useState } from "react";
import { FileText, Download, Play, MessageCircle, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/useChat";
import VideoReviewDialog from "./VideoReviewDialog";

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

interface MessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  onReply?: (msg: ChatMessage) => void;
  roomId?: string;
}

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function MessageBubble({ msg, isMine, onReply, roomId }: MessageBubbleProps) {
  const [showReview, setShowReview] = useState(false);

  const isSystem = msg.sender_id === SYSTEM_USER_ID;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] bg-accent/60 text-accent-foreground rounded-xl px-4 py-2.5 text-center">
          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
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

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
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
          <p className="text-sm whitespace-pre-wrap mt-1">{attachedText}</p>
        )}

        {msg.message_type === "text" && msg.message && (
          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
        )}
        {msg.message_type === "order" && msg.message && (
          <div className="text-sm">
            <p className="font-semibold mb-1">📋 주문서</p>
            <p className="whitespace-pre-wrap">{msg.message}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-xs ${timeClass}`}>{formatTime(msg.created_at)}</p>
          {/* Save button for single file messages */}
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
