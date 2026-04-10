import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Search, Plus, FolderOpen, X, Film, Video as VideoIcon } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectPanel from "@/components/chat/ProjectPanel";
import MessageBubble from "@/components/chat/MessageBubble";
import FileDrawer from "@/components/chat/FileDrawer";
import QuickPhrases from "@/components/chat/QuickPhrases";
import { useChatNotification } from "@/hooks/useChatNotification";

const MAX_FILES = 10;

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

const AdminChat = () => {
  const {
    rooms, selectedRoomId, messages, loadingRooms,
    selectRoom, sendMessage, sendFile, sendConfirmVideo, user,
    project, projectFiles,
    createProjectFromChat, updateProjectStatus, uploadDeliverable,
  } = useChat();

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [videoUploadType, setVideoUploadType] = useState<"general" | "confirm">("general");
  const [showVideoTypeDialog, setShowVideoTypeDialog] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    serviceTitle: "", packageName: "", price: 0, deliveryDays: 7,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifyNewMessage, notifyRoomOpen } = useChatNotification();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Notification on new messages
  useEffect(() => {
    notifyNewMessage(messages, selectedRoomId, user?.id);
  }, [messages, selectedRoomId, user?.id, notifyNewMessage]);

  const handleSend = async () => {
    if (pendingFiles.length > 0) {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    // If single video, ask type
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
    e.preventDefault();
    setIsDragging(false);
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
  const filteredRooms = rooms.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else groupedMessages.push({ date, msgs: [msg] });
  });

  const handleCreateProject = async () => {
    if (!selectedRoom || !newProject.serviceTitle.trim()) return;
    await createProjectFromChat({
      serviceTitle: newProject.serviceTitle,
      packageName: newProject.packageName || undefined,
      price: newProject.price,
      deliveryDays: newProject.deliveryDays,
      customerName: selectedRoom.title,
      customerId: selectedRoom.customer_id,
    });
    setShowCreateProject(false);
    setNewProject({ serviceTitle: "", packageName: "", price: 0, deliveryDays: 7 });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">채팅 관리</h1>
      <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 200px)" }}>
        {/* Room list */}
        <div className="w-72 border-r flex flex-col shrink-0">
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
              <div className="p-4 text-center text-sm text-muted-foreground">채팅이 없습니다</div>
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
                    {room.unread_admin > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{room.unread_admin}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

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
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowFileDrawer(!showFileDrawer)}>
                    <FolderOpen className="h-3.5 w-3.5 mr-1" /> 파일함
                  </Button>
                  {!project && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                      const meta = selectedRoom?.metadata as any;
                      if (meta?.serviceTitle) {
                        setNewProject({ serviceTitle: meta.serviceTitle || "", packageName: meta.packageName || "", price: meta.price || 0, deliveryDays: meta.deliveryDays || 7 });
                      } else {
                        setNewProject({ serviceTitle: "", packageName: "", price: 0, deliveryDays: 7 });
                      }
                      setShowCreateProject(true);
                    }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> 프로젝트 생성
                    </Button>
                  )}
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
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={pendingFile ? "메시지를 함께 보내세요 (선택)" : "답변을 입력하세요..."}
                    className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!input.trim() && !pendingFile}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">채팅방을 선택하세요</div>
          )}
        </div>

        {/* File Drawer */}
        {selectedRoom && showFileDrawer && (
          <FileDrawer messages={messages} onClose={() => setShowFileDrawer(false)} />
        )}

        {/* Project Panel */}
        {selectedRoom && project && !showFileDrawer && (
          <ProjectPanel project={project} projectFiles={projectFiles} isAdmin={true}
            onUpdateStatus={updateProjectStatus} onUploadDeliverable={uploadDeliverable} />
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

      {/* Create project dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader><DialogTitle>프로젝트 생성</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProject(false)}>취소</Button>
            <Button onClick={handleCreateProject} disabled={!newProject.serviceTitle.trim()}>생성하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminChat;
