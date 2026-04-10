import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, User, ChevronDown, ChevronRight, MessageCircle, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { ChatRoom } from "@/hooks/useChat";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isAdmin: boolean;
  loadingRooms: boolean;
}

type FilterMode = "all" | "unread" | "today" | "week";

let popupOffset = 0;
const openChatPopup = (roomId: string) => {
  const w = 480;
  const h = 700;
  const left = window.screenX + window.outerWidth - w - 40 - (popupOffset * 30);
  const top = window.screenY + 80 + (popupOffset * 30);
  popupOffset = (popupOffset + 1) % 10;
  window.open(
    `/admin/chat-popup?roomId=${roomId}`,
    `chat_${roomId}`,
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
  );
};

export default function ChatRoomList({ rooms, selectedRoomId, onSelectRoom, isAdmin, loadingRooms }: ChatRoomListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [profileMap, setProfileMap] = useState<Record<string, { name: string }>>({});
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const customerIds = useMemo(() => {
    const ids = new Set<string>();
    rooms.forEach((r) => ids.add(r.customer_id));
    return Array.from(ids);
  }, [rooms]);

  const fetchProfiles = useCallback(async () => {
    if (customerIds.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", customerIds);
    if (data) {
      const map: Record<string, { name: string }> = {};
      data.forEach((p) => { if (p.name) map[p.user_id] = { name: p.name }; });
      setProfileMap(map);
    }
  }, [customerIds]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const getOpponentName = (room: ChatRoom) => {
    if (isAdmin) return profileMap[room.customer_id]?.name || "사용자";
    return "AI팩토리";
  };

  const getUnreadCount = (room: ChatRoom) => isAdmin ? room.unread_admin : room.unread_customer;

  const filteredRooms = useMemo(() => {
    let filtered = rooms;
    if (filterMode === "unread") {
      filtered = filtered.filter((r) => getUnreadCount(r) > 0);
    } else if (filterMode === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter((r) => r.last_message_at && new Date(r.last_message_at).toDateString() === today);
    } else if (filterMode === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((r) => r.last_message_at && new Date(r.last_message_at) >= weekAgo);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const opName = getOpponentName(r).toLowerCase();
        return r.title.toLowerCase().includes(q) || opName.includes(q);
      });
    }
    return filtered;
  }, [rooms, filterMode, searchQuery, profileMap, isAdmin]);

  // Auto-expand the customer whose room is selected
  useEffect(() => {
    if (!selectedRoomId || !isAdmin) return;
    const room = rooms.find((r) => r.id === selectedRoomId);
    if (room) {
      setExpandedCustomers((prev) => {
        const next = new Set(prev);
        next.add(room.customer_id);
        return next;
      });
    }
  }, [selectedRoomId, rooms, isAdmin]);

  // Group rooms by customer for admin
  const groupedByCustomer = useMemo(() => {
    if (!isAdmin) return null;
    const groups: { customerId: string; name: string; rooms: ChatRoom[]; totalUnread: number; latestMessageAt: string | null }[] = [];
    const map = new Map<string, ChatRoom[]>();
    filteredRooms.forEach((r) => {
      const existing = map.get(r.customer_id) || [];
      existing.push(r);
      map.set(r.customer_id, existing);
    });
    map.forEach((customerRooms, customerId) => {
      const name = profileMap[customerId]?.name || "사용자";
      const totalUnread = customerRooms.reduce((sum, r) => sum + (r.unread_admin || 0), 0);
      const sorted = customerRooms.sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
      const latestMessageAt = sorted[0]?.last_message_at || null;
      groups.push({ customerId, name, rooms: sorted, totalUnread, latestMessageAt });
    });
    groups.sort((a, b) => {
      const ta = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
      const tb = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
      return tb - ta;
    });
    return groups;
  }, [isAdmin, filteredRooms, profileMap]);

  const toggleCustomer = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  const filterLabels: Record<FilterMode, string> = {
    all: "전체", unread: "안읽음", today: "오늘", week: "이번 주",
  };

  const PopupButton = ({ roomId }: { roomId: string }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); openChatPopup(roomId); }}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors mr-1"
      title="채팅 새창 열기"
      aria-label="채팅 새창 열기"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </button>
  );

  const renderRoomItem = (room: ChatRoom, indented = false) => {
    const unread = getUnreadCount(room);
    return (
      <div key={room.id} className="flex items-center border-b overflow-hidden">
        <button
          onClick={() => onSelectRoom(room.id)}
          className={`flex-1 min-w-0 text-left transition-colors ${
            selectedRoomId === room.id ? "bg-accent" : "hover:bg-accent/50"
          } ${indented ? "pl-10 pr-1 py-2" : "p-2.5"}`}
        >
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs font-medium truncate min-w-0 flex-1">{room.title}</span>
            {room.last_message_at && (
              <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(room.last_message_at)}</span>
            )}
            {unread > 0 && (
              <span className="shrink-0 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{room.last_message || "새 대화"}</p>
        </button>
        {isAdmin && <PopupButton roomId={room.id} />}
      </div>
    );
  };

  return (
    <div className="w-80 border-r flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="이름, 제목 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-lg border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(filterLabels) as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                filterMode === mode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              }`}
            >
              {filterLabels[mode]}
              {mode === "unread" && (() => {
                const cnt = rooms.filter((r) => getUnreadCount(r) > 0).length;
                return cnt > 0 ? ` (${cnt})` : "";
              })()}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loadingRooms ? (
          <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
        ) : isAdmin && groupedByCustomer ? (
          groupedByCustomer.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery || filterMode !== "all" ? "검색 결과가 없습니다" : "채팅방이 없습니다."}
            </div>
          ) : (
            groupedByCustomer.map((group) => {
              const isExpanded = expandedCustomers.has(group.customerId);
              const hasSingleRoom = group.rooms.length === 1;

              if (hasSingleRoom) {
                const room = group.rooms[0];
                const unread = getUnreadCount(room);
                return (
                  <div key={group.customerId} className="flex items-center border-b overflow-hidden">
                    <button
                      onClick={() => onSelectRoom(room.id)}
                      className={`flex-1 min-w-0 p-2.5 text-left transition-colors ${
                        selectedRoomId === room.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-medium text-sm truncate min-w-0 flex-1">{group.name}</span>
                            {room.last_message_at && (
                              <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(room.last_message_at)}</span>
                            )}
                            {unread > 0 && (
                              <span className="shrink-0 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                                {unread}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mb-0.5">{room.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{room.last_message || "새 대화"}</p>
                        </div>
                      </div>
                    </button>
                    <PopupButton roomId={room.id} />
                  </div>
                );
              }

              // Multiple rooms: expandable group
              return (
                <div key={group.customerId} className="border-b overflow-hidden">
                  <button
                    onClick={() => toggleCustomer(group.customerId)}
                    className={`w-full p-3 text-left transition-colors hover:bg-accent/50 ${
                      isExpanded ? "bg-accent/30" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="min-w-0 truncate font-medium text-sm">{group.name}</span>
                            <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                              <MessageCircle className="h-2.5 w-2.5" /> {group.rooms.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {group.totalUnread > 0 && (
                              <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                                {group.totalUnread}
                              </span>
                            )}
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                        {group.latestMessageAt && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            최근: {formatDateShort(group.latestMessageAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                  {isExpanded && group.rooms.map((room) => renderRoomItem(room, true))}
                </div>
              );
            })
          )
        ) : filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery || filterMode !== "all" ? "검색 결과가 없습니다" : "채팅방이 없습니다."}
          </div>
        ) : (
          filteredRooms.map((room) => {
            const unread = getUnreadCount(room);
            const opName = getOpponentName(room);
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full p-3 text-left border-b hover:bg-accent/50 transition-colors ${
                  selectedRoomId === room.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-sm truncate">{opName}</span>
                      {room.last_message_at && (
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                          {formatDateShort(room.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-0.5">{room.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate pr-2">{room.last_message || "새 대화"}</p>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[20px] h-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
