import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Save } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { services as initialServices, type Service, type ServicePackage } from "@/data/services";
import { categories } from "@/data/categories";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const emptyPackage = (): ServicePackage => ({ name: "", price: 0, deliveryDays: 1, revisions: 1, features: [""] });

const AdminServices = () => {
  const [serviceList, setServiceList] = useState<Service[]>(initialServices);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Service>>({});

  const openNew = () => {
    setEditIdx(null);
    setForm({
      id: "", categoryId: categories[0]?.id || "", title: "", description: "", detailedDescription: "",
      thumbnail: "", price: 0, originalPrice: 0, rating: 5.0, reviewCount: 0, deliveryDays: 1,
      seller: "", tags: [], packages: [
        { name: "Basic", price: 0, deliveryDays: 1, revisions: 1, features: [""] },
        { name: "Standard", price: 0, deliveryDays: 2, revisions: 2, features: [""] },
        { name: "Premium", price: 0, deliveryDays: 3, revisions: 3, features: [""] },
      ],
      portfolioImages: [],
    });
    setEditOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditIdx(idx);
    setForm({ ...serviceList[idx] });
    setEditOpen(true);
  };

  const handleSave = () => {
    const svc = { ...form, id: form.id || `s-${Date.now()}` } as Service;
    if (editIdx !== null) {
      setServiceList((prev) => prev.map((s, i) => (i === editIdx ? svc : s)));
    } else {
      setServiceList((prev) => [...prev, svc]);
    }
    setEditOpen(false);
  };

  const handleDelete = (idx: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setServiceList((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updatePackage = (pkgIdx: number, field: string, value: any) => {
    const pkgs = [...(form.packages || [])];
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], [field]: value };
    setForm({ ...form, packages: pkgs });
  };

  const updatePackageFeature = (pkgIdx: number, featIdx: number, value: string) => {
    const pkgs = [...(form.packages || [])];
    const feats = [...pkgs[pkgIdx].features];
    feats[featIdx] = value;
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: feats };
    setForm({ ...form, packages: pkgs });
  };

  const addPackageFeature = (pkgIdx: number) => {
    const pkgs = [...(form.packages || [])];
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: [...pkgs[pkgIdx].features, ""] };
    setForm({ ...form, packages: pkgs });
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
                  <th className="text-left p-4 font-medium text-muted-foreground">리뷰</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody>
                {serviceList.map((service, idx) => (
                  <tr key={service.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={service.thumbnail} alt="" className="w-12 h-9 rounded object-cover" />
                        <span className="font-medium truncate max-w-[200px]">{service.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {categories.find((c) => c.id === service.categoryId)?.name || service.categoryId}
                    </td>
                    <td className="p-4">{formatPrice(service.price)}원</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {service.packages.map((pkg) => (
                          <span key={pkg.name} className="px-1.5 py-0.5 bg-secondary rounded text-xs">{pkg.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">{service.rating}</td>
                    <td className="p-4">{service.reviewCount}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(idx)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>{editIdx !== null ? "서비스 수정" : "새 서비스 등록"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">기본 정보</TabsTrigger>
              <TabsTrigger value="packages" className="flex-1">패키지 설정</TabsTrigger>
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
                    value={form.categoryId || ""}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
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
                <Textarea value={form.detailedDescription || ""} onChange={(e) => setForm({ ...form, detailedDescription: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>썸네일 URL</Label>
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
                  <Input type="number" value={form.originalPrice || 0} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>납기일(일)</Label>
                  <Input type="number" value={form.deliveryDays || 1} onChange={(e) => setForm({ ...form, deliveryDays: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>태그 (쉼표 구분)</Label>
                <Input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()) })} />
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6 mt-4">
              {(form.packages || []).map((pkg, pkgIdx) => (
                <Card key={pkgIdx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>패키지명</Label>
                        <Input value={pkg.name} onChange={(e) => updatePackage(pkgIdx, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input type="number" value={pkg.price} onChange={(e) => updatePackage(pkgIdx, "price", Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>납기(일)</Label>
                        <Input type="number" value={pkg.deliveryDays} onChange={(e) => updatePackage(pkgIdx, "deliveryDays", Number(e.target.value))} />
                      </div>
                      <div>
                        <Label>수정횟수</Label>
                        <Input type="number" value={pkg.revisions} onChange={(e) => updatePackage(pkgIdx, "revisions", Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>포함 항목</Label>
                      <div className="space-y-2">
                        {pkg.features.map((feat, featIdx) => (
                          <Input
                            key={featIdx}
                            value={feat}
                            onChange={(e) => updatePackageFeature(pkgIdx, featIdx, e.target.value)}
                            placeholder={`항목 ${featIdx + 1}`}
                          />
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addPackageFeature(pkgIdx)}>
                          + 항목 추가
                        </Button>
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
