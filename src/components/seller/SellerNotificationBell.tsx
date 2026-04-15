import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Package, Wallet, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  new_order: { icon: Package, color: "text-primary" },
  settlement_complete: { icon: Wallet, color: "text-emerald-500" },
  general: { icon: Info, color: "text-muted-foreground" },
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

interface SellerNotificationBellProps {
  sellerId: string;
}

const SellerNotificationBell = ({ sellerId }: SellerNotificationBellProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["seller-notifications", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_notifications")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Realtime subscription
  useEffect(() => {
    if (!sellerId) return;
    const channel = supabase
      .channel(`seller-notifications-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "seller_notifications",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["seller-notifications", sellerId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sellerId, queryClient]);

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.is_read);
    if (unread.length === 0) return;
    await supabase
      .from("seller_notifications")
      .update({ is_read: true })
      .eq("seller_id", sellerId)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["seller-notifications", sellerId] });
  };

  const markRead = async (id: string) => {
    await supabase
      .from("seller_notifications")
      .update({ is_read: true })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["seller-notifications", sellerId] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">알림</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              모두 읽음
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
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
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">{n.message}</p>
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

export default SellerNotificationBell;
