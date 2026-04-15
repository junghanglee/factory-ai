import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, XCircle, FileText, Image, ExternalLink, Store } from "lucide-react";

const statusColors: Record<string, string> = {
  "신청": "bg-yellow-100 text-yellow-800",
  "승인": "bg-green-100 text-green-800",
  "반려": "bg-red-100 text-red-800",
  "정지": "bg-gray-100 text-gray-800",
};

const AdminSellers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("seller_profiles")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      // If approving, also add seller role
      if (status === "승인" && selectedSeller) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: selectedSeller.user_id, role: "seller" as any },
            { onConflict: "user_id,role" }
          );
        if (roleError) console.error("Role assignment error:", roleError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });
      toast.success("상태가 변경되었습니다.");
      setSelectedSeller(null);
    },
    onError: (err: any) => toast.error("오류: " + err.message),
  });

  const filtered = sellers.filter((s: any) => {
    const matchSearch = !search || s.business_name?.includes(search) || s.phone?.includes(search);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDocuments = (seller: any): string[] => {
    try {
      const info = JSON.parse(seller.bank_info || "{}");
      return info.documents || [];
    } catch {
      return [];
    }
  };

  const stats = {
    total: sellers.length,
    pending: sellers.filter((s: any) => s.status === "신청").length,
    approved: sellers.filter((s: any) => s.status === "승인").length,
    rejected: sellers.filter((s: any) => s.status === "반려").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              판매자 관리
            </h1>
            <p className="text-muted-foreground mt-1">판매자 신청을 검토하고 승인/반려합니다</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "전체", value: stats.total, color: "text-foreground" },
            { label: "신청 대기", value: stats.pending, color: "text-yellow-600" },
            { label: "승인됨", value: stats.approved, color: "text-green-600" },
            { label: "반려됨", value: stats.rejected, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="상호명, 연락처 검색..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {["all", "신청", "승인", "반려", "정지"].map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === "all" ? "전체" : s}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상호명</TableHead>
                  <TableHead>자기소개</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>첨부자료</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      판매자 신청이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((seller: any) => {
                    const docs = getDocuments(seller);
                    return (
                      <TableRow key={seller.id}>
                        <TableCell className="font-medium">{seller.business_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {seller.bio || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{seller.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{docs.length}건</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(seller.created_at).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[seller.status] || ""}>
                            {seller.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSeller(seller)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSeller} onOpenChange={() => setSelectedSeller(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>판매자 신청 상세</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">상호명</Label>
                  <p className="font-medium">{selectedSeller.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">연락처</Label>
                  <p className="font-medium">{selectedSeller.phone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">신청일</Label>
                  <p>{new Date(selectedSeller.created_at).toLocaleString("ko-KR")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">상태</Label>
                  <Badge className={statusColors[selectedSeller.status] || ""}>
                    {selectedSeller.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">자기소개 / 전문 분야</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">
                  {selectedSeller.bio || "내용 없음"}
                </p>
              </div>

              {/* Documents */}
              <div>
                <Label className="text-muted-foreground text-xs">첨부된 역량 증빙 자료</Label>
                <div className="mt-2 space-y-2">
                  {getDocuments(selectedSeller).length === 0 ? (
                    <p className="text-sm text-muted-foreground">첨부된 자료가 없습니다</p>
                  ) : (
                    getDocuments(selectedSeller).map((url: string, idx: number) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          {isImage ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`자료 ${idx + 1}`} className="w-full max-h-60 object-contain bg-secondary/30" />
                            </a>
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-orange-500" />
                              <span className="text-sm flex-1 truncate">자료 {idx + 1}</span>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedSeller.status === "신청" && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "승인" })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      승인
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          toast.error("반려 사유를 입력해주세요.");
                          return;
                        }
                        updateStatus.mutate({ id: selectedSeller.id, status: "반려" });
                      }}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      반려
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">반려 시 사유</Label>
                    <Textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요 (반려 시 필수)"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {selectedSeller.status === "승인" && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "정지" })}
                    disabled={updateStatus.isPending}
                  >
                    판매자 정지
                  </Button>
                </div>
              )}

              {selectedSeller.status === "정지" && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => updateStatus.mutate({ id: selectedSeller.id, status: "승인" })}
                    disabled={updateStatus.isPending}
                  >
                    정지 해제
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellers;
