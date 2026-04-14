import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // "딩동" two-tone doorbell
    oscillator.frequency.value = 830;
    oscillator.type = "sine";
    gain.gain.value = 0.25;
    oscillator.start();

    setTimeout(() => {
      oscillator.frequency.value = 660;
    }, 150);

    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported
  }
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.hasFocus()) return;
  new Notification(title, { body, icon: "/favicon.ico", tag: "chat-notification" });
}

/**
 * Global hook that tracks total unread chat message count in real-time.
 * - Admin: sums unread_admin across all rooms
 * - User: sums unread_customer for their rooms
 * Plays notification sound + browser notification on new messages from others.
 */
export function useUnreadChat() {
  const { user, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  // Request notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }

    if (isAdmin) {
      const { data } = await supabase
        .from("chat_rooms")
        .select("unread_admin");
      const total = (data ?? []).reduce((sum, r) => sum + (r.unread_admin || 0), 0);
      setUnreadCount(total);
      return total;
    } else {
      const { data } = await supabase
        .from("chat_rooms")
        .select("unread_customer")
        .eq("customer_id", user.id);
      const total = (data ?? []).reduce((sum, r) => sum + (r.unread_customer || 0), 0);
      setUnreadCount(total);
      return total;
    }
  }, [user, isAdmin]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchUnread().then((count) => {
      prevCountRef.current = count ?? 0;
      initializedRef.current = true;
    });

    // Listen for changes on chat_rooms (unread counts update) and chat_messages (new messages)
    const channel = supabase
      .channel("global_unread_watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => {
        fetchUnread().then((newCount) => {
          if (
            initializedRef.current &&
            newCount !== undefined &&
            prevCountRef.current !== null &&
            newCount > prevCountRef.current
          ) {
            playNotificationSound();
            showBrowserNotification("새 메시지", "새로운 채팅 메시지가 도착했습니다.");
          }
          prevCountRef.current = newCount ?? 0;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        // Also notify on direct message insert if sender is not current user
        const newMsg = payload.new as any;
        if (newMsg && newMsg.sender_id !== user.id) {
          // Refresh unread counts
          fetchUnread().then((newCount) => {
            if (
              initializedRef.current &&
              newCount !== undefined &&
              prevCountRef.current !== null &&
              newCount > prevCountRef.current
            ) {
              playNotificationSound();
              showBrowserNotification(
                "새 메시지",
                newMsg.message?.slice(0, 100) || "파일이 전송되었습니다"
              );
            }
            prevCountRef.current = newCount ?? 0;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnread]);

  return { unreadCount };
}
