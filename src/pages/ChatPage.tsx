import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Plus, FolderOpen, X, Film, MessageCirclePlus } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useChatNotification } from "@/hooks/useChatNotification";
import { useAutoMessages } from "@/hooks/useAutoMessages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectPanel from "@/components/chat/ProjectPanel";
import MessageBubble from "@/components/chat/MessageBubble";
import ImageGroupBubble from "@/components/chat/ImageGroupBubble";
import FileDrawer from "@/components/chat/FileDrawer";
import QuickPhrases from "@/components/chat/QuickPhrases";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ServicePickerDialog from "@/components/chat/ServicePickerDialog";
import { groupMessages } from "@/utils/messageGrouping";

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 100;

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
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoCreated, setAutoCreated] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const { notifyNewMessage, notifyRoomOpen } = useChatNotification();
  const { sendAutoMessage } = useAutoMessages();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    notifyNewMessage(messages, selectedRoomId, user?.id);
  }, [messages, selectedRoomId, user?.id, notifyNewMessage]);

  const handleAutoCreate = useCallback(async () => {
    if (autoCreated || loadingRooms || !user) return;
    const state = location.state as any;
    if (!state) return;
    if (state.openRoomId) {
      setAutoCreated(true);
      selectRoom(state.openRoomId);
      notifyRoomOpen();
      navigate("/chat", { replace: true });
      return;
    }
    if (state.inquiry) {
      setAutoCreated(true);
      const title = `[문의] ${state.inquiry.serviceTitle}`;
      const room = await createRoom(title, state.inquiry.serviceId);
      if (room) {
        selectRoom(room.id);
        notifyRoomOpen();
        await sendAutoMessage(room.id, "new_room");
        navigate("/chat", { replace: true });
      }
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
        notifyRoomOpen();
        const orderMsg = `📋 주문서\n\n서비스: ${state.orderInfo.serviceTitle}\n패키지: ${state.orderInfo.packageName}\n금액: ${state.orderInfo.price?.toLocaleString()}원\n납기: ${state.orderInfo.deliveryDays}일\n\n위 내용으로 의뢰합니다.`;
        setTimeout(async () => { await sendMessage(orderMsg); }, 500);
        await sendAutoMessage(room.id, "order_received");
        navigate("/chat", { replace: true });
      }
    }
  }, [autoCreated, loadingRooms, user, location.state, createRoom, selectRoom, navigate, sendMessage, notifyRoomOpen, sendAutoMessage]);

  useEffect(() => { handleAutoCreate(); }, [handleAutoCreate]);

  // Auto-select first room if none selected and rooms loaded
  useEffect(() => {
    if (!loadingRooms && rooms.length > 0 && !selectedRoomId && !autoCreated) {
      selectRoom(rooms[0].id);
    }
  }, [loadingRooms, rooms, selectedRoomId, autoCreated, selectRoom]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        await sendFile(file, MAX_FILE_SIZE_MB, pendingFiles.length === 1 ? (messageInput.trim() || undefined) : undefined);
      }
      if (pendingFiles.length > 1 && messageInput.trim()) {
        await sendMessage(messageInput.trim());
      }
      setPendingFiles([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    setPendingFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)].slice(0, MAX_FILES));
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) return;
    const room = await createRoom(newRoomTitle.trim());
    if (room) {
      selectRoom(room.id);
      notifyRoomOpen();
      await sendAutoMessage(room.id, "new_room");
      setShowNewRoom(false);
      setNewRoomTitle("");
    }
  };

  const handleServiceSelect = async (service: { id: string; title: string; thumbnail: string | null; seller: string | null; price: number }) => {
    setShowServicePicker(false);
    const title = `[문의] ${service.title}`;
    const room = await createRoom(title, service.id);
    if (room) {
      selectRoom(room.id);
      notifyRoomOpen();
      await sendAutoMessage(room.id, "new_room");
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Group messages by date, then group consecutive images
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

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">채팅 문의</h1>
          <Button onClick={() => setShowServicePicker(true)} className="gap-1.5">
            <MessageCirclePlus className="h-4 w-4" /> 새 문의
          </Button>
        </div>

        <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 280px)" }}>
          {/* Room list */}
          <ChatRoomList
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={selectRoom}
            isAdmin={false}
            loadingRooms={loadingRooms}
          />

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
                          {group.items.map((item, idx) =>
                            item.type === "image_group" ? (
                              <ImageGroupBubble
                                key={item.messages[0].id}
                                messages={item.messages}
                                isMine={item.messages[0].sender_id === user?.id}
                                onReply={(m) => setReplyTo(m)}
                              />
                            ) : (
                              <MessageBubble
                                key={item.msg.id}
                                msg={item.msg}
                                isMine={item.msg.sender_id === user?.id}
                                onReply={(m) => setReplyTo(m)}
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
                {/* Input area */}
                <div className="p-4 border-t space-y-2">
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                      {pendingFiles.map((file, idx) => (
                        <div key={idx} className="relative group/file">
                          {file.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} className="h-16 w-16 object-cover rounded-lg border" />
                          ) : file.type.startsWith("video/") ? (
                            <div className="h-16 w-16 rounded-lg border bg-secondary flex items-center justify-center">
                              <Film className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg border bg-secondary flex flex-col items-center justify-center p-1">
                              <Paperclip className="h-4 w-4 text-muted-foreground mb-0.5" />
                              <span className="text-[9px] text-muted-foreground truncate w-full text-center">{file.name.split(".").pop()}</span>
                            </div>
                          )}
                          <button onClick={() => removePendingFile(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {pendingFiles.length < MAX_FILES && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  )}
                  {replyTo && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-xs">
                      <span className="text-muted-foreground">↩️ 답장:</span>
                      <span className="truncate flex-1">{replyTo.message?.slice(0, 50) || "파일"}</span>
                      <button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="파일 첨부">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    {user && <QuickPhrases userId={user.id} onSelect={(p) => setMessageInput((prev) => prev + p)} />}
                    <input type="text" placeholder={pendingFiles.length > 0 ? "메시지를 함께 보내세요 (선택)" : "메시지를 입력하세요..."}
                      value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown}
                      className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <Button size="icon" className="rounded-full shrink-0" onClick={handleSend}
                      disabled={!messageInput.trim() && pendingFiles.length === 0}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {pendingFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground px-2">{pendingFiles.length}/{MAX_FILES}개 파일 선택됨</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
                <MessageCirclePlus className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="text-muted-foreground font-medium mb-1">채팅방이 없습니다</p>
                  <p className="text-sm text-muted-foreground/70">서비스를 선택하여 새 문의를 시작하세요</p>
                </div>
                <Button onClick={() => setShowServicePicker(true)} className="gap-1.5 mt-2">
                  <MessageCirclePlus className="h-4 w-4" /> 새 문의 시작
                </Button>
              </div>
            )}
          </div>

          {selectedRoom && showFileDrawer && (
            <FileDrawer messages={messages} onClose={() => setShowFileDrawer(false)} />
          )}
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
