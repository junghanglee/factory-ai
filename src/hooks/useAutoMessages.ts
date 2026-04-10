import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAutoMessages() {
  const { user } = useAuth();

  // Send auto message for a given trigger type into a room
  // Uses the current authenticated user's ID as sender to satisfy RLS,
  // but marks message_type as "system" for display differentiation
  const sendAutoMessage = useCallback(async (roomId: string, triggerType: string) => {
    if (!user) return;
    try {
      const { data: autoMsgs } = await supabase
        .from("auto_messages")
        .select("*")
        .eq("trigger_type", triggerType)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (!autoMsgs || autoMsgs.length === 0) return;

      // Send all matching auto messages
      for (const autoMsg of autoMsgs) {
        await supabase.from("chat_messages").insert({
          room_id: roomId,
          sender_id: user.id,
          message: autoMsg.message,
          message_type: "system",
        });
      }

      const lastMsg = autoMsgs[autoMsgs.length - 1];
      await supabase.from("chat_rooms").update({
        last_message: lastMsg.message.slice(0, 100),
        last_message_at: new Date().toISOString(),
      }).eq("id", roomId);
    } catch (err) {
      console.error("Auto message error:", err);
    }
  }, [user]);

  return { sendAutoMessage };
}
