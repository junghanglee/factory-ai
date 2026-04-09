import { useState } from "react";
import { Package, Clock, CheckCircle, Edit3, FileText, Download, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Project, ProjectFile } from "@/hooks/useChat";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  "대기": { color: "bg-muted text-muted-foreground", icon: <Clock className="h-3.5 w-3.5" /> },
  "작업중": { color: "bg-blue-100 text-blue-700", icon: <Edit3 className="h-3.5 w-3.5" /> },
  "검수중": { color: "bg-amber-100 text-amber-700", icon: <Package className="h-3.5 w-3.5" /> },
  "수정중": { color: "bg-orange-100 text-orange-700", icon: <Edit3 className="h-3.5 w-3.5" /> },
  "완료": { color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

interface ProjectPanelProps {
  project: Project;
  projectFiles: ProjectFile[];
  isAdmin: boolean;
  onUpdateStatus?: (status: string) => Promise<void>;
  onUploadDeliverable?: (file: File) => Promise<void>;
  onConfirmProject?: () => Promise<void>;
  onRequestRevision?: (reason: string) => Promise<void>;
}

export default function ProjectPanel({
  project,
  projectFiles,
  isAdmin,
  onUpdateStatus,
  onUploadDeliverable,
  onConfirmProject,
  onRequestRevision,
}: ProjectPanelProps) {
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const sc = statusConfig[project.status] || statusConfig["대기"];
  const statuses = ["대기", "작업중", "검수중", "수정중", "완료"];

  const handleRevisionSubmit = async () => {
    if (!revisionReason.trim()) return;
    await onRequestRevision?.(revisionReason.trim());
    setRevisionReason("");
    setShowRevisionDialog(false);
  };

  return (
    <div className="w-72 border-l flex flex-col shrink-0 bg-muted/30">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Package className="h-4 w-4" /> 프로젝트 정보
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">주문번호</span>
            <span className="font-mono">{project.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">상태</span>
            {isAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${sc.color}`}
                >
                  {sc.icon} {project.status} <ChevronDown className="h-3 w-3" />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={async () => {
                          setShowStatusMenu(false);
                          await onUpdateStatus?.(s);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${project.status === s ? "font-semibold" : ""}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Badge variant="secondary" className={`text-xs ${sc.color}`}>
                {sc.icon} <span className="ml-1">{project.status}</span>
              </Badge>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">서비스</span>
            <span className="text-right max-w-[140px] truncate">{project.service_title}</span>
          </div>
          {project.package_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">패키지</span>
              <span>{project.package_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">금액</span>
            <span className="font-semibold">{project.price.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">납기일</span>
            <span>{new Date(project.due_date).toLocaleDateString("ko-KR")}</span>
          </div>
          {project.completed_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">완료일</span>
              <span>{new Date(project.completed_date).toLocaleDateString("ko-KR")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">확인상태</span>
            <span>{project.confirm_status}</span>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="p-4 border-b flex-1 flex flex-col min-h-0">
        <h4 className="font-semibold text-xs mb-2 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> 납품 파일 ({projectFiles.length})
        </h4>
        <ScrollArea className="flex-1">
          <div className="space-y-1.5">
            {projectFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">아직 납품된 파일이 없습니다</p>
            ) : (
              projectFiles.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/80 hover:bg-accent text-xs"
                >
                  <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                </a>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        {isAdmin && (
          <label className="block">
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onUploadDeliverable?.(file);
                  e.target.value = "";
                }
              }}
            />
            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
              <span><Upload className="h-3.5 w-3.5 mr-1" /> 결과물 업로드</span>
            </Button>
          </label>
        )}

        {!isAdmin && (project.status === "검수중" || project.status === "완료") && project.confirm_status !== "확인완료" && (
          <>
            <Button size="sm" className="w-full text-xs" onClick={onConfirmProject}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> 완료 확인
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowRevisionDialog(true)}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" /> 수정 요청
            </Button>
          </>
        )}

        {!isAdmin && project.confirm_status === "확인완료" && (
          <div className="text-center text-xs text-green-600 font-medium py-2">
            ✅ 프로젝트 완료 확인됨
          </div>
        )}
      </div>

      {/* Revision dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수정 요청</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">수정 사유</label>
            <Input
              placeholder="수정이 필요한 부분을 설명해주세요"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>취소</Button>
            <Button onClick={handleRevisionSubmit} disabled={!revisionReason.trim()}>요청하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
