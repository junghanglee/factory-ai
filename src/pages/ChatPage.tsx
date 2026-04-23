import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Paperclip, Plus, FolderOpen, X, Film, MessageCirclePlus, ClipboardList, Star, Clock, Search, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/utils/formatPrice";
import MainLayout from "@/components/layout/MainLayout";
import MyPageSubNav from "@/components/layout/MyPageSubNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useChatNotification } from "@/hooks/useChatNotification";
import { useAutoMessages } from "@/hooks/useAutoMessages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectPanel from "@/components/chat/ProjectPanel";
import MessageBubble from "@/components/chat/MessageBubble";
import ImageGroupBubble from "@/components/chat/ImageGroupBubble";
import FileDrawer from "@/components/chat/FileDrawer";
import QuickPhrases from "@/components/chat/QuickPhrases";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ServicePickerDialog from "@/components/chat/ServicePickerDialog";
import { groupMessages } from "@/utils/messageGrouping";
import OrderRequestTab from "@/components/chat/OrderRequestTab";
import { useCategories, useServices } from "@/hooks/useSupabaseData";

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 100;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

const ChatPage = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    rooms, selectedRoomId, messages, loadingRooms,
    selectRoom, sendMessage, sendFile, createRoom,
    project, projectFiles, confirmProject, requestRevision,
    confirmPurchase,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [showOrderInfo, setShowOrderInfo] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoCreated, setAutoCreated] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const { notifyNewMessage, notifyRoomOpen } = useChatNotification();
  const { sendAutoMessage } = useAutoMessages();
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  // Track pending feedback requests for the selected room
  useEffect(() => {
    if (!selectedRoomId) { setPendingFeedbackCount(0); return; }
    const fetchPending = async () => {
      const { count } = await supabase
        .from("feedback_requests")
        .select("id", { count: "exact", head: true })
        .eq("room_id", selectedRoomId)
        .eq("status", "pending");
      setPendingFeedbackCount(count || 0);
    };
    fetchPending();
    const channel = supabase
      .channel(`feedback_badge_${selectedRoomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback_requests", filter: `room_id=eq.${selectedRoomId}` }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedRoomId]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

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
      const orderMeta: Record<string, any> = {
        serviceTitle: state.orderInfo.serviceTitle,
        packageName: state.orderInfo.packageName,
        price: state.orderInfo.price,
        deliveryDays: state.orderInfo.deliveryDays,
        serviceId: state.orderInfo.serviceId,
      };
      if (state.orderInfo.orderRequest) {
        orderMeta.orderRequest = state.orderInfo.orderRequest;
      }
      const room = await createRoom(title, state.orderInfo.serviceId, orderMeta);
      if (room) {
        selectRoom(room.id);
        notifyRoomOpen();
        // Build detailed order message
        const req = state.orderInfo.orderRequest;
        let orderMsg = `📋 의뢰 요청서\n\n서비스: ${state.orderInfo.serviceTitle}\n패키지: ${state.orderInfo.packageName}\n금액: ${state.orderInfo.price?.toLocaleString()}원\n납기: ${state.orderInfo.deliveryDays}일`;
        if (req) {
          if (req.subject) orderMsg += `\n주제: ${req.subject}`;
          if (req.refUrl) orderMsg += `\n참고 URL: ${req.refUrl}`;
          if (req.productionTime) orderMsg += `\n제작시간(편당): ${req.productionTime}`;
          if (req.videoTime) orderMsg += `\n영상시간: ${req.videoTime}`;
          if (req.quantity) orderMsg += `\n제작 수량: ${req.quantity}`;
          if (req.llmOwned) orderMsg += `\nLLM 보유: ${req.llmOwned}`;
          if (req.pcMemory) orderMsg += `\nPC 메모리: ${req.pcMemory}`;
          if (req.aiAgentExp) orderMsg += `\nAI에이전트 경험: ${req.aiAgentExp}`;
          if (req.description) orderMsg += `\n\n상세설명:\n${req.description}`;
        }
        orderMsg += "\n\n위 내용으로 의뢰합니다.";
        // Send message and files using room.id directly to avoid stale closure
        await sendMessage(orderMsg, room.id);
        const orderFiles: File[] = state.orderInfo.files || [];
        for (const file of orderFiles) {
          await sendFile(file, 100, undefined, room.id);
        }
        await sendAutoMessage(room.id, "order_received");
        navigate("/chat", { replace: true });
      }
    } else if (state.quoteRequest) {
      setAutoCreated(true);
      const qr = state.quoteRequest;
      const title = `[견적요청] ${qr.serviceTitle}`;
      const quoteMeta: Record<string, any> = {
        serviceTitle: qr.serviceTitle,
        packageName: qr.packageName,
        deliveryDays: qr.deliveryDays,
        type: "quote_request",
      };
      const room = await createRoom(title, qr.serviceId, quoteMeta);
      if (room) {
        selectRoom(room.id);
        notifyRoomOpen();
        let quoteMsg = `📝 견적 요청\n\n서비스: ${qr.serviceTitle}\n패키지: ${qr.packageName}\n희망 납기: ${qr.deliveryDays}일`;
        if (qr.features && qr.features.length > 0) {
          quoteMsg += `\n\n포함 항목:\n${qr.features.map((f: string) => `• ${f}`).join("\n")}`;
        }
        quoteMsg += "\n\n맞춤 견적을 요청합니다. 상세 내용과 가격을 안내해 주세요.";
        await sendMessage(quoteMsg, room.id);
        await sendAutoMessage(room.id, "new_room");
        navigate("/chat", { replace: true });
      }
    }
  }, [autoCreated, loadingRooms, user, location.state, createRoom, selectRoom, navigate, sendMessage, sendFile, notifyRoomOpen, sendAutoMessage]);

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
          <h1 className="text-2xl font-bold">{t("chat.title")}</h1>
          <Button onClick={() => setShowServicePicker(true)} className="gap-1.5">
            <MessageCirclePlus className="h-4 w-4" /> {t("chat.newInquiry")}
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
                  <p className="text-sm font-medium">{t("chat.dropFiles")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("chat.maxSize", { size: MAX_FILE_SIZE_MB })}</p>
                </div>
              </div>
            )}
            {selectedRoom ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="font-medium text-sm">{selectedRoom.title}</span>
                   <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setShowFileDrawer(!showFileDrawer); setShowOrderInfo(false); }}>
                      <FolderOpen className="h-3.5 w-3.5 mr-1" /> {t("chat.fileBox")}
                    </Button>
                    <Button size="sm" variant={showOrderInfo ? "secondary" : "ghost"} className="text-xs h-7 relative" onClick={() => { setShowOrderInfo(!showOrderInfo); setShowFileDrawer(false); }}>
                      <ClipboardList className="h-3.5 w-3.5 mr-1" /> {t("chat.requirements")}
                      {pendingFeedbackCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                          {pendingFeedbackCount}
                        </span>
                      )}
                    </Button>
                    {selectedRoom.status === "active" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t("chat.inProgress")}</span>}
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
                                isAdmin={false}
                                paymentStatus={project?.payment_status}
                                onConfirmPurchase={confirmPurchase}
                                currentUserId={user?.id}
                                serviceId={selectedRoom?.service_id || undefined}
                                projectId={project?.id}
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
                    <textarea placeholder={pendingFiles.length > 0 ? "메시지를 함께 보내세요 (선택)" : "메시지를 입력하세요..."}
                      value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown}
                      rows={1}
                      className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 rounded-2xl border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      style={{ height: "auto", overflow: "hidden" }}
                      onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
                    />
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
              <InlineServicePicker onSelectService={handleServiceSelect} />
            )}
          </div>

          {selectedRoom && showFileDrawer && !showOrderInfo && (
            <FileDrawer messages={messages} onClose={() => setShowFileDrawer(false)} />
          )}
          {selectedRoom && showOrderInfo && !showFileDrawer && (
            <div className="w-80 border-l flex flex-col shrink-0 bg-card">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-sm font-semibold">요청사항</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowOrderInfo(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <OrderRequestTab metadata={selectedRoom.metadata as Record<string, any> | null} roomId={selectedRoom.id} />
            </div>
          )}
          {selectedRoom && project && !showFileDrawer && !showOrderInfo && (
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

      <ServicePickerDialog
        open={showServicePicker}
        onOpenChange={setShowServicePicker}
        onSelectService={handleServiceSelect}
      />
    </MainLayout>
  );
};


function InlineServicePicker({ onSelectService }: { onSelectService: (service: any) => void }) {
  const { data: categories = [] } = useCategories();
  const { data: allServices = [] } = useServices();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    let list = allServices;
    if (selectedCategoryId) list = list.filter((s) => s.category_id === selectedCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.seller?.toLowerCase().includes(q));
    }
    return list;
  }, [allServices, selectedCategoryId, searchQuery]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Step header */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
          <h3 className="text-base font-semibold">상담할 서비스를 선택해주세요</h3>
        </div>
        <p className="text-xs text-muted-foreground ml-10">원하시는 서비스를 선택하면 전문 상담사와 1:1 채팅이 시작됩니다.</p>
      </div>

      {/* Search + Category filters */}
      <div className="px-6 py-3 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="서비스명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !selectedCategoryId
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Service list */}
      <ScrollArea className="flex-1 px-6 py-4">
        {filteredServices.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelectService({
                  id: service.id,
                  title: service.title,
                  thumbnail: service.thumbnail,
                  seller: service.seller,
                  price: service.price,
                  rating: service.rating,
                  review_count: service.review_count,
                  delivery_days: service.delivery_days,
                })}
                className="flex gap-3 p-3 border rounded-xl text-left hover:border-primary/40 hover:shadow-md transition-all group bg-card"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <img
                    src={service.thumbnail || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {service.seller && <p className="text-[11px] text-muted-foreground mb-0.5">{service.seller}</p>}
                    <h4 className="text-sm font-medium line-clamp-2 leading-tight">{service.title}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{service.rating}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />{service.delivery_days}일
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-primary">{formatPrice(service.price, (service as any).price_usd)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default ChatPage;
