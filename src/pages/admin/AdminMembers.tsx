import { useState } from "react";
import { Search, Eye, Ban, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { members as initialMembers, type Member } from "@/data/members";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const statusColors: Record<string, string> = {
  "활성": "bg-green-100 text-green-700",
  "휴면": "bg-amber-100 text-amber-700",
  "탈퇴": "bg-red-100 text-red-700",
};

const AdminMembers = () => {
  const [memberList, setMemberList] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filtered = memberList.filter((m) => {
    const matchSearch = m.name.includes(search) || m.email.includes(search);
    const matchStatus = statusFilter === "전체" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (m: Member) => {
    setSelectedMember(m);
    setDetailOpen(true);
  };

  const changeStatus = (id: string, status: Member["status"]) => {
    setMemberList((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (selectedMember?.id === id) setSelectedMember({ ...selectedMember, status });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">회원 관리</h1>

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
                <th className="text-left p-4 font-medium text-muted-foreground">이름</th>
                <th className="text-left p-4 font-medium text-muted-foreground">이메일</th>
                <th className="text-left p-4 font-medium text-muted-foreground">연락처</th>
                <th className="text-left p-4 font-medium text-muted-foreground">가입일</th>
                <th className="text-left p-4 font-medium text-muted-foreground">주문</th>
                <th className="text-left p-4 font-medium text-muted-foreground">총 결제</th>
                <th className="text-left p-4 font-medium text-muted-foreground">상태</th>
                <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="p-4 font-medium">{member.name}</td>
                  <td className="p-4 text-muted-foreground">{member.email}</td>
                  <td className="p-4">{member.phone}</td>
                  <td className="p-4">{member.joinDate}</td>
                  <td className="p-4">{member.orderCount}건</td>
                  <td className="p-4">₩{formatPrice(member.totalSpent)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(member)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
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
                <div><span className="text-muted-foreground">연락처:</span> {selectedMember.phone}</div>
                <div><span className="text-muted-foreground">가입일:</span> {selectedMember.joinDate}</div>
                <div><span className="text-muted-foreground">주문 수:</span> {selectedMember.orderCount}건</div>
                <div><span className="text-muted-foreground">총 결제:</span> ₩{formatPrice(selectedMember.totalSpent)}</div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMembers;
