import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, MessageSquare, X, Film, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MessageBubble from "@/components/chat/MessageBubble";
import ImageGroupBubble from "@/components/chat/ImageGroupBubble";
import { groupMessages } from "@/utils/messageGrouping";
import type { ChatMessage, ChatRoom } from "@/hooks/useChat";
import { smartCompress } from "@/utils/imageCompression";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 100;
const MAX_FILES = 10;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

interface SellerChatTabProps {
  sellerId: string;
}

export default function SellerChatTab({ sellerId }: SellerChatTabProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch rooms where this seller is linked
  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    const { data } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("seller_id", sellerId)
      .order("last_message_at", { ascending: false });
    if (data) setRooms(data as ChatRoom[]);
    setLoadingRooms(false);
  }, [sellerId]);

  // Fetch messages
  const fetchMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  const selectRoom = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchMessages(roomId);
    // Reset unread for customer side (seller reads = customer's messages are read)
    await supabase.from("chat_rooms").update({ unread_admin: 0 }).eq("id", roomId);
  }, [fetchMessages]);

  // Send text
  const handleSend = async () => {
    if (!user || !selectedRoomId) return;

    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        await sendFile(file);
      }
      if (messageInput.trim()) {
        await sendText(messageInput.trim());
      }
      setPendingFiles([]);
      setMessageInput("");
      return;
    }

    if (!messageInput.trim()) return;
    await sendText(messageInput.trim());
    setMessageInput("");
  };

  const sendText = async (text: string) => {
    if (!user || !selectedRoomId) return;
    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: text,
      message_type: "text",
    });
    if (error) { toast.error("메시지 전송 실패"); return; }
    await supabase.from("chat_rooms").update({
      last_message: text,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  };

  const sendFile = async (file: File) => {
    if (!user || !selectedRoomId) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다.`);
      return;
    }
    const compressed = await smartCompress(file, "chat");
    const ext = compressed.name.split(".").pop();
    const path = `${selectedRoomId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
    if (uploadError) { toast.error("업로드 실패"); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    let msgType = "file";
    if (file.type.startsWith("image/")) msgType = "image";
    else if (file.type.startsWith("video/")) msgType = "video";

    const displayName = file.name.length > 50 ? file.name.slice(0, 47) + "..." : file.name;
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: displayName,
      message_type: msgType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    await supabase.from("chat_rooms").update({
      last_message: `📎 ${displayName}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
    e.target.value = "";
  };

  // Realtime
  useEffect(() => {
    fetchRooms();
    const ch = supabase
      .channel("seller_chat_rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchRooms]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const ch = supabase
      .channel(`seller_msgs_${selectedRoomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedRoomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedRoomId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto select first room
  useEffect(() => {
    if (!loadingRooms && rooms.length > 0 && !selectedRoomId) {
      selectRoom(rooms[0].id);
    }
  }, [loadingRooms, rooms, selectedRoomId, selectRoom]);

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

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>고객 채팅</CardTitle>
        <CardDescription>구매자와 직접 소통하세요</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex border-t" style={{ height: "500px" }}>
          {/* Room list */}
          <div className="w-64 border-r flex flex-col">
            <ScrollArea className="flex-1">
              {loadingRooms ? (
                <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
              ) : rooms.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">아직 채팅이 없습니다</p>
                  <p className="text-xs text-muted-foreground mt-1">구매자가 문의하면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="divide-y">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room.id)}
                      className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${
                        selectedRoomId === room.id ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{room.title}</p>
                        {room.unread_admin > 0 && (
                          <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {room.unread_admin}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{room.last_message || "새 채팅"}</p>
                      {room.last_message_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(room.last_message_at)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                <div className="p-3 border-b">
                  <span className="font-medium text-sm">{selectedRoom.title}</span>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex justify-center mb-3">
                          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{group.date}</span>
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) =>
                            item.type === "image_group" ? (
                              <ImageGroupBubble
                                key={item.messages[0].id}
                                messages={item.messages}
                                isMine={item.messages[0].sender_id === user?.id}
                              />
                            ) : (
                              <MessageBubble
                                key={item.msg.id}
                                msg={item.msg}
                                isMine={item.msg.sender_id === user?.id}
                                roomId={selectedRoomId || undefined}
                              />
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                {/* Input */}
                <div className="p-3 border-t">
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingFiles.map((file, idx) => (
                        <div key={idx} className="relative group/file">
                          {file.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(file)} alt="" className="h-12 w-12 object-cover rounded border" />
                          ) : (
                            <div className="h-12 w-12 rounded border bg-secondary flex items-center justify-center">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/file:opacity-100"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 h-9 text-sm"
                    />
                    <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={!messageInput.trim() && pendingFiles.length === 0}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                채팅방을 선택하세요
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
