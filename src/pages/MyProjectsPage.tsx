import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, MessageCircle, Package, Star } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "@/components/admin/ImageUploader";

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
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewProject, setReviewProject] = useState<ProjectRow | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: "", nickname: "", image_url: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const goToChat = useCallback(async (projectId: string) => {
    if (!user || navigating) return;
    setNavigating(projectId);

    // Find chat room linked to this project
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);

    if (rooms && rooms.length > 0) {
      navigate("/chat", { state: { openRoomId: rooms[0].id } });
    } else {
      // No room linked — find by customer_id or create one
      const project = projects.find((p) => p.id === projectId);
      if (!project) { setNavigating(null); return; }

      const { data: newRoom } = await supabase
        .from("chat_rooms")
        .insert({
          customer_id: user.id,
          title: `[프로젝트] ${project.service_title}`,
          project_id: projectId,
          metadata: { serviceTitle: project.service_title, orderNumber: project.order_number },
        } as any)
        .select()
        .single();

      if (newRoom) {
        navigate("/chat", { state: { openRoomId: newRoom.id } });
      }
    }
    setNavigating(null);
  }, [user, navigating, projects, navigate]);

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
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => goToChat(project.id)}
                >
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
                          <span className="text-xs text-amber-600 font-medium">확인 필요</span>
                        )}
                        {project.confirm_status === "확인완료" && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 완료
                          </span>
                        )}
                        {project.status === "완료" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewProject(project);
                              setReviewForm({ rating: 5, review_text: "", nickname: user?.user_metadata?.name || user?.email?.split("@")[0] || "", image_url: "" });
                              setReviewOpen(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1" /> 후기
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={navigating === project.id}
                          onClick={(e) => { e.stopPropagation(); goToChat(project.id); }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
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

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>후기 작성 - {reviewProject?.service_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>평점</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setReviewForm(prev => ({ ...prev, rating: v }))}>
                    <Star className={`h-6 w-6 ${v <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>닉네임</Label>
              <Input value={reviewForm.nickname} onChange={(e) => setReviewForm(prev => ({ ...prev, nickname: e.target.value }))} />
            </div>
            <div>
              <Label>후기</Label>
              <Textarea value={reviewForm.review_text} onChange={(e) => setReviewForm(prev => ({ ...prev, review_text: e.target.value }))} placeholder="서비스 이용 후기를 작성해주세요" />
            </div>
            <div>
              <Label>이미지 (선택)</Label>
              <ImageUploader
                value={reviewForm.image_url}
                onChange={(url) => setReviewForm(prev => ({ ...prev, image_url: url }))}
                folder="reviews"
                sizePreset="thumbnail"
              />
            </div>
            <Button
              className="w-full"
              disabled={submittingReview || !reviewForm.nickname.trim()}
              onClick={async () => {
                if (!user || !reviewProject) return;
                setSubmittingReview(true);
                // Find service_id from project service_title
                const { data: svc } = await supabase
                  .from("services")
                  .select("id")
                  .eq("title", reviewProject.service_title)
                  .limit(1)
                  .maybeSingle();

                if (!svc) {
                  toast.error("서비스를 찾을 수 없습니다.");
                  setSubmittingReview(false);
                  return;
                }

                const { error } = await supabase.from("service_reviews").insert({
                  service_id: svc.id,
                  user_id: user.id,
                  rating: reviewForm.rating,
                  review_text: reviewForm.review_text || null,
                  nickname: reviewForm.nickname,
                  image_url: reviewForm.image_url || null,
                  is_admin_entry: false,
                });

                if (error) {
                  toast.error("후기 등록 실패: " + error.message);
                } else {
                  toast.success("후기가 등록되었습니다!");
                  setReviewOpen(false);
                }
                setSubmittingReview(false);
              }}
            >
              {submittingReview ? "등록 중..." : "후기 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default MyProjectsPage;
