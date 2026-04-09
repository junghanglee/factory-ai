import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, CheckCircle2, Clock, MessageCircle, Edit3, Package } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProjectRow {
  id: string;
  order_number: string;
  service_title: string;
  package_name: string | null;
  status: string;
  confirm_status: string;
  price: number;
  order_date: string;
  due_date: string;
  completed_date: string | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  "대기": { color: "bg-muted text-muted-foreground", label: "대기" },
  "작업중": { color: "bg-blue-100 text-blue-700", label: "작업중" },
  "검수중": { color: "bg-amber-100 text-amber-700", label: "검수중" },
  "수정중": { color: "bg-orange-100 text-orange-700", label: "수정중" },
  "완료": { color: "bg-green-100 text-green-700", label: "완료" },
};

const MyProjectsPage = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingProjects(true);
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setProjects(data as ProjectRow[]);
      setLoadingProjects(false);
    })();
  }, [user]);

  if (loading) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">내 프로젝트</h1>

        {loadingProjects ? (
          <p className="text-center text-muted-foreground py-12">로딩 중...</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">진행 중인 프로젝트가 없습니다.</p>
              <Link to="/">
                <Button className="mt-4" size="sm">서비스 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const sc = statusConfig[project.status] || statusConfig["대기"];
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{project.service_title}</h3>
                          {project.package_name && (
                            <span className="text-xs text-muted-foreground">({project.package_name})</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          주문번호: {project.order_number} · 금액: {project.price.toLocaleString()}원 · 납기: {new Date(project.due_date).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(project.status === "검수중" || project.status === "완료") && project.confirm_status !== "확인완료" && (
                          <>
                            <span className="text-xs text-amber-600 font-medium">확인 필요</span>
                          </>
                        )}
                        {project.confirm_status === "확인완료" && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 완료
                          </span>
                        )}
                        <Link to="/chat">
                          <Button size="sm" variant="ghost">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-1">
                      {["대기", "작업중", "검수중", "완료"].map((step, idx) => {
                        const steps = ["대기", "작업중", "검수중", "완료"];
                        const currentIdx = steps.indexOf(project.status === "수정중" ? "검수중" : project.status);
                        const done = idx <= currentIdx;
                        return (
                          <div key={step} className="flex-1 flex items-center gap-1">
                            <div className={`h-1.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyProjectsPage;
