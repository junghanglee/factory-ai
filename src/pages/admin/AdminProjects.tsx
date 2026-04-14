import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Eye, FileText, Download, Send, MessageSquare, Copy, ChevronDown, Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { smartCompress } from "@/utils/imageCompression";

interface ProjectRow {
  id: string;
  order_number: string;
  service_title: string;
  package_name: string | null;
  customer: string;
  customer_id: string | null;
  price: number;
  status: string;
  confirm_status: string;
  order_date: string;
  due_date: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectFileRow {
  id: string;
  project_id: string;
  name: string;
  url: string;
  uploaded_at: string;
}

interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  comment: string;
  created_at: string;
}

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const statusColors: Record<string, string> = {
  "대기": "bg-secondary text-muted-foreground",
  "작업중": "bg-blue-100 text-blue-700",
  "검수중": "bg-amber-100 text-amber-700",
  "수정중": "bg-orange-100 text-orange-700",
  "수정요청": "bg-red-100 text-red-700",
  "완료": "bg-green-100 text-green-700",
  "취소": "bg-gray-200 text-gray-500",
};

const confirmColors: Record<string, string> = {
  "-": "text-muted-foreground",
  "대기": "bg-amber-100 text-amber-700",
  "확인완료": "bg-green-100 text-green-700",
  "수정요청": "bg-red-100 text-red-700",
};

const allStatuses = ["대기", "작업중", "검수중", "수정중", "완료", "취소"];

const AdminProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFileRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sendingToChat, setSendingToChat] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [linkedRoomId, setLinkedRoomId] = useState<string | null>(null);
  const [feedbackRequests, setFeedbackRequests] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjects(data as ProjectRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel("admin_projects_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchProjects())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchProjects]);

  const fetchProjectDetails = useCallback(async (project: ProjectRow) => {
    // Fetch files
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", project.id)
      .order("uploaded_at", { ascending: false });
    setProjectFiles((files || []) as ProjectFileRow[]);

    // Fetch linked chat room
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("project_id", project.id)
      .limit(1);
    setLinkedRoomId(rooms && rooms.length > 0 ? rooms[0].id : null);

    // Fetch feedback requests from linked room
    if (rooms && rooms.length > 0) {
      const { data: fb } = await supabase
        .from("feedback_requests")
        .select("*")
        .eq("room_id", rooms[0].id)
        .order("created_at", { ascending: false });
      setFeedbackRequests(fb || []);
    } else {
      setFeedbackRequests([]);
    }

    // Fetch comments (stored in admin_notes with room_id = project.id for now, or we use notes field)
    setComments([]);
  }, []);

  const openDetail = async (p: ProjectRow) => {
    setSelectedProject(p);
    setDetailOpen(true);
    await fetchProjectDetails(p);
  };

  const changeStatus = async (id: string, status: string) => {
    await supabase.from("projects").update({ status }).eq("id", id);
    if (selectedProject?.id === id) {
      setSelectedProject({ ...selectedProject, status });
    }
    toast.success(`상태가 "${status}"(으)로 변경되었습니다.`);
  };

  const handleUploadDeliverable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject || !user) return;
    e.target.value = "";
    setUploading(true);
    try {
      const compressed = await smartCompress(file, "detail");
      const ext = compressed.name.split(".").pop();
      const path = `deliverables/${selectedProject.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

      await supabase.from("project_files").insert({
        project_id: selectedProject.id,
        name: file.name,
        url: urlData.publicUrl,
      });

      toast.success("파일이 업로드되었습니다.");
      await fetchProjectDetails(selectedProject);
    } catch (err) {
      console.error(err);
      toast.error("업로드 실패");
    }
    setUploading(false);
  };

  const sendDeliverableToChat = async (file: ProjectFileRow) => {
    if (!linkedRoomId || !user) {
      toast.error("연결된 채팅방이 없습니다.");
      return;
    }
    setSendingToChat(true);
    try {
      await supabase.from("chat_messages").insert({
        room_id: linkedRoomId,
        sender_id: user.id,
        message: `📦 결과물 납품: ${file.name}`,
        message_type: "file",
        file_url: file.url,
        file_name: file.name,
        file_type: "",
        file_size: 0,
      });
      await supabase.from("chat_rooms").update({
        last_message: `📦 결과물 납품: ${file.name}`,
        last_message_at: new Date().toISOString(),
      }).eq("id", linkedRoomId);
      toast.success("채팅으로 전송되었습니다.");
    } catch (err) {
      console.error(err);
      toast.error("전송 실패");
    }
    setSendingToChat(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("복사되었습니다.");
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">제작/납품 관리</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">주문번호</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">서비스</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">패키지</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">고객</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">금액</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">납기일</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">상태</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">확인</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">파일</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />로딩 중...
                  </td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">프로젝트가 없습니다</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="p-4 font-medium font-mono text-xs">{project.order_number}</td>
                      <td className="p-4 truncate max-w-[180px]">{project.service_title}</td>
                      <td className="p-4">
                        {project.package_name && (
                          <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">{project.package_name}</span>
                        )}
                      </td>
                      <td className="p-4">{project.customer}</td>
                      <td className="p-4">₩{formatPrice(project.price)}</td>
                      <td className="p-4">{new Date(project.due_date).toLocaleDateString("ko-KR")}</td>
                      <td className="p-4">
                        <select
                          className="text-xs border rounded px-2 py-1 bg-background"
                          value={project.status}
                          onChange={(e) => changeStatus(project.id, e.target.value)}
                        >
                          {allStatuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confirmColors[project.confirm_status] || "text-muted-foreground"}`}>
                          {project.confirm_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs">-</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              프로젝트 상세
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => selectedProject && copyToClipboard(
                `주문번호: ${selectedProject.order_number}\n서비스: ${selectedProject.service_title}\n고객: ${selectedProject.customer}\n금액: ₩${formatPrice(selectedProject.price)}\n납기일: ${selectedProject.due_date}`
              )}>
                <Copy className="h-3 w-3 mr-1" /> 복사
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-5 py-4">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">주문번호:</span> <span className="font-mono font-medium">{selectedProject.order_number}</span></div>
                  <div><span className="text-muted-foreground">고객:</span> {selectedProject.customer}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">서비스:</span> {selectedProject.service_title}</div>
                  {selectedProject.package_name && (
                    <div><span className="text-muted-foreground">패키지:</span> {selectedProject.package_name}</div>
                  )}
                  <div><span className="text-muted-foreground">금액:</span> ₩{formatPrice(selectedProject.price)}</div>
                  <div><span className="text-muted-foreground">주문일:</span> {new Date(selectedProject.order_date).toLocaleDateString("ko-KR")}</div>
                  <div><span className="text-muted-foreground">납기일:</span> {new Date(selectedProject.due_date).toLocaleDateString("ko-KR")}</div>
                  {selectedProject.completed_date && (
                    <div><span className="text-muted-foreground">완료일:</span> {new Date(selectedProject.completed_date).toLocaleDateString("ko-KR")}</div>
                  )}
                </div>

                {/* Status timeline */}
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium">상태</Label>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {allStatuses.slice(0, 5).map((s, idx) => {
                      const currentIdx = allStatuses.indexOf(selectedProject.status);
                      const isPast = idx <= currentIdx && selectedProject.status !== "취소";
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${isPast ? "bg-primary" : "bg-secondary"}`} />
                          <span className={`text-xs ${isPast ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
                          {idx < 4 && <div className={`w-6 h-0.5 ${isPast ? "bg-primary" : "bg-secondary"}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <select
                    className="mt-2 text-xs border rounded px-2 py-1 bg-background"
                    value={selectedProject.status}
                    onChange={(e) => {
                      changeStatus(selectedProject.id, e.target.value);
                      setSelectedProject({ ...selectedProject, status: e.target.value });
                    }}
                  >
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium">메모</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProject.notes || "메모 없음"}</p>
                </div>

                {/* Deliverable files */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">납품 파일 ({projectFiles.length})</Label>
                    <div>
                      <input type="file" ref={uploadFileRef} onChange={handleUploadDeliverable} className="hidden" />
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => uploadFileRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        업로드
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {projectFiles.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">업로드된 파일이 없습니다</p>
                    ) : (
                      projectFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-sm p-2 bg-secondary/50 rounded">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(file.uploaded_at).toLocaleDateString("ko-KR")}
                          </span>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                          </a>
                          {linkedRoomId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs gap-1 px-2"
                              onClick={() => sendDeliverableToChat(file)}
                              disabled={sendingToChat}
                            >
                              <Send className="h-3 w-3" /> 채팅전송
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Feedback requests */}
                {feedbackRequests.length > 0 && (
                  <div className="border-t pt-3">
                    <Label className="text-sm font-medium">고객 피드백 ({feedbackRequests.length})</Label>
                    <div className="space-y-2 mt-2">
                      {feedbackRequests.map((fb) => (
                        <div key={fb.id} className="p-3 rounded-lg border bg-background text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={fb.status === "pending" ? "destructive" : "secondary"} className="text-[10px]">
                              {fb.status === "pending" ? "대기중" : "응답완료"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(fb.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-sm">{fb.request_text}</p>
                          {fb.response_text && (
                            <p className="text-xs text-muted-foreground mt-1 border-t pt-1">응답: {fb.response_text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat link */}
                {linkedRoomId && (
                  <div className="border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => window.open(`/admin/chat`, "_self")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> 채팅방으로 이동
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProjects;
