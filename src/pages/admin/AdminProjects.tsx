import { Upload, Eye, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const projects = [
  { id: "#1284", title: "AI 로고 디자인 3종", customer: "김민수", status: "작업중", confirmStatus: "-", dueDate: "04.04" },
  { id: "#1283", title: "숏폼 영상 5편", customer: "이지은", status: "검수중", confirmStatus: "대기", dueDate: "04.02" },
  { id: "#1282", title: "블로그 10편 작성", customer: "박준영", status: "완료", confirmStatus: "컨펌됨", dueDate: "03.22" },
  { id: "#1281", title: "광고 소재 10종", customer: "최서연", status: "작업중", confirmStatus: "-", dueDate: "04.05" },
];

const statusColors: Record<string, string> = {
  "작업중": "bg-blue-100 text-blue-700",
  "검수중": "bg-amber-100 text-amber-700",
  "완료": "bg-green-100 text-green-700",
};

const AdminProjects = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">프로젝트 관리</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">주문번호</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">프로젝트</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">고객</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">납기일</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">상태</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">컨펌</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4 font-medium">{project.id}</td>
                    <td className="p-4">{project.title}</td>
                    <td className="p-4 text-muted-foreground">{project.customer}</td>
                    <td className="p-4">{project.dueDate}</td>
                    <td className="p-4">
                      <select className="text-xs border rounded px-2 py-1 bg-background">
                        <option selected={project.status === "작업중"}>작업중</option>
                        <option selected={project.status === "검수중"}>검수중</option>
                        <option selected={project.status === "완료"}>완료</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${project.confirmStatus === "컨펌됨" ? "bg-green-100 text-green-700" : "text-muted-foreground"}`}>
                        {project.confirmStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                          <Upload className="h-3 w-3" /> 결과물 업로드
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
    </AdminLayout>
  );
};

export default AdminProjects;
