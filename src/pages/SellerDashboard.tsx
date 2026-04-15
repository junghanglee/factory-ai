import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, X, Package, BarChart3, Clock, Store, Eye, Wallet, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ImageUploader from "@/components/admin/ImageUploader";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import SimpleRichEditor from "@/components/admin/SimpleRichEditor";
import SellerNotificationBell from "@/components/seller/SellerNotificationBell";
import SellerChatTab from "@/components/seller/SellerChatTab";
import SellerSettlementTab from "@/components/seller/SellerSettlementTab";

interface PackageForm {
  id?: string;
  name: string;
  price: number;
  price_text: string;
  delivery_days: number;
  revisions: number;
  features: string[];
  sort_order: number;
}

const emptyPackage = (name: string, order: number): PackageForm => ({
  name, price: 0, price_text: "", delivery_days: 1, revisions: 1, features: [""], sort_order: order,
});

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [pkgForms, setPkgForms] = useState<PackageForm[]>([]);

  // Fetch seller profile
  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch seller's services
  const { data: myServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["seller-services", sellerProfile?.id],
    queryFn: async () => {
      if (!sellerProfile) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*, service_packages(*)")
        .eq("seller_id", sellerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Stats computed from settlements in SellerSettlementTab; keep simple stats here
  const totalRevenue = sellerProfile?.total_revenue || 0;
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">판매자 대시보드</h1>
          <p className="text-muted-foreground">로그인이 필요합니다.</p>
          <Button onClick={() => navigate("/login")}>로그인하기</Button>
        </div>
      </MainLayout>
    );
  }

  if (!sellerProfile) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">판매자 등록이 필요합니다</h1>
          <p className="text-muted-foreground">먼저 판매자 신청을 해주세요.</p>
          <Button onClick={() => navigate("/seller/apply")}>판매자 신청하기</Button>
        </div>
      </MainLayout>
    );
  }

  if (sellerProfile.status !== "승인") {
    const statusMsg: Record<string, string> = {
      "신청": "판매자 신청이 검토 중입니다. 승인 후 서비스 등록이 가능합니다.",
      "반려": "판매자 신청이 반려되었습니다. 자세한 내용은 고객센터에 문의해주세요.",
      "정지": "판매자 계정이 정지되었습니다. 자세한 내용은 고객센터에 문의해주세요.",
    };
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">판매자 대시보드</h1>
          <Badge variant="secondary" className="text-base px-4 py-1">{sellerProfile.status}</Badge>
          <p className="text-muted-foreground text-center max-w-md">{statusMsg[sellerProfile.status] || ""}</p>
          <Button variant="outline" onClick={() => navigate("/")}>홈으로</Button>
        </div>
      </MainLayout>
    );
  }

  // === Approved seller functionality ===

  const openNew = () => {
    setEditId(null);
    setForm({
      category_id: categories[0]?.id || "", title: "", description: "", detailed_description: "",
      thumbnail: "", price: 0, original_price: 0, delivery_days: 1,
      tags: [], portfolio_images: [],
    });
    setPkgForms([emptyPackage("Basic", 1)]);
    setEditOpen(true);
  };

  const openEdit = (svc: any) => {
    setEditId(svc.id);
    setForm({
      category_id: svc.category_id || "", title: svc.title, description: svc.description || "",
      detailed_description: svc.detailed_description || "", thumbnail: svc.thumbnail || "",
      price: svc.price, original_price: svc.original_price, delivery_days: svc.delivery_days,
      tags: svc.tags || [], portfolio_images: svc.portfolio_images || [],
    });
    const pkgs = svc.service_packages || [];
    setPkgForms(
      pkgs.length > 0
        ? pkgs.map((p: any) => ({
            id: p.id, name: p.name, price: p.price, price_text: p.price_text || "",
            delivery_days: p.delivery_days, revisions: p.revisions,
            features: p.features?.length ? p.features : [""], sort_order: p.sort_order,
          }))
        : [emptyPackage("Basic", 1)]
    );
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error("서비스명을 입력해주세요."); return; }
    if (!form.category_id) { toast.error("카테고리를 선택해주세요."); return; }

    try {
      let serviceId = editId;
      const serviceData = {
        category_id: form.category_id, title: form.title, description: form.description,
        detailed_description: form.detailed_description, thumbnail: form.thumbnail,
        price: form.price, original_price: form.original_price, delivery_days: form.delivery_days,
        seller: sellerProfile.business_name, tags: form.tags, portfolio_images: form.portfolio_images,
        seller_id: sellerProfile.id,
      };

      if (editId) {
        const { error } = await supabase.from("services").update(serviceData).eq("id", editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("services").insert(serviceData).select("id").single();
        if (error) throw error;
        serviceId = data.id;
      }

      if (serviceId) {
        await supabase.from("service_packages").delete().eq("service_id", serviceId);
        const pkgInserts = pkgForms.filter(p => p.name).map(p => ({
          service_id: serviceId!,
          name: p.name, price: p.price, price_text: p.price_text || null,
          delivery_days: p.delivery_days, revisions: p.revisions,
          features: p.features.filter(Boolean), sort_order: p.sort_order,
        }));
        if (pkgInserts.length > 0) {
          const { error } = await supabase.from("service_packages").insert(pkgInserts);
          if (error) throw error;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["seller-services"] });
      toast.success(editId ? "서비스가 수정되었습니다." : "서비스가 등록되었습니다.");
      setEditOpen(false);
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await supabase.from("service_packages").delete().eq("service_id", id);
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["seller-services"] });
      toast.success("삭제되었습니다.");
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message);
    }
  };

  const updatePkg = (idx: number, field: string, value: any) => {
    setPkgForms(prev => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const updatePkgFeature = (pkgIdx: number, featIdx: number, value: string) => {
    setPkgForms(prev => prev.map((p, i) => {
      if (i !== pkgIdx) return p;
      const features = [...p.features];
      features[featIdx] = value;
      return { ...p, features };
    }));
  };

  const addPkgFeature = (pkgIdx: number) => {
    setPkgForms(prev => prev.map((p, i) => (i === pkgIdx ? { ...p, features: [...p.features, ""] } : p)));
  };

  const addPackage = () => {
    if (pkgForms.length >= 5) return;
    setPkgForms(prev => [...prev, emptyPackage(`패키지 ${prev.length + 1}`, prev.length + 1)]);
  };

  const removePackage = (idx: number) => {
    if (pkgForms.length <= 1) return;
    setPkgForms(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sort_order: i + 1 })));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-secondary/30 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                판매자 대시보드
              </h1>
              <p className="text-muted-foreground mt-1">{sellerProfile.business_name}님, 환영합니다</p>
            </div>
            <div className="flex items-center gap-2">
              <SellerNotificationBell sellerId={sellerProfile.id} />
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" /> 새 서비스 등록
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">등록 서비스</p>
                  <p className="text-2xl font-bold">{myServices.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">총 매출</p>
                  <p className="text-2xl font-bold">{formatPrice(sellerProfile.total_revenue || 0)}원</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-sm text-muted-foreground">정산 완료</p>
                  <p className="text-2xl font-bold">{formatPrice(totalSettled)}원</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">정산 대기</p>
                  <p className="text-2xl font-bold">{formatPrice(totalPending)}원</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Services & Settlements */}
          <Tabs defaultValue="services">
            <TabsList className="mb-4">
              <TabsTrigger value="services">내 서비스</TabsTrigger>
              <TabsTrigger value="chat">고객 채팅</TabsTrigger>
              <TabsTrigger value="settlements">정산 내역</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>내 서비스 목록</CardTitle>
                  <CardDescription>등록한 서비스를 관리하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                  ) : myServices.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">등록된 서비스가 없습니다</p>
                      <Button className="mt-4" onClick={openNew}>첫 서비스 등록하기</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myServices.map((svc: any) => (
                        <div key={svc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-secondary/30 transition-colors">
                          <img src={svc.thumbnail || "/placeholder.svg"} alt="" className="w-16 h-12 rounded object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{svc.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{categories.find(c => c.id === svc.category_id)?.name || "-"}</span>
                              <span>·</span>
                              <span>{formatPrice(svc.price)}원</span>
                              <span>·</span>
                              <span>패키지 {svc.service_packages?.length || 0}개</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/service/${svc.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(svc)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(svc.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <SellerChatTab sellerId={sellerProfile.id} />
            </TabsContent>

            <TabsContent value="settlements">
              <Card>
                <CardHeader>
                  <CardTitle>정산 내역</CardTitle>
                  <CardDescription>주문별 정산 현황을 확인하세요 (수수료율: {sellerProfile.commission_rate}%)</CardDescription>
                </CardHeader>
                <CardContent>
                  {settlementsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                  ) : settlements.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">정산 내역이 없습니다</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문번호</TableHead>
                          <TableHead>서비스</TableHead>
                          <TableHead className="text-right">주문금액</TableHead>
                          <TableHead className="text-right">수수료</TableHead>
                          <TableHead className="text-right">정산금액</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>정산일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlements.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{s.projects?.order_number || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{s.projects?.service_title || "-"}</TableCell>
                            <TableCell className="text-right">{formatPrice(s.order_amount)}원</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatPrice(s.commission_amount)}원</TableCell>
                            <TableCell className="text-right font-medium">{formatPrice(s.seller_amount)}원</TableCell>
                            <TableCell>
                              <Badge variant={s.status === "완료" ? "default" : s.status === "취소" ? "destructive" : "secondary"}>
                                {s.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {s.settled_at ? new Date(s.settled_at).toLocaleDateString("ko-KR") : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "서비스 수정" : "새 서비스 등록"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">기본 정보</TabsTrigger>
              <TabsTrigger value="packages" className="flex-1">패키지 설정 ({pkgForms.length}개)</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label className="mb-2 block">대표이미지</Label>
                <ImageUploader
                  value={form.thumbnail || ""}
                  onChange={(url) => setForm((prev: any) => ({ ...prev, thumbnail: url }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>서비스명 <span className="text-red-500">*</span></Label>
                  <Input value={form.title || ""} onChange={e => setForm((prev: any) => ({ ...prev, title: e.target.value }))} />
                </div>
                <div>
                  <Label>카테고리 <span className="text-red-500">*</span></Label>
                  <select
                    className="w-full h-10 border rounded-md px-3 text-sm bg-background"
                    value={form.category_id || ""}
                    onChange={e => setForm((prev: any) => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>간단 설명</Label>
                <Input value={form.description || ""} onChange={e => setForm((prev: any) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-2 block">상세 설명</Label>
                <SimpleRichEditor
                  value={form.detailed_description || ""}
                  onChange={html => setForm((prev: any) => ({ ...prev, detailed_description: html }))}
                  placeholder="서비스 상세 설명을 입력하세요..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>판매 가격 (원)</Label>
                  <Input type="number" value={form.price || 0} onChange={e => setForm((prev: any) => ({ ...prev, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>정가 (원)</Label>
                  <Input type="number" value={form.original_price || 0} onChange={e => setForm((prev: any) => ({ ...prev, original_price: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>납기일 (일)</Label>
                <Input type="number" value={form.delivery_days || 1} onChange={e => setForm((prev: any) => ({ ...prev, delivery_days: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>태그 (쉼표 구분)</Label>
                <Input value={(form.tags || []).join(", ")} onChange={e => setForm((prev: any) => ({ ...prev, tags: e.target.value.split(",").map((t: string) => t.trim()) }))} />
              </div>
              <div>
                <Label className="mb-2 block">포트폴리오 이미지</Label>
                <MultiImageUploader
                  value={form.portfolio_images || []}
                  onChange={urls => setForm((prev: any) => ({ ...prev, portfolio_images: urls }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">최소 1개, 최대 5개까지 등록 가능합니다.</p>
                {pkgForms.length < 5 && (
                  <Button variant="outline" size="sm" onClick={addPackage}>
                    <Plus className="h-4 w-4 mr-1" /> 패키지 추가
                  </Button>
                )}
              </div>
              {pkgForms.map((pkg, pkgIdx) => (
                <Card key={pkgIdx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{pkg.name || `패키지 ${pkgIdx + 1}`}</h3>
                      {pkgForms.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePackage(pkgIdx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>패키지명</Label>
                        <Input value={pkg.name} onChange={e => updatePkg(pkgIdx, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input
                          value={pkg.price_text || (pkg.price === 0 ? "" : String(pkg.price))}
                          onChange={e => {
                            const v = e.target.value;
                            const num = Number(v);
                            if (v === "" || (!isNaN(num) && v.trim() !== "")) {
                              updatePkg(pkgIdx, "price", v === "" ? 0 : num);
                              updatePkg(pkgIdx, "price_text", "");
                            } else {
                              updatePkg(pkgIdx, "price_text", v);
                              updatePkg(pkgIdx, "price", 0);
                            }
                          }}
                          placeholder="숫자 또는 텍스트"
                        />
                      </div>
                      <div>
                        <Label>납기(일)</Label>
                        <Input type="number" value={pkg.delivery_days} onChange={e => updatePkg(pkgIdx, "delivery_days", Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>수정횟수</Label>
                        <Input type="number" value={pkg.revisions} onChange={e => updatePkg(pkgIdx, "revisions", Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>주요 특징</Label>
                      <div className="space-y-2">
                        {pkg.features.map((feat, featIdx) => (
                          <Input key={featIdx} value={feat} onChange={e => updatePkgFeature(pkgIdx, featIdx, e.target.value)} placeholder={`특징 ${featIdx + 1}`} />
                        ))}
                        {pkg.features.length < 8 && (
                          <Button variant="outline" size="sm" onClick={() => addPkgFeature(pkgIdx)}>+ 항목 추가</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="w-full gap-2 mt-4">
            <Save className="h-4 w-4" /> 저장
          </Button>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SellerDashboard;
