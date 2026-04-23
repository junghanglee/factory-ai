import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle, Package, Receipt, FileText, HelpCircle, User,
  CheckCircle2, ChevronRight, Send, Plus, Camera
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import LazyMount from "@/components/LazyMount";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/utils/imageCompression";

interface ProjectRow {
  id: string;
  order_number: string;
  service_title: string;
  package_name: string | null;
  status: string;
  confirm_status: string;
  payment_status: string;
  price: number;
  order_date: string;
  due_date: string;
  completed_date: string | null;
}

const statusLabelMap: Record<string, string> = {
  "대기": "waiting",
  "작업중": "inProgress",
  "검수중": "reviewing",
  "수정중": "revising",
  "완료": "done",
};

const statusConfig: Record<string, { color: string; key: string }> = {
  "대기": { color: "bg-muted text-muted-foreground", key: "waiting" },
  "작업중": { color: "bg-blue-100 text-blue-700", key: "inProgress" },
  "검수중": { color: "bg-amber-100 text-amber-700", key: "reviewing" },
  "수정중": { color: "bg-orange-100 text-orange-700", key: "revising" },
  "완료": { color: "bg-green-100 text-green-700", key: "done" },
};

const MyPage = () => {
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "chat";

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [profile, setProfile] = useState<{ name: string | null; phone: string | null; avatar_url: string | null } | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loadingChatRooms, setLoadingChatRooms] = useState(true);

  // Inquiry form
  const [inquiryForm, setInquiryForm] = useState({
    inquiry_type: "일반 문의",
    message: "",
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const compressed = await compressImage(file, "avatar");
    const ext = compressed.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true });
    if (uploadError) {
      toast.error("아바타 업로드에 실패했습니다.");
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    if (error) {
      toast.error("아바타 저장에 실패했습니다.");
    } else {
      setProfile((prev) => prev ? { ...prev, avatar_url: urlData.publicUrl } : prev);
      toast.success("아바타가 변경되었습니다.");
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  // Auto-redirect to /chat when entering with chat tab and chat rooms exist
  useEffect(() => {
    if (!loading && user && activeTab === "chat" && !loadingChatRooms && chatRooms.length > 0) {
      navigate("/chat", { replace: true });
    }
  }, [loading, user, activeTab, loadingChatRooms, chatRooms, navigate]);

  // Load projects
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

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, phone, avatar_url")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setEditName(data.name || "");
        setEditPhone(data.phone || "");
      }
    })();
  }, [user]);

  // Load my inquiries
  useEffect(() => {
    if (!user || activeTab !== "inquiries") return;
    (async () => {
      setLoadingInquiries(true);
      const { data } = await supabase
        .from("contact_inquiries")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (data) setInquiries(data);
      setLoadingInquiries(false);
    })();
  }, [user, activeTab]);

  // Load chat rooms
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingChatRooms(true);
      const { data } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("customer_id", user.id)
        .limit(1);
      setChatRooms(data || []);
      setLoadingChatRooms(false);
    })();
  }, [user]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const goToChat = useCallback(async (projectId: string) => {
    if (!user) return;
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);
    if (rooms && rooms.length > 0) {
      navigate("/chat", { state: { openRoomId: rooms[0].id } });
    } else {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
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
      if (newRoom) navigate("/chat", { state: { openRoomId: newRoom.id } });
    }
  }, [user, projects, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: editName, phone: editPhone })
      .eq("user_id", user.id);
    if (error) {
      toast.error("프로필 저장에 실패했습니다.");
    } else {
      toast.success("프로필이 저장되었습니다.");
      setProfile((prev) => prev ? { ...prev, name: editName, phone: editPhone } : prev);
    }
    setSavingProfile(false);
  };

  const handleSubmitInquiry = async () => {
    if (!user || !inquiryForm.message.trim()) return;
    setSubmittingInquiry(true);
    const { error } = await supabase.from("contact_inquiries").insert({
      name: profile?.name || user.email || "",
      email: user.email || "",
      phone: profile?.phone || "",
      inquiry_type: inquiryForm.inquiry_type,
      message: inquiryForm.message,
    });
    if (error) {
      toast.error("문의 접수에 실패했습니다.");
    } else {
      toast.success("문의가 접수되었습니다.");
      setInquiryForm({ inquiry_type: "일반 문의", message: "" });
      // Reload inquiries
      const { data } = await supabase
        .from("contact_inquiries")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (data) setInquiries(data);
    }
    setSubmittingInquiry(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) return null;

  // ✅ 신청내역: 실제 의뢰하기를 클릭한 주문(ORD-prefixed) 또는 결제완료 건만
  const realProjects = projects.filter(
    (p) => p.payment_status === "입금완료" || p.order_number?.startsWith("ORD-")
  );
  // ✅ 결제내역: 결제완료(입금완료)만
  const paidProjects = projects.filter((p) => p.payment_status === "입금완료");
  const completedProjects = realProjects.filter((p) => p.status === "완료");
  // ✅ 총 결제액: 결제완료 금액만 합산
  const totalSpent = paidProjects.reduce((sum, p) => sum + p.price, 0);

  const menuItems = [
    { id: "projects", label: "신청내역", icon: Package, count: realProjects.length },
    { id: "payments", label: "결제내역", icon: Receipt },
    { id: "invoice", label: "계산서 요청", icon: FileText },
    { id: "inquiries", label: "1:1 문의", icon: HelpCircle },
    { id: "chat", label: "채팅 상담", icon: MessageCircle },
    { id: "profile", label: "내 정보", icon: User },
  ];

  return (
    <MainLayout>
      {/* Sub-navigation bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 h-[46px] overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[14px] whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === item.id
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{item.count}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User summary card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{profile?.name || user?.email || "회원"}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">전체 프로젝트</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
                  <p className="text-xs text-muted-foreground">완료</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-2xl font-bold">{totalSpent.toLocaleString()}<span className="text-sm font-normal">원</span></p>
                  <p className="text-xs text-muted-foreground">총 결제액</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <LazyMount rootMargin="200px" minHeight={500}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Hidden TabsList - tabs controlled by sub-nav above */}
          <TabsList className="hidden">
            {menuItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* 신청내역 */}
          <TabsContent value="projects">
            <h2 className="text-lg font-bold mb-4">신청내역</h2>
            {loadingProjects ? (
              <p className="text-center text-muted-foreground py-12">로딩 중...</p>
            ) : realProjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">진행 중인 프로젝트가 없습니다.</p>
                  <Button className="mt-4" size="sm" onClick={() => navigate("/")}>서비스 둘러보기</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {realProjects.map((project) => {
                  const sc = statusConfig[project.status] || statusConfig["대기"];
                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{project.service_title}</h3>
                              {project.package_name && (
                                <span className="text-xs text-muted-foreground">({project.package_name})</span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{t(`mypage.status.${sc.key}`)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              주문번호: {project.order_number} · 금액: {project.price.toLocaleString()}원 · 납기: {new Date(project.due_date).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.confirm_status === "확인완료" && (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 완료
                              </span>
                            )}
                            <Button size="sm" variant="outline" onClick={() => goToChat(project.id)}>
                              <MessageCircle className="h-4 w-4 mr-1" /> 채팅
                            </Button>
                          </div>
                        </div>
                        {/* Progress */}
                        <div className="mt-3 flex items-center gap-1">
                          {["대기", "작업중", "검수중", "완료"].map((step, idx) => {
                            const steps = ["대기", "작업중", "검수중", "완료"];
                            const currentIdx = steps.indexOf(project.status === "수정중" ? "검수중" : project.status);
                            return (
                              <div key={step} className="flex-1">
                                <div className={`h-1.5 rounded-full ${idx <= currentIdx ? "bg-primary" : "bg-muted"}`} />
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
          </TabsContent>

          {/* 결제내역 */}
          <TabsContent value="payments">
            <h2 className="text-lg font-bold mb-4">결제내역</h2>
            {paidProjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">결제 완료된 내역이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-4 font-medium">주문번호</th>
                          <th className="text-left p-4 font-medium">서비스</th>
                          <th className="text-left p-4 font-medium">결제일</th>
                          <th className="text-right p-4 font-medium">금액</th>
                          <th className="text-center p-4 font-medium">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paidProjects.map((p) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-4 font-mono text-xs">{p.order_number}</td>
                            <td className="p-4">{p.service_title}</td>
                            <td className="p-4 text-muted-foreground">{new Date(p.order_date).toLocaleDateString("ko-KR")}</td>
                            <td className="p-4 text-right font-medium">{p.price.toLocaleString()}원</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(statusConfig[p.status] || statusConfig["대기"]).color}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50 font-medium">
                          <td colSpan={3} className="p-4">합계</td>
                          <td className="p-4 text-right text-primary font-bold">{totalSpent.toLocaleString()}원</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 계산서 요청 */}
          <TabsContent value="invoice">
            <h2 className="text-lg font-bold mb-4">계산서 요청</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  완료된 프로젝트에 대해 세금계산서 또는 현금영수증 발행을 요청할 수 있습니다.
                </p>
                {completedProjects.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">완료된 프로젝트가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedProjects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{p.service_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.order_number} · {new Date(p.order_date).toLocaleDateString("ko-KR")} · {p.price.toLocaleString()}원
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate("/chat", {
                              state: {
                                inquiry: {
                                  serviceTitle: `계산서 요청 - ${p.service_title} (${p.order_number})`,
                                },
                              },
                            });
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" /> 요청하기
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    ※ 계산서 발행은 요청 후 영업일 1~2일 내 처리됩니다.<br />
                    ※ 문의사항은 채팅 상담 또는 이메일(junghanglee@gmail.com)로 연락해 주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1:1 문의 */}
          <TabsContent value="inquiries">
            <h2 className="text-lg font-bold mb-4">1:1 문의</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New inquiry form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">새 문의 작성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">문의 유형</label>
                    <select
                      value={inquiryForm.inquiry_type}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, inquiry_type: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                    >
                      <option>일반 문의</option>
                      <option>서비스 문의</option>
                      <option>결제/환불</option>
                      <option>계산서 발행</option>
                      <option>제휴/파트너십</option>
                      <option>기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">문의 내용</label>
                    <Textarea
                      rows={5}
                      placeholder="문의 내용을 입력해주세요..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleSubmitInquiry} disabled={submittingInquiry || !inquiryForm.message.trim()} className="w-full">
                    <Send className="h-4 w-4 mr-1.5" />
                    {submittingInquiry ? "접수 중..." : "문의 접수"}
                  </Button>
                </CardContent>
              </Card>

              {/* Inquiry history */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">문의 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInquiries ? (
                    <p className="text-center text-muted-foreground py-8">로딩 중...</p>
                  ) : inquiries.length === 0 ? (
                    <div className="py-8 text-center">
                      <HelpCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">문의 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.map((inq: any) => (
                        <div key={inq.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={inq.status === "신규" ? "default" : inq.status === "확인" ? "secondary" : "outline"}>
                              {inq.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(inq.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{inq.inquiry_type}</p>
                          <p className="text-sm line-clamp-3">{inq.message}</p>
                          {inq.admin_reply && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                              <p className="text-xs font-medium text-primary mb-1">💬 답변</p>
                              <p className="text-sm whitespace-pre-wrap">{inq.admin_reply}</p>
                              {inq.replied_at && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(inq.replied_at).toLocaleDateString("ko-KR")} 답변
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 채팅 상담 */}
          <TabsContent value="chat">
            <h2 className="text-lg font-bold mb-4">채팅 상담</h2>
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <MessageCircle className="h-14 w-14 mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">실시간 채팅 상담</h3>
                  <p className="text-sm text-muted-foreground">
                    담당 매니저와 1:1 채팅으로 빠르게 상담받으세요.
                  </p>
                </div>
                <div className="flex justify-center">
                  {loadingChatRooms ? (
                    <p className="text-sm text-muted-foreground">로딩 중...</p>
                  ) : (
                    <Button onClick={() => navigate("/chat")} className="gap-1.5">
                      <MessageCircle className="h-4 w-4" /> {chatRooms.length > 0 ? "채팅 상담 바로가기" : "채팅 상담 시작"}
                    </Button>
                  )}
                </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* 내 정보 */}
          <TabsContent value="profile">
            <h2 className="text-lg font-bold mb-4">내 정보</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">프로필 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                      <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                        <Camera className="h-3.5 w-3.5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                      </label>
                    </div>
                    {uploadingAvatar && <p className="text-xs text-muted-foreground">업로드 중...</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이메일</label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">이름</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름을 입력하세요" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">전화번호</label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="전화번호를 입력하세요" />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                    {savingProfile ? "저장 중..." : "프로필 저장"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">계정 관리</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-1">가입일</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "-"}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-1">이용 현황</p>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-center">
                      <div>
                        <p className="text-xl font-bold">{projects.length}</p>
                        <p className="text-xs text-muted-foreground">총 프로젝트</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{totalSpent.toLocaleString()}<span className="text-xs font-normal">원</span></p>
                        <p className="text-xs text-muted-foreground">총 결제액</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    로그아웃
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </LazyMount>
      </div>
    </MainLayout>
  );
};

export default MyPage;
