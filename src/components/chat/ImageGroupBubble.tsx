import { Download, DownloadCloud, Reply } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

interface ImageGroupBubbleProps {
  messages: ChatMessage[];
  isMine: boolean;
  onReply?: (msg: ChatMessage) => void;
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

export default function ImageGroupBubble({ messages, isMine, onReply }: ImageGroupBubbleProps) {
  const bubbleClass = isMine ? "bg-primary text-primary-foreground" : "bg-secondary";
  const timeClass = isMine ? "text-primary-foreground/70" : "text-muted-foreground";
  const lastMsg = messages[messages.length - 1];

  const handleSaveAll = () => {
    messages.forEach((m) => {
      if (m.file_url) downloadFile(m.file_url, m.file_name || "image");
    });
  };

  // Determine grid cols based on count
  const count = messages.length;
  const gridCols = count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
      <div className={`max-w-[70%] rounded-2xl px-3 py-2.5 ${bubbleClass} relative`}>
        <div className={`grid ${gridCols} gap-1 rounded-lg overflow-hidden`}>
          {messages.map((m) => (
            <a key={m.id} href={m.file_url!} target="_blank" rel="noopener noreferrer" className="relative group/img">
              <img
                src={m.file_url!}
                alt={m.file_name || "image"}
                className="w-full h-24 object-cover rounded"
              />
              <button
                onClick={(e) => { e.preventDefault(); downloadFile(m.file_url!, m.file_name || "image"); }}
                className="absolute bottom-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                title="저장"
              >
                <Download className="h-3 w-3" />
              </button>
            </a>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <p className={`text-xs ${timeClass}`}>{formatTime(lastMsg.created_at)}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveAll}
              className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${isMine ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" : "bg-background/50 hover:bg-background/80 text-foreground"} transition-colors`}
              title="전체 저장"
            >
              <DownloadCloud className="h-3 w-3" /> 전체저장
            </button>
          </div>
        </div>

        {/* Hover reply */}
        {onReply && (
          <div className={`absolute top-1 ${isMine ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} hidden group-hover:flex`}>
            <button onClick={() => onReply(lastMsg)} className="p-1 rounded hover:bg-accent" title="답장">
              <Reply className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
