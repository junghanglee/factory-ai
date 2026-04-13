import { useState } from "react";
import { Plus, Edit, Trash2, Save, GripVertical, X, ChevronDown, ChevronRight, Package, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DisplayGroup {
  id: string;
  title: string;
  sort_order: number;
  active: boolean;
  font_size: number;
  font_color: string | null;
  highlight_color: string | null;
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

// Sortable service item for drag-and-drop
function SortableServiceItem({ id, service, onRemove }: { id: string; service: Service; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-2 rounded-lg bg-background border">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      {service.thumbnail && <img src={service.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{service.title}</p>
        <p className="text-xs text-muted-foreground">{service.price.toLocaleString()}원</p>
      </div>
      <button onClick={onRemove} className="text-destructive hover:text-destructive/80">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const AdminDisplayGroups = () => {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<DisplayGroup | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formFontSize, setFormFontSize] = useState(26);
  const [formFontColor, setFormFontColor] = useState("");
  const [formHighlightColor, setFormHighlightColor] = useState("");

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");
  const [editingFilter, setEditingFilter] = useState<DisplayFilter | null>(null);

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<string | null>(null);
  const [assignFilterId, setAssignFilterId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const saveGroup = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formTitle,
        active: formActive,
        font_size: formFontSize || 26,
        font_color: formFontColor || null,
        highlight_color: formHighlightColor || null,
      };
      if (editGroup) {
        const { error } = await supabase.from("display_groups").update(payload).eq("id", editGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("display_groups").insert({ ...payload, sort_order: groups.length });
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

  const saveServiceAssignment = useMutation({
    mutationFn: async () => {
      let query = supabase.from("display_group_services").delete().eq("group_id", assignGroupId!);
      if (assignFilterId) {
        query = query.eq("filter_id", assignFilterId);
      } else {
        query = query.is("filter_id", null);
      }
      await query;

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

  const openNewGroup = () => { setEditGroup(null); setFormTitle(""); setFormActive(true); setFormFontSize(26); setFormFontColor(""); setFormHighlightColor(""); setEditOpen(true); };
  const openEditGroup = (g: DisplayGroup) => { setEditGroup(g); setFormTitle(g.title); setFormActive(g.active); setFormFontSize(g.font_size || 26); setFormFontColor(g.font_color || ""); setFormHighlightColor(g.highlight_color || ""); setEditOpen(true); };
  const openNewFilter = (groupId: string) => { setFilterGroupId(groupId); setEditingFilter(null); setFilterName(""); setFilterDialogOpen(true); };
  const openEditFilter = (f: DisplayFilter) => { setFilterGroupId(f.group_id); setEditingFilter(f); setFilterName(f.name); setFilterDialogOpen(true); };

  const openServiceAssign = (groupId: string, filterId: string | null) => {
    setAssignGroupId(groupId);
    setAssignFilterId(filterId);
    const existing = groupServices
      .filter(gs => gs.group_id === groupId && gs.filter_id === filterId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(gs => gs.service_id);
    setSelectedServices(existing);
    setServiceSearch("");
    setServiceDialogOpen(true);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedServices(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const getServiceById = (id: string) => allServices.find(s => s.id === id);

  const filteredAvailableServices = allServices.filter(svc => {
    if (serviceSearch && !svc.title.toLowerCase().includes(serviceSearch.toLowerCase())) return false;
    return true;
  });

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
                    <CardTitle className="text-lg whitespace-pre-line">{group.title}</CardTitle>
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

                  <div className="space-y-3">
                    {groupFilters.map(f => {
                      const svcs = groupSvcs.filter(gs => gs.filter_id === f.id).sort((a, b) => a.sort_order - b.sort_order);
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
                              return svc ? <Badge key={gs.id} variant="outline" className="gap-1">{svc.title}</Badge> : null;
                            })}
                            {svcs.length === 0 && <span className="text-xs text-muted-foreground">배정된 서비스 없음</span>}
                          </div>
                        </div>
                      );
                    })}

                    {groupFilters.length === 0 && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">전체 서비스</span>
                          <Button variant="outline" size="sm" onClick={() => openServiceAssign(group.id, null)} className="gap-1">
                            <Package className="h-3 w-3" /> 서비스 지정
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupSvcs.filter(gs => !gs.filter_id).sort((a, b) => a.sort_order - b.sort_order).map(gs => {
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

      {/* Group Edit Dialog - Textarea for multiline title */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editGroup ? "그룹 수정" : "새 디스플레이 그룹"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>그룹 타이틀 (줄바꿈 가능, **강조텍스트** 지원)</Label>
              <Textarea
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder={"예: 쇼핑몰 사장님이\n**많이** 찾아요"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">**텍스트** 로 감싸면 강조색상이 적용됩니다</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>폰트 크기 (px)</Label>
                <Input type="number" min={12} max={60} value={formFontSize} onChange={e => setFormFontSize(Number(e.target.value))} />
              </div>
              <div>
                <Label>폰트 색상</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formFontColor || "#000000"} onChange={e => setFormFontColor(e.target.value)} className="w-10 h-9 p-0.5 cursor-pointer" />
                  <Input value={formFontColor} onChange={e => setFormFontColor(e.target.value)} placeholder="기본값" className="flex-1" />
                </div>
              </div>
              <div>
                <Label>강조 색상</Label>
                <div className="flex gap-2">
                  <Input type="color" value={formHighlightColor || "#6C5CE7"} onChange={e => setFormHighlightColor(e.target.value)} className="w-10 h-9 p-0.5 cursor-pointer" />
                  <Input value={formHighlightColor} onChange={e => setFormHighlightColor(e.target.value)} placeholder="기본값" className="flex-1" />
                </div>
              </div>
            </div>
            {/* Preview */}
            {formTitle && (
              <div className="p-3 border rounded-lg bg-secondary/30">
                <Label className="text-xs mb-1 block">미리보기</Label>
                <h2 className="font-bold leading-tight whitespace-pre-line" style={{ fontSize: `${formFontSize}px`, color: formFontColor || undefined }}>
                  {formTitle.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <span key={i} style={{ color: formHighlightColor || "#6C5CE7" }}>{part.slice(2, -2)}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </h2>
              </div>
            )}
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

      {/* Service Assignment Dialog with search + drag-and-drop */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>서비스 지정</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Left: search & add services */}
            <div className="w-1/2 flex flex-col min-h-0">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="서비스 검색..."
                  className="pl-9"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2">
                {filteredAvailableServices.map(svc => (
                  <label key={svc.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-secondary cursor-pointer">
                    <Checkbox
                      checked={selectedServices.includes(svc.id)}
                      onCheckedChange={() => toggleServiceSelection(svc.id)}
                    />
                    {svc.thumbnail && <img src={svc.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{svc.title}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.price.toLocaleString()}원</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Right: selected services with drag-and-drop ordering */}
            <div className="w-1/2 flex flex-col min-h-0">
              <p className="text-sm font-medium mb-2">노출 순서 ({selectedServices.length}개)</p>
              <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2">
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">왼쪽에서 서비스를 선택하세요</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={selectedServices} strategy={verticalListSortingStrategy}>
                      {selectedServices.map(sid => {
                        const svc = getServiceById(sid);
                        return svc ? (
                          <SortableServiceItem
                            key={sid}
                            id={sid}
                            service={svc}
                            onRemove={() => setSelectedServices(prev => prev.filter(s => s !== sid))}
                          />
                        ) : null;
                      })}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          <Button onClick={() => saveServiceAssignment.mutate()} disabled={saveServiceAssignment.isPending} className="w-full mt-3">
            <Save className="h-4 w-4 mr-2" /> 저장
          </Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDisplayGroups;
