import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Package, Wallet, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  new_order: { icon: Package, color: "text-primary", bg: "bg-primary/10" },
  settlement_complete: { icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50" },
  general: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
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

/**
 * Shows a layer popup on login when seller has unread notifications.
 * Rendered globally — only activates for sellers with unread items.
 */
export default function SellerLoginNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  // Check if user is a seller
  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile-global", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("seller_profiles")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ["seller-unread-login", sellerProfile?.id],
    queryFn: async () => {
      if (!sellerProfile) return [];
      const { data } = await supabase
        .from("seller_notifications")
        .select("*")
        .eq("seller_id", sellerProfile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!sellerProfile?.id && sellerProfile.status === "승인",
  });

  // Show popup once per session when there are unread notifications
  useEffect(() => {
    if (checkedSession) return;
    if (!user || !sellerProfile) return;
    if (unreadNotifications.length === 0) return;

    const sessionKey = `seller_notif_shown_${user.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setCheckedSession(true);
      return;
    }

    setOpen(true);
    sessionStorage.setItem(sessionKey, "1");
    setCheckedSession(true);
  }, [user, sellerProfile, unreadNotifications, checkedSession]);

  const markAllRead = async () => {
    if (!sellerProfile) return;
    await supabase
      .from("seller_notifications")
      .update({ is_read: true })
      .eq("seller_id", sellerProfile.id)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["seller-unread-login"] });
    queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
    setOpen(false);
  };

  if (!user || !sellerProfile || unreadNotifications.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            새로운 알림 ({unreadNotifications.length}건)
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] -mx-6 px-6">
          <div className="space-y-3">
            {unreadNotifications.map((n: any) => {
              const config = typeConfig[n.type] || typeConfig.general;
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={cn("p-2 rounded-full shrink-0", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line line-clamp-3">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {formatTimeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            닫기
          </Button>
          <Button className="flex-1 gap-2" onClick={markAllRead}>
            <CheckCircle className="h-4 w-4" />
            모두 읽음 처리
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
