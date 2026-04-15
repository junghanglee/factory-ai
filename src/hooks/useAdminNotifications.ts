import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.2;
    osc.start();
    setTimeout(() => { osc.frequency.value = 1100; }, 120);
    setTimeout(() => { osc.frequency.value = 880; }, 240);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* no audio */ }
}

export function useAdminNotifications() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Realtime subscription — build chain BEFORE calling subscribe
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel(`admin-notif-${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "admin_notifications",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        playNotificationSound();
        if ("Notification" in window && Notification.permission === "granted" && !document.hasFocus()) {
          new Notification("관리자 알림", { body: "새로운 알림이 있습니다.", icon: "/favicon.ico", tag: "admin-notif" });
        }
      });

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, queryClient]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const markAllRead = async () => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
