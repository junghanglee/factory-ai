import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Minus, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatPanel } from "@/hooks/useChatPanel";
import MessageBubble from "./MessageBubble";
import ImageGroupBubble from "./ImageGroupBubble";
import { groupMessages } from "@/utils/messageGrouping";
import type { ChatRoom, ChatMessage } from "@/hooks/useChat";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

interface ChatPanelProps {
  room: ChatRoom;
  userId: string;
  onMinimize: () => void;
  onClose: () => void;
  onFocus: () => void;
  isFocused: boolean;
}

export default function ChatPanel({ room, userId, onMinimize, onClose, onFocus, isFocused }: ChatPanelProps) {
  const { messages, loading, sendMessage, sendFile } = useChatPanel(room.id, userId);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        await sendFile(file, pendingFiles.length === 1 ? (input.trim() || undefined) : undefined);
      }
      if (pendingFiles.length > 1 && input.trim()) await sendMessage(input.trim());
      setPendingFiles([]);
      setInput("");
      return;
    }
    if (!input.trim()) return;
    const prefix = replyTo ? `↩️ ${replyTo.message?.slice(0, 30) || "파일"}...\n\n` : "";
    await sendMessage(prefix + input);
    setInput("");
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setPendingFiles((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = "";
  };

  // Group messages by date
  const groupedMessages: { date: string; items: ReturnType<typeof groupMessages> }[] = [];
  const dateGroups: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else dateGroups.push({ date, msgs: [msg] });
  });
  dateGroups.forEach((g) => {
    groupedMessages.push({ date: g.date, items: groupMessages(g.msgs) });
  });

  return (
    <div
      className={`flex flex-col border-r last:border-r-0 flex-1 min-w-0 ${isFocused ? "ring-2 ring-primary/40 ring-inset" : ""}`}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30 shrink-0">
        <span className="text-xs font-semibold truncate flex-1 min-w-0">{room.title}</span>
        <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="p-1 rounded hover:bg-secondary" title="최소화">
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded hover:bg-destructive/10" title="닫기">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">로딩 중...</div>
        ) : (
          <div className="space-y-3">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center mb-2">
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{group.date}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((item) =>
                    item.type === "image_group" ? (
                      <ImageGroupBubble key={item.messages[0].id} messages={item.messages} isMine={item.messages[0].sender_id === userId} onReply={(m) => setReplyTo(m)} />
                    ) : (
                      <MessageBubble key={item.msg.id} msg={item.msg} isMine={item.msg.sender_id === userId} onReply={(m) => setReplyTo(m)} roomId={room.id} />
                    )
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t space-y-1 shrink-0">
        {pendingFiles.length > 0 && (
          <div className="flex gap-1 flex-wrap px-1">
            {pendingFiles.map((f, i) => (
              <div key={i} className="relative group/f">
                {f.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(f)} className="h-10 w-10 rounded border object-cover" alt="" />
                ) : (
                  <div className="h-10 w-10 rounded border bg-secondary flex items-center justify-center">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/f:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {replyTo && (
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-[10px]">
            <span className="truncate flex-1">↩️ {replyTo.message?.slice(0, 30) || "파일"}</span>
            <button onClick={() => setReplyTo(null)}><X className="h-3 w-3" /></button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground hover:text-foreground shrink-0">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            rows={1}
            className="flex-1 min-h-[32px] max-h-[80px] px-3 py-1.5 rounded-xl border bg-secondary/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 80) + "px"; }}
          />
          <Button size="icon" className="rounded-full h-7 w-7 shrink-0" onClick={handleSend} disabled={!input.trim() && pendingFiles.length === 0}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}