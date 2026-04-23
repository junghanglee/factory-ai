import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle, Package, Receipt, HelpCircle, User,
  CheckCircle2, Send, Camera, Wallet, Sparkles, Ticket,
  Mail, Phone, Calendar, FileText, CreditCard, Filter, Plus,
  Building2, Briefcase, Banknote, KeyRound
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import MyPageSubNav from "@/components/layout/MyPageSubNav";
import LazyMount from "@/components/LazyMount";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  created_at?: string;
}

interface Balance {
  cash_balance: number;
  point_balance: number;
}

interface TxRow {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const statusConfig: Record<string, { color: string; key: string }> = {
  "대기": { color: "bg-muted text-muted-foreground", key: "waiting" },
  "작업중": { color: "bg-blue-100 text-blue-700", key: "inProgress" },
  "검수중": { color: "bg-amber-100 text-amber-700", key: "reviewing" },
  "수정중": { color: "bg-orange-100 text-orange-700", key: "revising" },
  "완료": { color: "bg-green-100 text-green-700", key: "done" },
};

const PROJECT_STATUSES = ["대기", "작업중", "검수중", "수정중", "완료"];
const CASH_PRESETS = [10000, 30000, 50000, 100000, 300000, 500000];

const MyPage = () => {
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "chat";

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [profile, setProfile] = useState<{
    name: string | null;
    phone: string | null;
    avatar_url: string | null;
    company_name?: string | null;
    department?: string | null;
    position?: string | null;
    kakao_id?: string | null;
    refund_bank_name?: string | null;
    refund_bank_account?: string | null;
    refund_bank_holder?: string | null;
  } | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loadingChatRooms, setLoadingChatRooms] = useState(true);

