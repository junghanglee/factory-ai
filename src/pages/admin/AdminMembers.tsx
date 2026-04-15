import { useState, useEffect } from "react";
import { Search, Eye, MessageSquare, Store } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  order_count: number;
  total_spent: number;
  created_at: string;
  assigned_admin_id: string | null;
}

interface AdminOption {
  id: string;
  name: string;
}

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const statusColors: Record<string, string> = {
  "활성": "bg-green-100 text-green-700",
  "휴면": "bg-amber-100 text-amber-700",
  "탈퇴": "bg-red-100 text-red-700",
};

const AdminMembers = () => {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [sellerUserIds, setSellerUserIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [membersRes, adminsRes, sellerRes] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_profiles").select("id, name").eq("active", true),
      supabase.from("seller_profiles").select("user_id, status").eq("status", "승인"),
    ]);
    if (membersRes.data) setMembers(membersRes.data as MemberRow[]);
    if (adminsRes.data) setAdmins(adminsRes.data as AdminOption[]);
    if (sellerRes.data) setSellerUserIds(new Set(sellerRes.data.map((s: any) => s.user_id)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = members.filter((m) => {
    const matchSearch = m.name.includes(search) || m.email.includes(search);
    const matchStatus = statusFilter === "전체" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getAdminName = (adminId: string | null) => {
    if (!adminId) return "-";
    return admins.find((a) => a.id === adminId)?.name || "-";
  };

  const openDetail = (m: MemberRow) => {
    setSelectedMember(m);
    setDetailOpen(true);
  };

  const changeStatus = async (id: string, status: string) => {
    await supabase.from("members").update({ status }).eq("id", id);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (selectedMember?.id === id) setSelectedMember({ ...selectedMember, status });
  };

  const changeAssignedAdmin = async (memberId: string, adminId: string) => {
    const value = adminId === "none" ? null : adminId;
    const { error } = await supabase.from("members").update({ assigned_admin_id: value }).eq("id", memberId);
    if (error) {
      toast({ title: "변경 실패", variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, assigned_admin_id: value } : m)));
    if (selectedMember?.id === memberId) setSelectedMember({ ...selectedMember, assigned_admin_id: value });
    toast({ title: "담당자가 변경되었습니다" });
  };

  const openChatWithMember = (member: MemberRow) => {
    // Open admin chat in new window with member info
    const chatUrl = `/admin/chat?member=${encodeURIComponent(member.name)}&email=${encodeURIComponent(member.email)}`;
    window.open(chatUrl, "_blank", "width=800,height=600");
  };

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === "활성").length;
  const dormantMembers = members.filter(m => m.status === "휴면").length;
  const sellerMembers = members.filter(m => sellerUserIds.has(m.id)).length;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">회원 관리</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">총 회원수</p>
            <p className="text-xl font-bold">{totalMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">활성 회원</p>
            <p className="text-xl font-bold text-green-600">{activeMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">휴면 회원</p>
            <p className="text-xl font-bold text-amber-600">{dormantMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">판매자 회원</p>
            <p className="text-xl font-bold text-primary">{sellerMembers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="이름 또는 이메일 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {["전체", "활성", "휴면", "탈퇴"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium text-muted-foreground w-12">No.</th>
                <th className="text-left p-4 font-medium text-muted-foreground">이름</th>
                <th className="text-left p-4 font-medium text-muted-foreground">이메일</th>
                <th className="text-left p-4 font-medium text-muted-foreground">연락처</th>
                <th className="text-left p-4 font-medium text-muted-foreground">가입일</th>
                <th className="text-left p-4 font-medium text-muted-foreground">주문</th>
                <th className="text-left p-4 font-medium text-muted-foreground">총 결제</th>
                <th className="text-left p-4 font-medium text-muted-foreground">판매자</th>
                <th className="text-left p-4 font-medium text-muted-foreground">담당자</th>
                <th className="text-left p-4 font-medium text-muted-foreground">상태</th>
                <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">검색 결과가 없습니다</td></tr>
              ) : (
                filtered.map((member, idx) => {
                  const isSeller = sellerUserIds.has(member.id);
                  return (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="p-4 text-muted-foreground">{idx + 1}</td>
                      <td className="p-4 font-medium">{member.name}</td>
                      <td className="p-4 text-muted-foreground">{member.email}</td>
                      <td className="p-4">{member.phone || "-"}</td>
                      <td className="p-4">{new Date(member.created_at).toLocaleDateString("ko-KR")}</td>
                      <td className="p-4">{member.order_count}건</td>
                      <td className="p-4">₩{formatPrice(member.total_spent)}</td>
                      <td className="p-4">
                        {isSeller ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5">
                            <Store className="h-3 w-3" /> 판매자
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isSuperAdmin ? (
                          <Select
                            value={member.assigned_admin_id || "none"}
                            onValueChange={(v) => changeAssignedAdmin(member.id, v)}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">미배정</SelectItem>
                              {admins.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs">{getAdminName(member.assigned_admin_id)}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status] || ""}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(member)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openChatWithMember(member)} title="채팅">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">이름:</span> <span className="font-medium">{selectedMember.name}</span></div>
                <div><span className="text-muted-foreground">이메일:</span> {selectedMember.email}</div>
                <div><span className="text-muted-foreground">연락처:</span> {selectedMember.phone || "-"}</div>
                <div><span className="text-muted-foreground">가입일:</span> {new Date(selectedMember.created_at).toLocaleDateString("ko-KR")}</div>
                <div><span className="text-muted-foreground">주문 수:</span> {selectedMember.order_count}건</div>
                <div><span className="text-muted-foreground">총 결제:</span> ₩{formatPrice(selectedMember.total_spent)}</div>
                <div>
                  <span className="text-muted-foreground">판매자 여부:</span>{" "}
                  {sellerUserIds.has(selectedMember.id) ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">승인됨</Badge>
                  ) : "일반회원"}
                </div>
                <div>
                  <span className="text-muted-foreground">담당자:</span>{" "}
                  {isSuperAdmin ? (
                    <Select
                      value={selectedMember.assigned_admin_id || "none"}
                      onValueChange={(v) => changeAssignedAdmin(selectedMember.id, v)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs inline-flex ml-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">미배정</SelectItem>
                        {admins.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{getAdminName(selectedMember.assigned_admin_id)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">상태 변경:</span>
                {(["활성", "휴면", "탈퇴"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={selectedMember.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeStatus(selectedMember.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openChatWithMember(selectedMember)}>
                  <MessageSquare className="h-4 w-4" /> 채팅 보내기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMembers;
