import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Plus, FolderOpen, X, Film, Video as VideoIcon, UserCircle, ClipboardList, FileText, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectPanel from "@/components/chat/ProjectPanel";
import MessageBubble from "@/components/chat/MessageBubble";
import ImageGroupBubble from "@/components/chat/ImageGroupBubble";
import FileDrawer from "@/components/chat/FileDrawer";
import QuickPhrases from "@/components/chat/QuickPhrases";
import { useChatNotification } from "@/hooks/useChatNotification";
import AdminInfoPanel from "@/components/chat/AdminInfoPanel";
import ChatRoomList from "@/components/chat/ChatRoomList";
import { groupMessages } from "@/utils/messageGrouping";
import RequestTypeDialog from "@/components/chat/RequestTypeDialog";
import QuoteDialog from "@/components/chat/QuoteDialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const MAX_FILES = 10;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

const AdminChat = () => {
  const {
    rooms, selectedRoomId, messages, loadingRooms,
    selectRoom, sendMessage, sendFile, sendConfirmVideo, sendFeedbackRequest, user,
    project, projectFiles,
    createProjectFromChat, updateProjectStatus, uploadDeliverable,
    sendQuote, confirmPayment, sendPurchaseConfirmRequest,
  } = useChat();

  const { t } = useTranslation();
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [showRequestType, setShowRequestType] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [videoUploadType, setVideoUploadType] = useState<"general" | "confirm">("general");
  const [showVideoTypeDialog, setShowVideoTypeDialog] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    serviceTitle: "", packageName: "", price: 0, deliveryDays: 7, notes: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifyNewMessage, notifyRoomOpen } = useChatNotification();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    notifyNewMessage(messages, selectedRoomId, user?.id);
  }, [messages, selectedRoomId, user?.id, notifyNewMessage]);

  const handleSend = async () => {
    try {
      if (pendingFiles.length > 0) {
        if (isFeedbackMode) {
          await sendFeedbackRequest(input.trim() || "", pendingFiles);
          setPendingFiles([]);
          setInput("");
          setIsFeedbackMode(false);
          toast.success("피드백 요청이 전송되었습니다.");
          return;
        }
        for (const file of pendingFiles) {
          await sendFile(file, 0, pendingFiles.length === 1 ? (input.trim() || undefined) : undefined);
        }
        if (pendingFiles.length > 1 && input.trim()) {
          await sendMessage(input.trim());
        }
        setPendingFiles([]);
        setInput("");
        return;
      }
      if (!input.trim()) return;
      const prefix = replyTo ? `↩️ ${replyTo.message?.slice(0, 30) || "파일"}...\n\n` : "";
      await sendMessage(prefix + input);
      setInput("");
      setReplyTo(null);
    } catch (err) {
      console.error("Send error:", err);
      toast.error("메시지 전송에 실패했습니다.", { description: "네트워크 상태를 확인해주세요." });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    if (files.length === 1 && files[0].type.startsWith("video/")) {
      setPendingVideoFile(files[0]);
      setShowVideoTypeDialog(true);
      return;
    }
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoTypeConfirm = async () => {
    if (!pendingVideoFile) return;
    setShowVideoTypeDialog(false);
    if (videoUploadType === "confirm") {
      await sendConfirmVideo(pendingVideoFile, input.trim() || undefined);
      setInput("");
    } else {
      setPendingFiles((prev) => [...prev, pendingVideoFile].slice(0, MAX_FILES));
    }
    setPendingVideoFile(null);
    setVideoUploadType("general");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 1 && files[0].type.startsWith("video/")) {
      setPendingVideoFile(files[0]);
      setShowVideoTypeDialog(true);
      return;
    }
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

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

  const handleCreateProject = async () => {
    if (!selectedRoom || !newProject.serviceTitle.trim()) return;
    try {
      const result = await createProjectFromChat({
        serviceTitle: newProject.serviceTitle,
        packageName: newProject.packageName || undefined,
        price: newProject.price,
        deliveryDays: newProject.deliveryDays,
        customerName: selectedRoom.title,
        customerId: selectedRoom.customer_id,
        notes: newProject.notes || undefined,
      });
      if (result) {
        toast.success("제작 요청이 전송되었습니다.", { description: "프로젝트 관리에서 확인할 수 있습니다." });
      } else {
        toast.error("프로젝트 생성에 실패했습니다.");
      }
      setShowCreateProject(false);
      setNewProject({ serviceTitle: "", packageName: "", price: 0, deliveryDays: 7, notes: "" });
    } catch (err) {
      console.error(err);
      toast.error("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  const handleFeedbackRequest = () => {
    setIsFeedbackMode(true);
    toast.info("피드백 요청 모드가 활성화되었습니다.", { description: "파일을 첨부하고 메시지를 입력한 후 전송하세요." });
  };

  const handleProductionRequest = () => {
    if (!selectedRoom) return;
    const meta = selectedRoom?.metadata as any;
    if (meta?.serviceTitle) {
      setNewProject({ serviceTitle: meta.serviceTitle || "", packageName: meta.packageName || "", price: meta.price || 0, deliveryDays: meta.deliveryDays || 7, notes: "" });
    } else {
      setNewProject({ serviceTitle: "", packageName: "", price: 0, deliveryDays: 7, notes: "" });
    }
    setShowCreateProject(true);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">채팅 관리</h1>
      <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 200px)" }}>
        {/* Room list */}
        <ChatRoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={selectRoom}
          isAdmin={true}
          loadingRooms={loadingRooms}
        />

        {/* Messages */}
        <div className={`flex-1 flex flex-col relative ${isDragging ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 pointer-events-none">
              <div className="bg-card rounded-xl px-8 py-6 shadow-lg border text-center">
                <Paperclip className="h-10 w-10 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                <p className="text-xs text-muted-foreground mt-1">용량 제한 없음</p>
              </div>
            </div>
          )}
          {selectedRoom ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <span className="font-medium text-sm">{selectedRoom.title}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setShowFileDrawer(!showFileDrawer); setShowInfoPanel(false); }}>
                    <FolderOpen className="h-3.5 w-3.5 mr-1" /> 파일함
                  </Button>
                  <Button size="sm" variant={showInfoPanel ? "secondary" : "ghost"} className="text-xs h-7" onClick={() => { setShowInfoPanel(!showInfoPanel); setShowFileDrawer(false); }}>
                    <UserCircle className="h-3.5 w-3.5 mr-1" /> 정보
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowQuoteDialog(true)}>
                    <FileText className="h-3.5 w-3.5 mr-1" /> 견적서
                  </Button>
                  {project && (project.status === "검수중" || project.status === "완료") && project.confirm_status !== "확인완료" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => sendPurchaseConfirmRequest()}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> 구매확정요청
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowRequestType(true)}>
                    <ClipboardList className="h-3.5 w-3.5 mr-1" /> 요청하기
                  </Button>
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
                        {group.items.map((item) =>
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
                              isAdmin={true}
                              paymentStatus={project?.payment_status}
                              onConfirmPayment={confirmPayment}
                              currentUserId={user?.id}
                              serviceId={selectedRoom?.service_id || undefined}
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
                  <>
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
                    <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFeedbackMode}
                        onChange={(e) => setIsFeedbackMode(e.target.checked)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className={`text-xs font-medium ${isFeedbackMode ? "text-amber-600" : "text-muted-foreground"}`}>
                        📝 피드백 요청으로 전송
                      </span>
                    </label>
                  </>
                )}
                {replyTo && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-xs">
                    <span className="text-muted-foreground">↩️ 답장:</span>
                    <span className="truncate flex-1">{replyTo.message?.slice(0, 50) || "파일"}</span>
                    <button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  {user && <QuickPhrases userId={user.id} onSelect={(p) => setInput((prev) => prev + p)} />}
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={isFeedbackMode ? "피드백 요청 메시지 (선택)" : pendingFiles.length > 0 ? "메시지를 함께 보내세요 (선택)" : "답변을 입력하세요..."}
                    rows={1}
                    className={`flex-1 min-h-[40px] max-h-[120px] px-4 py-2 rounded-2xl border text-sm focus:outline-none focus:ring-2 resize-none ${
                      isFeedbackMode ? "border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 focus:ring-amber-400/30" : "bg-secondary/50 focus:ring-primary/30"
                    }`}
                    style={{ height: "auto", overflow: "hidden" }}
                    onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
                  />
                  <Button size="icon" className={`rounded-full shrink-0 ${isFeedbackMode ? "bg-amber-500 hover:bg-amber-600" : ""}`} onClick={handleSend} disabled={!input.trim() && pendingFiles.length === 0}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {pendingFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground px-2">{pendingFiles.length}/{MAX_FILES}개 파일 선택됨</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">채팅방을 선택하세요</div>
          )}
        </div>

        {selectedRoom && showFileDrawer && !showInfoPanel && (
          <FileDrawer messages={messages} onClose={() => setShowFileDrawer(false)} />
        )}
        {selectedRoom && showInfoPanel && !showFileDrawer && user && (
          <AdminInfoPanel customerId={selectedRoom.customer_id} roomId={selectedRoom.id} currentUserId={user.id} metadata={selectedRoom.metadata} />
        )}
        {selectedRoom && project && !showFileDrawer && !showInfoPanel && (
          <ProjectPanel project={project} projectFiles={projectFiles} isAdmin={true}
            onUpdateStatus={updateProjectStatus} onUploadDeliverable={uploadDeliverable}
            onSendQuote={() => setShowQuoteDialog(true)}
            onConfirmPayment={confirmPayment}
            onSendPurchaseConfirmRequest={sendPurchaseConfirmRequest}
          />
        )}
      </div>

      {/* Video type selection dialog */}
      <Dialog open={showVideoTypeDialog} onOpenChange={setShowVideoTypeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>영상 업로드 유형</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">업로드할 영상의 유형을 선택해주세요.</p>
            <Select value={videoUploadType} onValueChange={(v) => setVideoUploadType(v as "general" | "confirm")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex items-center gap-2"><Film className="h-4 w-4" /> 일반 영상</div>
                </SelectItem>
                <SelectItem value="confirm">
                  <div className="flex items-center gap-2"><VideoIcon className="h-4 w-4" /> 컨펌 요청 영상</div>
                </SelectItem>
              </SelectContent>
            </Select>
            {videoUploadType === "confirm" && (
              <p className="text-xs text-muted-foreground bg-amber-50 text-amber-700 p-2 rounded">
                컨펌 요청 영상은 사용자가 타임스탬프별로 수정 코멘트를 달 수 있습니다.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowVideoTypeDialog(false); setPendingVideoFile(null); }}>취소</Button>
            <Button onClick={handleVideoTypeConfirm}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create project dialog - enhanced with customer requirements */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0"><DialogTitle>제작 시작 (프로젝트 생성)</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {/* Customer order request info */}
              {(() => {
                const meta = selectedRoom?.metadata as any;
                const req = meta?.orderRequest;
                if (!req && !meta?.serviceTitle) return null;
                return (
                  <div className="rounded-lg border bg-accent/30 p-3 space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground">📋 고객 의뢰 요청사항</h4>
                    {req?.subject && <p className="text-xs">주제: {req.subject}</p>}
                    {req?.refUrl && <p className="text-xs">참고 URL: <a href={req.refUrl} target="_blank" className="text-primary underline">{req.refUrl}</a></p>}
                    {req?.productionTime && <p className="text-xs">제작시간(편당): {req.productionTime}</p>}
                    {req?.videoTime && <p className="text-xs">영상시간: {req.videoTime}</p>}
                    {req?.quantity && <p className="text-xs">제작 수량: {req.quantity}</p>}
                    {req?.llmOwned && <p className="text-xs">LLM 보유: {req.llmOwned}</p>}
                    {req?.pcMemory && <p className="text-xs">PC 메모리: {req.pcMemory}</p>}
                    {req?.aiAgentExp && <p className="text-xs">AI에이전트 경험: {req.aiAgentExp}</p>}
                    {req?.description && <p className="text-xs border-t pt-1.5 mt-1.5">상세: {req.description}</p>}
                  </div>
                );
              })()}

              <div>
                <label className="text-sm font-medium mb-1 block">서비스명 *</label>
                <Input value={newProject.serviceTitle} onChange={(e) => setNewProject(p => ({ ...p, serviceTitle: e.target.value }))} placeholder="예: AI 이미지 제작" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">패키지명</label>
                <Input value={newProject.packageName} onChange={(e) => setNewProject(p => ({ ...p, packageName: e.target.value }))} placeholder="예: 프리미엄" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">금액 (원)</label>
                  <Input type="number" value={newProject.price} onChange={(e) => setNewProject(p => ({ ...p, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">납기 (일)</label>
                  <Input type="number" value={newProject.deliveryDays} onChange={(e) => setNewProject(p => ({ ...p, deliveryDays: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">관리자 메모 (제작팀 전달사항)</label>
                <Textarea
                  value={newProject.notes || ""}
                  onChange={(e) => setNewProject(p => ({ ...p, notes: e.target.value }))}
                  placeholder="제작 시 유의사항이나 특이사항을 입력하세요..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>취소</Button>
            <Button onClick={handleCreateProject} disabled={!newProject.serviceTitle.trim()}>🚀 제작 시작</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request type selection dialog */}
      <RequestTypeDialog
        open={showRequestType}
        onOpenChange={setShowRequestType}
        onSelectFeedback={handleFeedbackRequest}
        onSelectProduction={handleProductionRequest}
      />

      {/* Quote dialog */}
      <QuoteDialog
        open={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        onSubmit={async (q) => { await sendQuote(q); }}
        defaultServiceTitle={(() => { const meta = selectedRoom?.metadata as any; return meta?.serviceTitle || ""; })()}
        defaultPrice={(() => { const meta = selectedRoom?.metadata as any; return meta?.price || 0; })()}
        defaultDeliveryDays={(() => { const meta = selectedRoom?.metadata as any; return meta?.deliveryDays || 7; })()}
      />
    </AdminLayout>
  );
};

export default AdminChat;
