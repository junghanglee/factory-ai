import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, FileText, Download } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function AdminMessageBubble({ msg, isAdmin }: { msg: ChatMessage; isAdmin: boolean }) {
  const bubbleClass = isAdmin
    ? "bg-primary text-primary-foreground"
    : "bg-secondary";
  const timeClass = isAdmin ? "text-primary-foreground/70" : "text-muted-foreground";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${bubbleClass}`}>
        {msg.message_type === "image" && msg.file_url && (
          <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
            <img src={msg.file_url} alt={msg.file_name || ""} className="rounded-lg max-w-full max-h-60 mb-1" />
          </a>
        )}
        {msg.message_type === "video" && msg.file_url && (
          <video src={msg.file_url} controls className="rounded-lg max-w-full max-h-60 mb-1" />
        )}
        {msg.message_type === "file" && msg.file_url && (
          <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isAdmin ? "bg-primary-foreground/10" : "bg-background/50"}`}>
            <FileText className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm truncate">{msg.file_name}</p>
              {msg.file_size && <p className={`text-xs ${timeClass}`}>{formatFileSize(msg.file_size)}</p>}
            </div>
            <Download className="h-4 w-4 shrink-0 ml-auto" />
          </a>
        )}
        {(msg.message_type === "text" || msg.message_type === "order") && msg.message && (
          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
        )}
        <p className={`text-xs mt-1 ${timeClass}`}>{formatTime(msg.created_at)}</p>
      </div>
    </div>
  );
}

const AdminChat = () => {
  const {
    rooms, selectedRoomId, messages, loadingRooms,
    selectRoom, sendMessage, sendFile, user,
  } = useChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendFile(file);
    e.target.value = "";
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">채팅 관리</h1>
      <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 200px)" }}>
        {/* Room list */}
        <div className="w-72 border-r flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            {loadingRooms ? (
              <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">채팅이 없습니다</div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  className={`w-full p-4 text-left border-b hover:bg-accent/50 transition-colors ${selectedRoomId === room.id ? "bg-accent" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{room.title}</span>
                    {room.last_message_at && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatTime(room.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate pr-2">{room.last_message || "새 대화"}</p>
                    {room.unread_admin > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {room.unread_admin}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b font-medium text-sm">{selectedRoom.title}</div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <AdminMessageBubble
                      key={msg.id}
                      msg={msg}
                      isAdmin={msg.sender_id === user?.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="답변을 입력하세요..."
                  className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              채팅방을 선택하세요
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
