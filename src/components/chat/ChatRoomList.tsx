import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, User, X, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export default function ChatRoomList({ rooms, selectedRoomId, onSelectRoom, isAdmin, loadingRooms }: ChatRoomListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [profileMap, setProfileMap] = useState<Record<string, { name: string }>>({});

  // Fetch profiles for opponent names
  const customerIds = useMemo(() => {
    const ids = new Set<string>();
    rooms.forEach((r) => ids.add(r.customer_id));
    return Array.from(ids);
  }, [rooms]);

  const fetchProfiles = useCallback(async () => {
    if (customerIds.length === 0) return;
    // Use profiles table for admin, or members table as fallback
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
    if (isAdmin) {
      return profileMap[room.customer_id]?.name || "사용자";
    }
    return "AI팩토리";
  };

  const getUnreadCount = (room: ChatRoom) => isAdmin ? room.unread_admin : room.unread_customer;

  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    // Filter mode
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

    // Search by title, opponent name, or customer_id
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const opName = getOpponentName(r).toLowerCase();
        return r.title.toLowerCase().includes(q) ||
          opName.includes(q) ||
          r.customer_id.toLowerCase().includes(q);
      });
    }

    return filtered;
  }, [rooms, filterMode, searchQuery, profileMap, isAdmin]);

  const filterLabels: Record<FilterMode, string> = {
    all: "전체", unread: "안읽음", today: "오늘", week: "이번 주",
  };

  return (
    <div className="w-80 border-r flex flex-col shrink-0">
      {/* Search */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="이름, 아이디, 제목 검색"
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
        {/* Filter chips */}
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

      {/* Room list */}
      <ScrollArea className="flex-1">
        {loadingRooms ? (
          <div className="p-4 text-center text-sm text-muted-foreground">로딩 중...</div>
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
                  {/* Avatar */}
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
