import { useEffect, useRef, useCallback } from "react";

const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczFj2markup_base64_is_too_long";

// Generate a simple notification beep using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gain.gain.value = 0.3;
    
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
}

function playRoomOpenSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = "sine";
    gain.gain.value = 0.15;
    
    oscillator.start();
    
    // Two-tone effect
    setTimeout(() => {
      oscillator.frequency.value = 900;
    }, 100);
    
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio not supported
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.hasFocus()) return; // Don't show if tab is focused
  
  new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: "chat-notification",
  });
}

export function useChatNotification() {
  const prevMessageCountRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const notifyNewMessage = useCallback((
    messages: any[],
    selectedRoomId: string | null,
    currentUserId: string | undefined
  ) => {
    if (!initializedRef.current) {
      prevMessageCountRef.current = messages.length;
      initializedRef.current = true;
      return;
    }

    if (messages.length > prevMessageCountRef.current) {
      const newMsg = messages[messages.length - 1];
      // Only notify for messages from others
      if (newMsg && newMsg.sender_id !== currentUserId) {
        playNotificationSound();
        showBrowserNotification(
          "새 메시지",
          newMsg.message?.slice(0, 100) || "파일이 전송되었습니다"
        );
      }
    }
    prevMessageCountRef.current = messages.length;
  }, []);

  const notifyRoomOpen = useCallback(() => {
    playRoomOpenSound();
  }, []);

  return { notifyNewMessage, notifyRoomOpen };
}
