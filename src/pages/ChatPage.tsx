import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Search, Plus, FolderOpen, X, Film, Video as VideoIcon } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectPanel from "@/components/chat/ProjectPanel";
import MessageBubble from "@/components/chat/MessageBubble";
import FileDrawer from "@/components/chat/FileDrawer";

const MAX_FILE_SIZE_MB = 100;

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

const ChatPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    rooms, selectedRoomId, messages, loadingRooms,
    selectRoom, sendMessage, sendFile, createRoom,
    project, projectFiles, confirmProject, requestRevision,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoCreated, setAutoCreated] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const handleAutoCreate = useCallback(async () => {
    if (autoCreated || loadingRooms || !user) return;
    const state = location.state as any;
    if (!state) return;
    if (state.openRoomId) {
      setAutoCreated(true);
      selectRoom(state.openRoomId);
      navigate("/chat", { replace: true });
      return;
    }
    if (state.inquiry) {
      setAutoCreated(true);
      const title = `[문의] ${state.inquiry.serviceTitle}`;
      const room = await createRoom(title, state.inquiry.serviceId);
      if (room) { selectRoom(room.id); navigate("/chat", { replace: true }); }
    } else if (state.orderInfo) {
      setAutoCreated(true);
      const title = `[의뢰] ${state.orderInfo.serviceTitle}`;
      const orderMeta = {
        serviceTitle: state.orderInfo.serviceTitle,
        packageName: state.orderInfo.packageName,
        price: state.orderInfo.price,
        deliveryDays: state.orderInfo.deliveryDays,
        serviceId: state.orderInfo.serviceId,
      };
      const room = await createRoom(title, state.orderInfo.serviceId, orderMeta);
      if (room) {
        selectRoom(room.id);
        const orderMsg = `📋 주문서\n\n서비스: ${state.orderInfo.serviceTitle}\n패키지: ${state.orderInfo.packageName}\n금액: ${state.orderInfo.price?.toLocaleString()}원\n납기: ${state.orderInfo.deliveryDays}일\n\n위 내용으로 의뢰합니다.`;
        setTimeout(async () => { await sendMessage(orderMsg); }, 500);
        navigate("/chat", { replace: true });
      }
    }
  }, [autoCreated, loadingRooms, user, location.state, createRoom, selectRoom, navigate, sendMessage]);

  useEffect(() => { handleAutoCreate(); }, [handleAutoCreate]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (pendingFile) {
      await sendFile(pendingFile, MAX_FILE_SIZE_MB, messageInput.trim() || undefined);
      setPendingFile(null);
      setMessageInput("");
      return;
    }
    if (!messageInput.trim()) return;
    const prefix = replyTo ? `↩️ ${replyTo.message?.slice(0, 30) || "파일"}...\n\n` : "";
    await sendMessage(prefix + messageInput);
    setMessageInput("");
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1) {
      setPendingFile(files[0]);
    } else {
      for (const file of files) { await sendFile(file, MAX_FILE_SIZE_MB); }
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) return;
    const room = await createRoom(newRoomTitle.trim());
    if (room) { selectRoom(room.id); setShowNewRoom(false); setNewRoomTitle(""); }
  };

  const filteredRooms = rooms.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">채팅 문의</h1>
          <Button onClick={() => setShowNewRoom(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> 새 문의</Button>
        </div>

        <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 280px)" }}>
          {/* Room list */}
          <div className="w-80 border-r flex flex-col shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border bg-secondary/50 text-sm focus:outline-none" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingRooms ? (
                <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">채팅방이 없습니다.<br />새 문의를 시작해보세요.</div>
              ) : (
                filteredRooms.map((room) => (
                  <button key={room.id} onClick={() => selectRoom(room.id)}
                    className={`w-full p-4 text-left border-b hover:bg-accent/50 transition-colors ${selectedRoomId === room.id ? "bg-accent" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{room.title}</span>
                      {room.last_message_at && <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTime(room.last_message_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate pr-2">{room.last_message || "새 대화"}</p>
                      {room.unread_customer > 0 && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{room.unread_customer}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages area */}
          <div className={`flex-1 flex flex-col relative ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 pointer-events-none">
                <div className="bg-card rounded-xl px-8 py-6 shadow-lg border text-center">
                  <Paperclip className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                  <p className="text-xs text-muted-foreground mt-1">최대 {MAX_FILE_SIZE_MB}MB</p>
                </div>
              </div>
            )}
            {selectedRoom ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="font-medium text-sm">{selectedRoom.title}</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowFileDrawer(!showFileDrawer)}>
                      <FolderOpen className="h-3.5 w-3.5 mr-1" /> 파일함
                    </Button>
                    {selectedRoom.status === "active" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">진행중</span>}
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex justify-center mb-3">
                          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{group.date}</span>
                        </div>
                        <div className="space-y-3">
                          {group.msgs.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user?.id}
                              onReply={(m) => setReplyTo(m)} roomId={selectedRoomId || undefined} />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                {/* Input area */}
                <div className="p-4 border-t space-y-2">
                  {/* Pending file preview */}
                  {pendingFile && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-xs">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{pendingFile.name}</span>
                      <button onClick={() => setPendingFile(null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  {replyTo && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-xs">
                      <span className="text-muted-foreground">↩️ 답장:</span>
                      <span className="truncate flex-1">{replyTo.message?.slice(0, 50) || "파일"}</span>
                      <button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="파일 첨부">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input type="text" placeholder={pendingFile ? "메시지를 함께 보내세요 (선택)" : "메시지를 입력하세요..."}
                      value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown}
                      className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <Button size="icon" className="rounded-full shrink-0" onClick={handleSend}
                      disabled={!messageInput.trim() && !pendingFile}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">채팅방을 선택하거나 새 문의를 시작하세요</div>
            )}
          </div>

          {/* File Drawer */}
          {selectedRoom && showFileDrawer && (
            <FileDrawer messages={messages} onClose={() => setShowFileDrawer(false)} />
          )}

          {/* Project Panel */}
          {selectedRoom && project && !showFileDrawer && (
            <ProjectPanel project={project} projectFiles={projectFiles} isAdmin={false}
              onConfirmProject={confirmProject} onRequestRevision={requestRevision} />
          )}
        </div>
      </div>

      <Dialog open={showNewRoom} onOpenChange={setShowNewRoom}>
        <DialogContent>
          <DialogHeader><DialogTitle>새 문의 시작</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">문의 제목</label>
            <Input placeholder="예: 로고 디자인 문의" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoom(false)}>취소</Button>
            <Button onClick={handleCreateRoom} disabled={!newRoomTitle.trim()}>시작하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ChatPage;
