import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, useAllServicesWithPackages, type DbServicePackage } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

interface PackageForm {
  id?: string;
  name: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  sort_order: number;
}

const emptyPackage = (name: string, order: number): PackageForm => ({
  name, price: 0, delivery_days: 1, revisions: 1, features: [""], sort_order: order,
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

  const openNew = () => {
    setEditId(null);
    setForm({
      category_id: categories[0]?.id || "", title: "", description: "", detailed_description: "",
      thumbnail: "", price: 0, original_price: 0, rating: 5.0, review_count: 0, delivery_days: 1,
      seller: "", tags: [], portfolio_images: [],
    });
    setPkgForms([emptyPackage("Basic", 1), emptyPackage("Standard", 2), emptyPackage("Premium", 3)]);
    setEditOpen(true);
  };

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
        ? svc.packages.map((p) => ({ id: p.id, name: p.name, price: p.price, delivery_days: p.delivery_days, revisions: p.revisions, features: p.features || [""], sort_order: p.sort_order }))
        : [emptyPackage("Basic", 1), emptyPackage("Standard", 2), emptyPackage("Premium", 3)]
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

      // Delete existing packages and re-insert
      if (serviceId) {
        await supabase.from("service_packages").delete().eq("service_id", serviceId);
        const pkgInserts = pkgForms.filter((p) => p.name).map((p) => ({
          service_id: serviceId!,
          name: p.name,
          price: p.price,
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
      await supabase.from("service_packages").delete().eq("service_id", id);
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["services_with_packages"] });
      toast.success("삭제되었습니다.");
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message);
    }
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> 새 서비스 등록</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">서비스</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">카테고리</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">가격 (Basic)</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">패키지</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">평점</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {servicesData.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={svc.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-9 rounded object-cover" />
                        <span className="font-medium truncate max-w-[200px]">{svc.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {categories.find((c) => c.id === svc.category_id)?.name || "-"}
                    </td>
                    <td className="p-4">{formatPrice(svc.price)}원</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {svc.packages.map((pkg) => (
                          <span key={pkg.id} className="px-1.5 py-0.5 bg-secondary rounded text-xs">{pkg.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">{svc.rating}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(svc)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(svc.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "서비스 수정" : "새 서비스 등록"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">기본 정보</TabsTrigger>
              <TabsTrigger value="packages" className="flex-1">패키지 설정 (3종)</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>서비스명</Label>
                  <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>카테고리</Label>
                  <select
                    className="w-full h-10 border rounded-md px-3 text-sm bg-background"
                    value={form.category_id || ""}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>간단 설명</Label>
                <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>상세 설명</Label>
                <Textarea value={form.detailed_description || ""} onChange={(e) => setForm({ ...form, detailed_description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>대표이미지 URL</Label>
                  <Input value={form.thumbnail || ""} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
                </div>
                <div>
                  <Label>판매자</Label>
                  <Input value={form.seller || ""} onChange={(e) => setForm({ ...form, seller: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>기본 가격</Label>
                  <Input type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>원래 가격</Label>
                  <Input type="number" value={form.original_price || 0} onChange={(e) => setForm({ ...form, original_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>납기일(일)</Label>
                  <Input type="number" value={form.delivery_days || 1} onChange={(e) => setForm({ ...form, delivery_days: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>검색 키워드 / 태그 (쉼표 구분)</Label>
                <Input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t: string) => t.trim()) })} />
              </div>
              <div>
                <Label>포트폴리오 이미지 URL (줄바꿈 구분)</Label>
                <Textarea
                  value={(form.portfolio_images || []).join("\n")}
                  onChange={(e) => setForm({ ...form, portfolio_images: e.target.value.split("\n").map((t: string) => t.trim()).filter(Boolean) })}
                  rows={3}
                  placeholder="https://... (한 줄에 하나씩)"
                />
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6 mt-4">
              {pkgForms.map((pkg, pkgIdx) => (
                <Card key={pkgIdx}>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm">{pkg.name || `패키지 ${pkgIdx + 1}`}</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>패키지명</Label>
                        <Input value={pkg.name} onChange={(e) => updatePkg(pkgIdx, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input type="number" value={pkg.price} onChange={(e) => updatePkg(pkgIdx, "price", Number(e.target.value))} />
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
                      <Label>주요 특징 (최대 5개)</Label>
                      <div className="space-y-2">
                        {pkg.features.map((feat, featIdx) => (
                          <Input
                            key={featIdx}
                            value={feat}
                            onChange={(e) => updatePkgFeature(pkgIdx, featIdx, e.target.value)}
                            placeholder={`특징 ${featIdx + 1}`}
                          />
                        ))}
                        {pkg.features.length < 5 && (
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
          </Tabs>

          <Button onClick={handleSave} className="w-full gap-2 mt-4">
            <Save className="h-4 w-4" /> 저장
          </Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminServices;
