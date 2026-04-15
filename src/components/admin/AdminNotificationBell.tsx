import { useState } from "react";
import { Bell, Package, DollarSign, CheckCircle, Info, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  new_project: { icon: FolderKanban, color: "text-blue-500" },
  payment_confirmed: { icon: DollarSign, color: "text-green-500" },
  purchase_confirmed: { icon: CheckCircle, color: "text-primary" },
  general: { icon: Info, color: "text-muted-foreground" },
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

const AdminNotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useAdminNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="right">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">관리자 알림</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              모두 읽음
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">알림이 없습니다</div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => {
                const config = typeConfig[n.type] || typeConfig.general;
                const Icon = config.icon;
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left hover:bg-secondary/50 transition-colors",
                      !n.is_read && "bg-primary/5"
                    )}
                    onClick={() => { if (!n.is_read) markRead(n.id); }}
                  >
                    <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !n.is_read && "font-semibold")}>{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{formatTimeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationBell;
