import { Link } from "react-router-dom";
import { Download, CheckCircle2, Clock, FileText, MessageCircle } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    id: "p1",
    title: "AI 로고 디자인 3종",
    seller: "AI디자인랩",
    status: "in_progress",
    statusLabel: "작업중",
    orderedAt: "2026.04.01",
    deliveryDate: "2026.04.04",
    price: 88200,
  },
  {
    id: "p2",
    title: "숏폼 영상 5편 제작",
    seller: "무브스튜디오",
    status: "review",
    statusLabel: "검수중",
    orderedAt: "2026.03.28",
    deliveryDate: "2026.04.02",
    price: 195000,
  },
  {
    id: "p3",
    title: "블로그 포스트 10편 작성",
    seller: "글로벌라이터",
    status: "completed",
    statusLabel: "완료",
    orderedAt: "2026.03.20",
    deliveryDate: "2026.03.22",
    price: 190000,
  },
];

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const timeline = [
  { label: "주문 완료", date: "04.01", done: true },
  { label: "작업 시작", date: "04.01", done: true },
  { label: "초안 전달", date: "04.03", done: false },
  { label: "수정/컨펌", date: "04.04", done: false },
  { label: "최종 납품", date: "04.04", done: false },
];

const MyProjectsPage = () => {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">내 프로젝트</h1>

        <div className="space-y-4 mb-10">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{project.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                        {project.statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.seller} · 주문일: {project.orderedAt} · 납품예정: {project.deliveryDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.status === "review" && (
                      <Button size="sm" className="gap-1">
                        <CheckCircle2 className="h-4 w-4" /> 컨펌하기
                      </Button>
                    )}
                    {project.status === "review" && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <MessageCircle className="h-4 w-4" /> 수정요청
                      </Button>
                    )}
                    {project.status === "completed" && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Download className="h-4 w-4" /> 다운로드
                      </Button>
                    )}
                    <Link to="/chat">
                      <Button size="sm" variant="ghost">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timeline example */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-6">프로젝트 진행 상태: AI 로고 디자인 3종</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
              {timeline.map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center text-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.done ? "bg-primary text-primary-foreground" : "bg-secondary border-2"}`}>
                    {step.done && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium mt-2">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MyProjectsPage;
