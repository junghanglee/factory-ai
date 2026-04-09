import { useState } from "react";
import { Upload, Eye, FileText, Download } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { projects as initialProjects, type Project } from "@/data/projects";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const statusColors: Record<string, string> = {
  "대기": "bg-secondary text-muted-foreground",
  "작업중": "bg-blue-100 text-blue-700",
  "검수중": "bg-amber-100 text-amber-700",
  "수정요청": "bg-red-100 text-red-700",
  "완료": "bg-green-100 text-green-700",
  "취소": "bg-gray-200 text-gray-500",
};

const confirmColors: Record<string, string> = {
  "대기": "bg-amber-100 text-amber-700",
  "컨펌됨": "bg-green-100 text-green-700",
  "수정요청": "bg-red-100 text-red-700",
  "-": "text-muted-foreground",
};

const allStatuses: Project["status"][] = ["대기", "작업중", "검수중", "수정요청", "완료", "취소"];

const AdminProjects = () => {
  const [projectList, setProjectList] = useState(initialProjects);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const changeStatus = (id: string, status: Project["status"]) => {
    setProjectList((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (selectedProject?.id === id) setSelectedProject({ ...selectedProject, status });
  };

  const openDetail = (p: Project) => {
    setSelectedProject(p);
    setDetailOpen(true);
  };

  const simulateUpload = (id: string) => {
    const fileName = `결과물_${Date.now()}.zip`;
    setProjectList((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, files: [...p.files, { name: fileName, url: "#", uploadedAt: new Date().toISOString().split("T")[0] }], status: "검수중" as const }
          : p
      )
    );
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
                  <th className="text-left p-4 font-medium text-muted-foreground">컨펌</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">파일</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((project) => (
                  <tr key={project.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4 font-medium">{project.orderNumber}</td>
                    <td className="p-4 truncate max-w-[180px]">{project.serviceTitle}</td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">{project.packageName}</span>
                    </td>
                    <td className="p-4">{project.customer}</td>
                    <td className="p-4">₩{formatPrice(project.price)}</td>
                    <td className="p-4">{project.dueDate}</td>
                    <td className="p-4">
                      <select
                        className="text-xs border rounded px-2 py-1 bg-background"
                        value={project.status}
                        onChange={(e) => changeStatus(project.id, e.target.value as Project["status"])}
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confirmColors[project.confirmStatus]}`}>
                        {project.confirmStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs">{project.files.length}개</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(project)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => simulateUpload(project.id)}>
                          <Upload className="h-3 w-3" /> 업로드
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>프로젝트 상세</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">주문번호:</span> <span className="font-medium">{selectedProject.orderNumber}</span></div>
                <div><span className="text-muted-foreground">고객:</span> {selectedProject.customer}</div>
                <div className="col-span-2"><span className="text-muted-foreground">서비스:</span> {selectedProject.serviceTitle}</div>
                <div><span className="text-muted-foreground">패키지:</span> {selectedProject.packageName}</div>
                <div><span className="text-muted-foreground">금액:</span> ₩{formatPrice(selectedProject.price)}</div>
                <div><span className="text-muted-foreground">주문일:</span> {selectedProject.orderDate}</div>
                <div><span className="text-muted-foreground">납기일:</span> {selectedProject.dueDate}</div>
              </div>

              <div className="border-t pt-3">
                <Label className="text-sm font-medium">상태 타임라인</Label>
                <div className="flex items-center gap-2 mt-2">
                  {allStatuses.slice(0, 5).map((s) => {
                    const idx = allStatuses.indexOf(s);
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
              </div>

              {selectedProject.files.length > 0 && (
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium">업로드된 파일</Label>
                  <div className="space-y-2 mt-2">
                    {selectedProject.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-secondary/50 rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{file.uploadedAt}</span>
                        <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <Label className="text-sm font-medium">메모</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedProject.notes || "메모 없음"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProjects;
