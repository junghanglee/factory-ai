import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit, Trash2, Save, X, Star, ShieldCheck, Store } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCategories, useAllServicesWithPackages } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "@/components/admin/ImageUploader";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import SimpleRichEditor from "@/components/admin/SimpleRichEditor";
import FeedbackFieldsEditor from "@/components/admin/FeedbackFieldsEditor";
import ReviewManager from "@/components/admin/ReviewManager";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

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

const AdminServices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: servicesData = [], isLoading } = useAllServicesWithPackages();
  const { data: categories = [] } = useCategories();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [pkgForms, setPkgForms] = useState<PackageForm[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewService, setReviewService] = useState<{ id: string; title: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "admin" | "seller">("all");

  const openNew = () => {
    setEditId(null);
    setForm({
      category_id: categories[0]?.id || "", title: "", description: "", detailed_description: "",
      thumbnail: "", price: 0, original_price: 0, rating: 5.0, review_count: 0, delivery_days: 1,
      seller: "", tags: [], portfolio_images: [],
    });
    setPkgForms([emptyPackage("Basic", 1)]);
    setEditOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "new" && categories.length > 0 && !editOpen) {
      openNew();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, categories]);

  const openEdit = (svc: typeof servicesData[0]) => {
    setEditId(svc.id);
    setForm({
      category_id: svc.category_id || "", title: svc.title, description: svc.description || "",
      detailed_description: svc.detailed_description || "", thumbnail: svc.thumbnail || "",
      price: svc.price, original_price: svc.original_price, rating: svc.rating,
      review_count: svc.review_count, delivery_days: svc.delivery_days, seller: svc.seller || "",
      tags: svc.tags || [], portfolio_images: svc.portfolio_images || [],
    });
    setPkgForms(
      svc.packages.length > 0
        ? svc.packages.map((p) => ({ id: p.id, name: p.name, price: p.price, delivery_days: p.delivery_days, revisions: p.revisions, features: p.features?.length ? p.features : [""], sort_order: p.sort_order }))
            .map((p: any) => ({ ...p, price_text: (svc.packages.find((sp: any) => sp.id === p.id) as any)?.price_text ?? "" }))
        : [emptyPackage("Basic", 1)]
    );
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      let serviceId = editId;
      const serviceData = {
        category_id: form.category_id, title: form.title, description: form.description,
        detailed_description: form.detailed_description, thumbnail: form.thumbnail,
        price: form.price, original_price: form.original_price, delivery_days: form.delivery_days,
        seller: form.seller, tags: form.tags, portfolio_images: form.portfolio_images,
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
        const pkgInserts = pkgForms.filter((p) => p.name).map((p) => ({
          service_id: serviceId!,
          name: p.name,
          price: p.price,
          price_text: p.price_text || null,
          delivery_days: p.delivery_days,
          revisions: p.revisions,
          features: p.features.filter(Boolean),
          sort_order: p.sort_order,
        }));
        if (pkgInserts.length > 0) {
          const { error } = await supabase.from("service_packages").insert(pkgInserts);
          if (error) throw error;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(editId ? "서비스가 수정되었습니다." : "서비스가 등록되었습니다.");
      setEditOpen(false);
    } catch (err: any) {
      toast.error("저장 실패: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await supabase.from("display_group_services").delete().eq("service_id", id);
      await supabase.from("feedback_fields").delete().eq("service_id", id);
      await supabase.from("service_packages").delete().eq("service_id", id);
      await supabase.from("chat_rooms").update({ service_id: null }).eq("service_id", id);
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("삭제되었습니다.");
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("services").update({ active: !current } as any).eq("id", id);
    if (error) { toast.error("변경 실패"); return; }
    queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
    toast.success(!current ? "노출 설정됨" : "비노출 설정됨");
  };

  const toggleApproval = async (id: string, current: string) => {
    const next = current === "승인" ? "반려" : "승인";
    const { error } = await supabase.from("services").update({ approval_status: next } as any).eq("id", id);
    if (error) { toast.error("변경 실패"); return; }
    queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
    toast.success(next === "승인" ? "콘텐츠가 승인되었습니다" : "콘텐츠가 반려되었습니다");
  };

  const updatePkg = (idx: number, field: string, value: any) => {
    setPkgForms((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const updatePkgFeature = (pkgIdx: number, featIdx: number, value: string) => {
    setPkgForms((prev) => prev.map((p, i) => {
      if (i !== pkgIdx) return p;
      const features = [...p.features];
      features[featIdx] = value;
      return { ...p, features };
    }));
  };

  const addPkgFeature = (pkgIdx: number) => {
    setPkgForms((prev) => prev.map((p, i) => (i === pkgIdx ? { ...p, features: [...p.features, ""] } : p)));
  };

  const addPackage = () => {
    if (pkgForms.length >= 5) return;
    setPkgForms((prev) => [...prev, emptyPackage(`패키지 ${prev.length + 1}`, prev.length + 1)]);
  };

  const removePackage = (idx: number) => {
    if (pkgForms.length <= 1) return;
    setPkgForms((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, sort_order: i + 1 })));
  };

  const filteredServices = servicesData.filter((svc) => {
    if (typeFilter === "admin") return !svc.seller_id;
    if (typeFilter === "seller") return !!svc.seller_id;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 서비스 등록</Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-4">
        {([["all", "전체"], ["admin", "AI팩토리"], ["seller", "인증판매자"]] as const).map(([key, label]) => (
          <Button key={key} size="sm" variant={typeFilter === key ? "default" : "outline"} onClick={() => setTypeFilter(key)}>
            {label}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">총 {filteredServices.length}개</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                 <th className="text-left p-4 font-medium text-muted-foreground">구분</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">서비스</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">등록자</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">카테고리</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">가격</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">패키지</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">평점</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">피드백</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">승인</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">노출</th>
                   <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((svc) => {
                  const isSellerService = !!svc.seller_id;
                  const isActive = (svc as any).active !== false;
                  const approvalStatus = (svc as any).approval_status || "승인";
                  return (
                    <tr key={svc.id} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="p-4">
                        {isSellerService ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5">
                            <Store className="h-3 w-3" /> 판매자
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-0.5">
                            <ShieldCheck className="h-3 w-3" /> 팩토리
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={svc.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-9 rounded object-cover" />
                          <span className="font-medium truncate max-w-[200px] block">{svc.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {(svc as any).seller_profile_name || svc.seller || "AI팩토리"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {categories.find((c) => c.id === svc.category_id)?.name || "-"}
                      </td>
                      <td className="p-4">{formatPrice(svc.price)}원</td>
                      <td className="p-4">
                        <button
                          className="flex gap-1 hover:opacity-70 transition-opacity"
                          onClick={() => openEdit(svc)}
                          title="패키지 수정"
                        >
                          {svc.packages.length > 0 ? svc.packages.map((pkg: any) => (
                            <span key={pkg.id} className="px-1.5 py-0.5 bg-secondary rounded text-xs cursor-pointer">{pkg.name}</span>
                          )) : <span className="text-xs text-muted-foreground">없음</span>}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                          onClick={() => { setReviewService({ id: svc.id, title: svc.title }); setReviewOpen(true); }}
                          title="평점 관리"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{svc.rating}</span>
                          <span className="text-muted-foreground">({svc.review_count})</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-muted-foreground">{(svc as any).feedback_count || 0}개 항목</span>
                      </td>
                      <td className="p-4">
                        {isSellerService ? (
                          <Switch
                            checked={approvalStatus === "승인"}
                            onCheckedChange={() => toggleApproval(svc.id, approvalStatus)}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleActive(svc.id, isActive)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(svc)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(svc.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
              <TabsTrigger value="feedback" className="flex-1">피드백 설정</TabsTrigger>
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
                  <Label>서비스명</Label>
                  <Input value={form.title || ""} onChange={(e) => { const v = e.target.value; setForm((prev: any) => ({ ...prev, title: v })); }} />
                </div>
                <div>
                  <Label>카테고리</Label>
                  <select
                    className="w-full h-10 border rounded-md px-3 text-sm bg-background"
                    value={form.category_id || ""}
                    onChange={(e) => { const v = e.target.value; setForm((prev: any) => ({ ...prev, category_id: v })); }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>간단 설명</Label>
                <Input value={form.description || ""} onChange={(e) => { const v = e.target.value; setForm((prev: any) => ({ ...prev, description: v })); }} />
              </div>
              <div>
                <Label className="mb-2 block">상세 설명</Label>
                <SimpleRichEditor
                  value={form.detailed_description || ""}
                  onChange={(html) => setForm((prev: any) => ({ ...prev, detailed_description: html }))}
                  placeholder="서비스 상세 설명을 입력하세요..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>판매자</Label>
                  <Input value={form.seller || ""} onChange={(e) => { const v = e.target.value; setForm((prev: any) => ({ ...prev, seller: v })); }} />
                </div>
                <div>
                  <Label>납기일(일) - 제작 평균기간</Label>
                  <Input type="number" value={form.delivery_days || 1} onChange={(e) => { const v = Number(e.target.value); setForm((prev: any) => ({ ...prev, delivery_days: v })); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>AI팩토리 평균가격</Label>
                  <Input type="number" value={form.price || 0} onChange={(e) => { const v = Number(e.target.value); setForm((prev: any) => ({ ...prev, price: v })); }} />
                </div>
                <div>
                  <Label>AGENCY 평균가격</Label>
                  <Input type="number" value={form.original_price || 0} onChange={(e) => { const v = Number(e.target.value); setForm((prev: any) => ({ ...prev, original_price: v })); }} />
                </div>
              </div>
              <div>
                <Label>검색 키워드 / 태그 (쉼표 구분)</Label>
                <Input value={(form.tags || []).join(", ")} onChange={(e) => { const v = e.target.value.split(",").map((t: string) => t.trim()); setForm((prev: any) => ({ ...prev, tags: v })); }} />
              </div>
              <div>
                <Label className="mb-2 block">포트폴리오 이미지</Label>
                <MultiImageUploader
                  value={form.portfolio_images || []}
                  onChange={(urls) => setForm((prev: any) => ({ ...prev, portfolio_images: urls }))}
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
                        <Input value={pkg.name} onChange={(e) => updatePkg(pkgIdx, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input
                          value={pkg.price_text || (pkg.price === 0 ? "" : String(pkg.price))}
                          onChange={(e) => {
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
                          placeholder="숫자 또는 텍스트 (예: 협의)"
                        />
                      </div>
                      <div>
                        <Label>납기(일)</Label>
                        <Input type="number" value={pkg.delivery_days} onChange={(e) => updatePkg(pkgIdx, "delivery_days", Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>수정횟수</Label>
                        <Input type="number" value={pkg.revisions} onChange={(e) => updatePkg(pkgIdx, "revisions", Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>주요 특징</Label>
                      <div className="space-y-2">
                        {pkg.features.map((feat, featIdx) => (
                          <Input
                            key={featIdx}
                            value={feat}
                            onChange={(e) => updatePkgFeature(pkgIdx, featIdx, e.target.value)}
                            placeholder={`특징 ${featIdx + 1}`}
                          />
                        ))}
                        {pkg.features.length < 8 && (
                          <Button variant="outline" size="sm" onClick={() => addPkgFeature(pkgIdx)}>
                            + 항목 추가
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="feedback" className="mt-4">
              {editId ? (
                <FeedbackFieldsEditor serviceId={editId} categoryId={form.category_id || null} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">서비스를 먼저 저장한 후 피드백 항목을 설정할 수 있습니다.</p>
              )}
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="w-full gap-2 mt-4">
            <Save className="h-4 w-4" /> 저장
          </Button>
        </DialogContent>
      </Dialog>

      {reviewService && (
        <ReviewManager
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          serviceId={reviewService.id}
          serviceTitle={reviewService.title}
        />
      )}
    </AdminLayout>
  );
};

export default AdminServices;
