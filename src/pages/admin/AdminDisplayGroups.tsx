import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, GripVertical, X, ChevronDown, ChevronRight, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DisplayGroup {
  id: string;
  title: string;
  sort_order: number;
  active: boolean;
}

interface DisplayFilter {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
}

interface DisplayGroupService {
  id: string;
  group_id: string;
  filter_id: string | null;
  service_id: string;
  sort_order: number;
}

interface Service {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number;
}

const AdminDisplayGroups = () => {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<DisplayGroup | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formActive, setFormActive] = useState(true);

  // Filter editing
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");
  const [editingFilter, setEditingFilter] = useState<DisplayFilter | null>(null);

  // Service assignment
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<string | null>(null);
  const [assignFilterId, setAssignFilterId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Expanded groups
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: groups = [] } = useQuery({
    queryKey: ["display_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_groups").select("*").order("sort_order");
      if (error) throw error;
      return data as DisplayGroup[];
    },
  });

  const { data: filters = [] } = useQuery({
    queryKey: ["display_group_filters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_group_filters").select("*").order("sort_order");
      if (error) throw error;
      return data as DisplayFilter[];
    },
  });

  const { data: groupServices = [] } = useQuery({
    queryKey: ["display_group_services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_group_services").select("*").order("sort_order");
      if (error) throw error;
      return data as DisplayGroupService[];
    },
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ["all_services_for_display"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, title, thumbnail, price").order("title");
      if (error) throw error;
      return data as Service[];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["display_groups"] });
    queryClient.invalidateQueries({ queryKey: ["display_group_filters"] });
    queryClient.invalidateQueries({ queryKey: ["display_group_services"] });
  };

  // Group CRUD
  const saveGroup = useMutation({
    mutationFn: async () => {
      if (editGroup) {
        const { error } = await supabase.from("display_groups").update({ title: formTitle, active: formActive }).eq("id", editGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("display_groups").insert({ title: formTitle, active: formActive, sort_order: groups.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidateAll(); setEditOpen(false); toast.success("저장되었습니다"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("display_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("삭제되었습니다"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleGroup = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("display_groups").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  // Filter CRUD
  const saveFilter = useMutation({
    mutationFn: async () => {
      if (editingFilter) {
        const { error } = await supabase.from("display_group_filters").update({ name: filterName }).eq("id", editingFilter.id);
        if (error) throw error;
      } else {
        const groupFilters = filters.filter(f => f.group_id === filterGroupId);
        const { error } = await supabase.from("display_group_filters").insert({ group_id: filterGroupId!, name: filterName, sort_order: groupFilters.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidateAll(); setFilterDialogOpen(false); toast.success("필터 저장됨"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFilter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("display_group_filters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("필터 삭제됨"); },
  });

  // Service assignment
  const saveServiceAssignment = useMutation({
    mutationFn: async () => {
      // Remove existing services for this group+filter
      let query = supabase.from("display_group_services").delete().eq("group_id", assignGroupId!);
      if (assignFilterId) {
        query = query.eq("filter_id", assignFilterId);
      } else {
        query = query.is("filter_id", null);
      }
      await query;

      // Insert new
      if (selectedServices.length > 0) {
        const rows = selectedServices.map((sid, idx) => ({
          group_id: assignGroupId!,
          filter_id: assignFilterId || null,
          service_id: sid,
          sort_order: idx,
        }));
        const { error } = await supabase.from("display_group_services").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidateAll(); setServiceDialogOpen(false); toast.success("서비스 배정 완료"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNewGroup = () => { setEditGroup(null); setFormTitle(""); setFormActive(true); setEditOpen(true); };
  const openEditGroup = (g: DisplayGroup) => { setEditGroup(g); setFormTitle(g.title); setFormActive(g.active); setEditOpen(true); };

  const openNewFilter = (groupId: string) => { setFilterGroupId(groupId); setEditingFilter(null); setFilterName(""); setFilterDialogOpen(true); };
  const openEditFilter = (f: DisplayFilter) => { setFilterGroupId(f.group_id); setEditingFilter(f); setFilterName(f.name); setFilterDialogOpen(true); };

  const openServiceAssign = (groupId: string, filterId: string | null) => {
    setAssignGroupId(groupId);
    setAssignFilterId(filterId);
    const existing = groupServices
      .filter(gs => gs.group_id === groupId && gs.filter_id === filterId)
      .map(gs => gs.service_id);
    setSelectedServices(existing);
    setServiceDialogOpen(true);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const getServiceById = (id: string) => allServices.find(s => s.id === id);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">디스플레이 그룹 관리</h1>
        <Button onClick={openNewGroup} className="gap-2"><Plus className="h-4 w-4" /> 새 그룹</Button>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const groupFilters = filters.filter(f => f.group_id === group.id);
          const groupSvcs = groupServices.filter(gs => gs.group_id === group.id);
          const isExpanded = expanded[group.id];

          return (
            <Card key={group.id} className={!group.active ? "opacity-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(prev => ({ ...prev, [group.id]: !prev[group.id] }))}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                    <Badge variant="outline">{groupFilters.length}개 필터</Badge>
                    <Badge variant="secondary">{groupSvcs.length}개 서비스</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={group.active} onCheckedChange={(v) => toggleGroup.mutate({ id: group.id, active: v })} />
                    <Button variant="outline" size="sm" onClick={() => openEditGroup(group)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteGroup.mutate(group.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold">서브 필터 (탭)</Label>
                      <Button variant="outline" size="sm" onClick={() => openNewFilter(group.id)} className="gap-1">
                        <Plus className="h-3 w-3" /> 필터 추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupFilters.map(f => (
                        <div key={f.id} className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5">
                          <span className="text-sm">{f.name}</span>
                          <button onClick={() => openEditFilter(f)} className="text-muted-foreground hover:text-foreground ml-1"><Edit className="h-3 w-3" /></button>
                          <button onClick={() => { if (confirm("삭제?")) deleteFilter.mutate(f.id); }} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service assignments per filter */}
                  <div className="space-y-3">
                    {groupFilters.map(f => {
                      const svcs = groupSvcs.filter(gs => gs.filter_id === f.id);
                      return (
                        <div key={f.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{f.name} 필터의 서비스</span>
                            <Button variant="outline" size="sm" onClick={() => openServiceAssign(group.id, f.id)} className="gap-1">
                              <Package className="h-3 w-3" /> 서비스 지정
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {svcs.map(gs => {
                              const svc = getServiceById(gs.service_id);
                              return svc ? (
                                <Badge key={gs.id} variant="outline" className="gap-1">
                                  {svc.title}
                                </Badge>
                              ) : null;
                            })}
                            {svcs.length === 0 && <span className="text-xs text-muted-foreground">배정된 서비스 없음</span>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Unfiltered services */}
                    {groupFilters.length === 0 && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">전체 서비스</span>
                          <Button variant="outline" size="sm" onClick={() => openServiceAssign(group.id, null)} className="gap-1">
                            <Package className="h-3 w-3" /> 서비스 지정
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupSvcs.filter(gs => !gs.filter_id).map(gs => {
                            const svc = getServiceById(gs.service_id);
                            return svc ? <Badge key={gs.id} variant="outline">{svc.title}</Badge> : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Group Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editGroup ? "그룹 수정" : "새 디스플레이 그룹"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>그룹 타이틀</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="예: 쇼핑몰 사장님이 많이 찾아요" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>활성화</Label>
            </div>
            <Button onClick={() => saveGroup.mutate()} disabled={!formTitle.trim() || saveGroup.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" /> 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Edit Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFilter ? "필터 수정" : "새 필터 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>필터명</Label>
              <Input value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="예: AI 이미지" />
            </div>
            <Button onClick={() => saveFilter.mutate()} disabled={!filterName.trim() || saveFilter.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" /> 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Assignment Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>서비스 지정</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">표시할 서비스를 선택하세요 ({selectedServices.length}개 선택됨)</p>
          <div className="space-y-2">
            {allServices.map(svc => (
              <label key={svc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                <Checkbox
                  checked={selectedServices.includes(svc.id)}
                  onCheckedChange={() => toggleServiceSelection(svc.id)}
                />
                {svc.thumbnail && <img src={svc.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{svc.title}</p>
                  <p className="text-xs text-muted-foreground">{svc.price.toLocaleString()}원</p>
                </div>
              </label>
            ))}
          </div>
          <Button onClick={() => saveServiceAssignment.mutate()} disabled={saveServiceAssignment.isPending} className="w-full mt-4">
            <Save className="h-4 w-4 mr-2" /> 저장
          </Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDisplayGroups;