  // Balances
  const [balance, setBalance] = useState<Balance>({ cash_balance: 0, point_balance: 0 });
  const [cashTx, setCashTx] = useState<TxRow[]>([]);
  const [pointTx, setPointTx] = useState<TxRow[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(50000);

  // Filters for projects
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Inquiry form
  const [inquiryForm, setInquiryForm] = useState({
    inquiry_type: "일반 문의",
    message: "",
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editKakao, setEditKakao] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editBankHolder, setEditBankHolder] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  // Per requirement #2: removed auto-redirect to /chat so MyPage sub-nav stays visible.
  // Chat tab now navigates explicitly via the sub-nav link.

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

  // Load profile (incl. extra fields)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, phone, avatar_url, company_name, department, position, kakao_id, refund_bank_name, refund_bank_account, refund_bank_holder")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data as any);
        setEditName(data.name || "");
        setEditPhone(data.phone || "");
        const d = data as any;
        setEditCompany(d.company_name || "");
        setEditDepartment(d.department || "");
        setEditPosition(d.position || "");
        setEditKakao(d.kakao_id || "");
        setEditBankName(d.refund_bank_name || "");
        setEditBankAccount(d.refund_bank_account || "");
        setEditBankHolder(d.refund_bank_holder || "");
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

  // Load balance + transactions
  const loadBalance = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_balances")
      .select("cash_balance, point_balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(data ?? { cash_balance: 0, point_balance: 0 });

    const [{ data: ctx }, { data: ptx }] = await Promise.all([
      supabase.from("cash_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("point_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setCashTx((ctx || []) as TxRow[]);
    setPointTx((ptx || []) as TxRow[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "wallet" || activeTab === "profile") loadBalance();
  }, [user, activeTab, loadBalance]);

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

  const handleSaveExtraInfo = async () => {
    if (!user) return;
    setSavingExtra(true);
    const payload = {
      company_name: editCompany || null,
      department: editDepartment || null,
      position: editPosition || null,
      kakao_id: editKakao || null,
      refund_bank_name: editBankName || null,
      refund_bank_account: editBankAccount || null,
      refund_bank_holder: editBankHolder || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
    if (error) {
      toast.error("추가 정보 저장에 실패했습니다.");
    } else {
      toast.success("추가 정보가 저장되었습니다.");
      setProfile((prev) => prev ? { ...prev, ...payload } : prev);
    }
    setSavingExtra(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("비밀번호 변경에 실패했습니다: " + error.message);
    } else {
      toast.success("비밀번호가 변경되었습니다.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
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
      const { data } = await supabase
        .from("contact_inquiries")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (data) setInquiries(data);
    }
    setSubmittingInquiry(false);
  };

  const handleRedeemCoupon = async () => {
    if (!user || !couponCode.trim()) return;
    setRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_coupon", { _code: couponCode.trim() });
    if (error) {
      toast.error("쿠폰 등록 중 오류가 발생했습니다.");
    } else {
      const result = data as { success: boolean; error?: string; message?: string };
      if (result?.success) {
        toast.success(result.message || "쿠폰이 등록되었습니다.");
        setCouponCode("");
        await loadBalance();
      } else {
        toast.error(result?.error || "쿠폰 등록에 실패했습니다.");
      }
    }
    setRedeeming(false);
  };

  const handleChargeCash = () => {
    if (!chargeAmount || chargeAmount < 1000) {
      toast.error("최소 충전금액은 1,000원입니다.");
      return;
    }
    toast.info("결제 페이지로 이동합니다. (캐시 충전 결제 연동 진행 중)");
    // 결제 연동 자리: navigate(`/checkout?type=cash&amount=${chargeAmount}`);
  };

  const requestInvoice = (p: ProjectRow) => {
    navigate("/chat", {
      state: {
        inquiry: {
          serviceTitle: `계산서 요청 - ${p.service_title} (${p.order_number})`,
        },
      },
    });
  };

  const goToPayment = (p: ProjectRow) => {
    navigate(`/paddle-payment/${p.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) return null;

  // ✅ 신청내역: 실제 의뢰 또는 결제완료
  const realProjects = projects.filter(
    (p) => p.payment_status === "입금완료" || p.order_number?.startsWith("ORD-")
  );
  const paidProjects = projects.filter((p) => p.payment_status === "입금완료");
  const completedProjects = realProjects.filter((p) => p.status === "완료");
  const totalSpent = paidProjects.reduce((sum, p) => sum + p.price, 0);

  // Filtered projects
  const categoryOptions = Array.from(
    new Set(realProjects.map((p) => p.service_title.split(" ")[0]).filter(Boolean))
  );

  const filteredProjects = realProjects.filter((p) => {
    if (filterPayment === "paid" && p.payment_status !== "입금완료") return false;
    if (filterPayment === "unpaid" && p.payment_status === "입금완료") return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterCategory !== "all" && !p.service_title.startsWith(filterCategory)) return false;
    if (filterStartDate && p.order_date < filterStartDate) return false;
    if (filterEndDate && p.order_date > filterEndDate) return false;
    return true;
  });

  const menuItems = [
    { id: "projects", label: "신청내역", icon: Package, count: realProjects.length },
    { id: "payments", label: "결제내역", icon: Receipt },
    { id: "wallet", label: "캐시·포인트", icon: Wallet },
    { id: "inquiries", label: "1:1 문의", icon: HelpCircle },
    { id: "chat", label: "채팅 상담", icon: MessageCircle },
    { id: "profile", label: "내 정보", icon: User },
  ];

  const displayName = profile?.name || user?.email?.split("@")[0] || "회원";

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
        {/* ==== 프로필 영역 (개선) ==== */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-purple-600 px-6 pt-8 pb-20 sm:pt-10 sm:pb-24">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)"
            }} />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="text-primary-foreground">
                <p className="text-xs font-medium opacity-90 mb-1">AI팩토리 회원</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{displayName}님, 환영합니다 ✨</h1>
                <p className="text-sm opacity-90 mt-1">{user?.email}</p>
              </div>
              <div className="flex gap-3 text-primary-foreground">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTabChange("profile")}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <User className="h-4 w-4 mr-1" /> 정보 수정
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="relative p-6 -mt-16">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-6">
              {/* 아바타 (편집 가능) */}
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-card flex items-center justify-center border-4 border-card shadow-xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-200 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md ring-2 ring-card">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              </div>

              {/* 통계 */}
              <div className="flex flex-1 items-center justify-end gap-3 sm:gap-6 flex-wrap">
                <div className="text-center min-w-[72px]">
                  <p className="text-2xl font-bold text-primary">{realProjects.length}</p>
                  <p className="text-xs text-muted-foreground">신청건수</p>
                </div>
                <div className="w-px h-10 bg-border hidden sm:block" />
                <div className="text-center min-w-[72px]">
                  <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
                  <p className="text-xs text-muted-foreground">완료</p>
                </div>
                <div className="w-px h-10 bg-border hidden sm:block" />
                <div className="text-center min-w-[100px]">
                  <p className="text-xl font-bold">{totalSpent.toLocaleString()}<span className="text-xs font-normal">원</span></p>
                  <p className="text-xs text-muted-foreground">총 결제액</p>
                </div>
              </div>
            </div>

            {/* 캐시·포인트 미니 위젯 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTabChange("wallet")}
                className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">충전 캐시</p>
                    <p className="font-bold text-blue-700">{balance.cash_balance.toLocaleString()}원</p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-blue-600" />
              </button>
              <button
                onClick={() => handleTabChange("wallet")}
                className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">적립 포인트</p>
                    <p className="font-bold text-amber-700">{balance.point_balance.toLocaleString()}P</p>
                  </div>
                </div>
                <Ticket className="h-4 w-4 text-amber-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        <LazyMount rootMargin="200px" minHeight={500}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="hidden">
            {menuItems.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* ============ 신청내역 ============ */}
          <TabsContent value="projects">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold">신청내역</h2>
              <span className="text-sm text-muted-foreground">총 {filteredProjects.length}건</span>
            </div>

            {/* 필터 */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                  <Filter className="h-4 w-4" /> 필터
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">시작일</label>
                    <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">종료일</label>
                    <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">결제유무</label>
                    <Select value={filterPayment} onValueChange={setFilterPayment}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="paid">결제완료</SelectItem>
                        <SelectItem value="unpaid">미결제</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">유형</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">단계</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(filterPayment !== "all" || filterStatus !== "all" || filterCategory !== "all" || filterStartDate || filterEndDate) && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterPayment("all"); setFilterStatus("all"); setFilterCategory("all");
                        setFilterStartDate(""); setFilterEndDate("");
                      }}
                    >
                      필터 초기화
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {loadingProjects ? (
              <p className="text-center text-muted-foreground py-12">로딩 중...</p>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">{realProjects.length === 0 ? "진행 중인 프로젝트가 없습니다." : "필터 조건에 해당하는 신청이 없습니다."}</p>
                  {realProjects.length === 0 && (
                    <Button className="mt-4" size="sm" onClick={() => navigate("/")}>서비스 둘러보기</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => {
                  const sc = statusConfig[project.status] || statusConfig["대기"];
                  const isPaid = project.payment_status === "입금완료";
                  return (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold truncate">{project.service_title}</h3>
                              {project.package_name && (
                                <span className="text-xs text-muted-foreground">({project.package_name})</span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{t(`mypage.status.${sc.key}`)}</span>
                              {!isPaid && <Badge variant="destructive" className="text-[10px]">미결제</Badge>}
                              {isPaid && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">결제완료</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              주문번호: {project.order_number} · 금액: {project.price.toLocaleString()}원 · 주문일: {new Date(project.order_date).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {project.confirm_status === "확인완료" && (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 완료
                              </span>
                            )}
                            {!isPaid && (
                              <Button size="sm" variant="default" onClick={() => goToPayment(project)}>
                                <CreditCard className="h-4 w-4 mr-1" /> 결제하기
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => goToChat(project.id)}>
                              <MessageCircle className="h-4 w-4 mr-1" /> 채팅
                            </Button>
                          </div>
                        </div>
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

          {/* ============ 결제내역 (계산서요청 버튼 통합) ============ */}
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
                          <th className="text-center p-4 font-medium">계산서</th>
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
                            <td className="p-4 text-center">
                              <Button size="sm" variant="outline" onClick={() => requestInvoice(p)}>
                                <FileText className="h-3.5 w-3.5 mr-1" /> 요청
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50 font-medium">
                          <td colSpan={3} className="p-4">합계</td>
                          <td className="p-4 text-right text-primary font-bold">{totalSpent.toLocaleString()}원</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              ※ 계산서 발행은 요청 후 영업일 1~2일 내 처리됩니다. 문의: junghanglee@gmail.com
            </p>
          </TabsContent>

          {/* ============ 캐시·포인트·쿠폰 ============ */}
          <TabsContent value="wallet">
            <h2 className="text-lg font-bold mb-4">캐시·포인트</h2>

            {/* 잔액 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card className="overflow-hidden border-0 shadow-md">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90 mb-1">충전 캐시</p>
                      <p className="text-3xl font-bold">{balance.cash_balance.toLocaleString()}<span className="text-base font-normal ml-1">원</span></p>
                      <p className="text-[11px] opacity-80 mt-1">환불 가능 · 결제에 사용</p>
                    </div>
                    <Wallet className="h-10 w-10 opacity-30" />
                  </div>
                </div>
              </Card>
              <Card className="overflow-hidden border-0 shadow-md">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90 mb-1">적립 포인트</p>
                      <p className="text-3xl font-bold">{balance.point_balance.toLocaleString()}<span className="text-base font-normal ml-1">P</span></p>
                      <p className="text-[11px] opacity-80 mt-1">환불 불가 · 구매확정 시 1% 자동 적립</p>
                    </div>
                    <Sparkles className="h-10 w-10 opacity-30" />
                  </div>
                </div>
              </Card>
            </div>

            {/* 캐시 충전 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> 캐시 충전
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CASH_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setChargeAmount(amount)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        chargeAmount === amount
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent"
                      }`}
                    >
                      {(amount / 10000).toLocaleString()}만원
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">충전 금액 (직접 입력)</label>
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(Number(e.target.value) || 0)}
                    />
                  </div>
                  <Button onClick={handleChargeCash} className="h-10">
                    <CreditCard className="h-4 w-4 mr-1" /> 결제하기
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ※ 충전한 캐시는 미사용 시 환불 가능합니다. 사용 즉시 차감되며, 일부 사용 후 잔여 금액도 환불 가능합니다.
                </p>
              </CardContent>
            </Card>

            {/* 쿠폰 등록 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-amber-500" /> 쿠폰 등록 (포인트 충전)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="쿠폰 코드를 입력하세요"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeemCoupon()}
                  />
                  <Button onClick={handleRedeemCoupon} disabled={redeeming || !couponCode.trim()}>
                    {redeeming ? "등록 중..." : "등록"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ※ 등록된 포인트는 결제 시 사용 가능하며, 환불은 불가능합니다.
                </p>
              </CardContent>
            </Card>

            {/* 거래 내역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">캐시 사용 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {cashTx.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">내역이 없습니다.</p>
                  ) : (
                    <ul className="divide-y">
                      {cashTx.map((tx) => (
                        <li key={tx.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString("ko-KR")}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.transaction_type === "use" ? "text-red-500" : "text-blue-600"}`}>
                              {tx.transaction_type === "use" ? "-" : "+"}{Math.abs(tx.amount).toLocaleString()}원
                            </p>
                            <p className="text-[11px] text-muted-foreground">잔액 {tx.balance_after.toLocaleString()}원</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">포인트 적립·사용 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {pointTx.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">내역이 없습니다.</p>
                  ) : (
                    <ul className="divide-y">
                      {pointTx.map((tx) => (
                        <li key={tx.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString("ko-KR")}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.transaction_type === "use" ? "text-red-500" : "text-amber-600"}`}>
                              {tx.transaction_type === "use" ? "-" : "+"}{Math.abs(tx.amount).toLocaleString()}P
                            </p>
                            <p className="text-[11px] text-muted-foreground">잔액 {tx.balance_after.toLocaleString()}P</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ 1:1 문의 ============ */}
          <TabsContent value="inquiries">
            <h2 className="text-lg font-bold mb-4">1:1 문의</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* ============ 채팅 상담 ============ */}
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

          {/* ============ 내 정보 ============ */}
          <TabsContent value="profile">
            <h2 className="text-lg font-bold mb-4">내 정보</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">프로필 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-3 pb-4 border-b">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border shadow">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md ring-2 ring-card">
                        <Camera className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                      </label>
                    </div>
                    {uploadingAvatar && <p className="text-xs text-muted-foreground">업로드 중...</p>}
                    <p className="text-xs text-muted-foreground">사진을 클릭해 변경할 수 있습니다.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> 이메일</label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> 이름</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름을 입력하세요" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 전화번호</label>
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
                  <div className="p-4 border rounded-lg flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">가입일</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-2">이용 현황</p>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl font-bold">{realProjects.length}</p>
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
