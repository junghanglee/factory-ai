import { useState, useCallback } from "react";
import { MessageCircle, Maximize2, X } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useChat } from "@/hooks/useChat";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ChatPanel from "@/components/chat/ChatPanel";

const MAX_OPEN_PANELS = 4;

const AdminChat = () => {
  const {
    rooms, loadingRooms, user,
  } = useChat();

  const [openPanels, setOpenPanels] = useState<string[]>([]);
  const [minimizedPanels, setMinimizedPanels] = useState<string[]>([]);
  const [focusedPanel, setFocusedPanel] = useState<string | null>(null);

  const handleSelectRoom = useCallback((roomId: string) => {
    // Already open? Focus it
    if (openPanels.includes(roomId)) {
      setFocusedPanel(roomId);
      return;
    }
    // Minimized? Restore it
    if (minimizedPanels.includes(roomId)) {
      setMinimizedPanels((p) => p.filter((id) => id !== roomId));
      if (openPanels.length >= MAX_OPEN_PANELS) {
        // Minimize the least recently focused
        const toMinimize = openPanels[0];
        setOpenPanels((p) => [...p.filter((id) => id !== toMinimize), roomId]);
        setMinimizedPanels((p) => [...p, toMinimize]);
      } else {
        setOpenPanels((p) => [...p, roomId]);
      }
      setFocusedPanel(roomId);
      return;
    }
    // New panel
    if (openPanels.length >= MAX_OPEN_PANELS) {
      const toMinimize = openPanels[0];
      setOpenPanels((p) => [...p.filter((id) => id !== toMinimize), roomId]);
      setMinimizedPanels((p) => [...p, toMinimize]);
    } else {
      setOpenPanels((p) => [...p, roomId]);
    }
    setFocusedPanel(roomId);
  }, [openPanels, minimizedPanels]);

  const handleMinimize = useCallback((roomId: string) => {
    setOpenPanels((p) => p.filter((id) => id !== roomId));
    setMinimizedPanels((p) => [...p, roomId]);
    if (focusedPanel === roomId) setFocusedPanel(openPanels.find((id) => id !== roomId) || null);
  }, [openPanels, focusedPanel]);

  const handleClose = useCallback((roomId: string) => {
    setOpenPanels((p) => p.filter((id) => id !== roomId));
    setMinimizedPanels((p) => p.filter((id) => id !== roomId));
    if (focusedPanel === roomId) setFocusedPanel(openPanels.find((id) => id !== roomId) || null);
  }, [openPanels, focusedPanel]);

  const handleRestore = useCallback((roomId: string) => {
    setMinimizedPanels((p) => p.filter((id) => id !== roomId));
    if (openPanels.length >= MAX_OPEN_PANELS) {
      const toMinimize = openPanels[0];
      setOpenPanels((p) => [...p.filter((id) => id !== toMinimize), roomId]);
      setMinimizedPanels((p) => [...p, toMinimize]);
    } else {
      setOpenPanels((p) => [...p, roomId]);
    }
    setFocusedPanel(roomId);
  }, [openPanels]);

  const getRoomTitle = (roomId: string) => rooms.find((r) => r.id === roomId)?.title || "채팅";
  const getUnread = (roomId: string) => rooms.find((r) => r.id === roomId)?.unread_admin || 0;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">채팅 관리</h1>
      <div className="flex flex-col border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 200px)" }}>
        <div className="flex flex-1 min-h-0">
          {/* Room list */}
          <ChatRoomList
            rooms={rooms}
            selectedRoomId={focusedPanel}
            onSelectRoom={handleSelectRoom}
            isAdmin={true}
            loadingRooms={loadingRooms}
          />

          {/* Chat panels area */}
          <div className="flex-1 flex min-w-0">
            {openPanels.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>좌측 목록에서 채팅방을 선택하세요</p>
                  <p className="text-xs mt-1">최대 {MAX_OPEN_PANELS}개까지 동시에 열 수 있습니다</p>
                </div>
              </div>
            ) : (
              openPanels.map((roomId) => {
                const room = rooms.find((r) => r.id === roomId);
                if (!room || !user) return null;
                return (
                  <ChatPanel
                    key={roomId}
                    room={room}
                    userId={user.id}
                    onMinimize={() => handleMinimize(roomId)}
                    onClose={() => handleClose(roomId)}
                    onFocus={() => setFocusedPanel(roomId)}
                    isFocused={focusedPanel === roomId}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Minimized dock */}
        {minimizedPanels.length > 0 && (
          <div className="border-t bg-muted/20 px-3 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[10px] text-muted-foreground shrink-0">최소화:</span>
            {minimizedPanels.map((roomId) => {
              const unread = getUnread(roomId);
              return (
                <button
                  key={roomId}
                  onClick={() => handleRestore(roomId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs transition-colors group shrink-0 max-w-[180px]"
                >
                  <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{getRoomTitle(roomId)}</span>
                  {unread > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                  <Maximize2 className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClose(roomId); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
