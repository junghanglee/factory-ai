import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAutoMessages() {
  // Send auto message for a given trigger type into a room
  const sendAutoMessage = useCallback(async (roomId: string, triggerType: string) => {
    try {
      const { data: autoMsgs } = await supabase
        .from("auto_messages")
        .select("*")
        .eq("trigger_type", triggerType)
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (!autoMsgs || autoMsgs.length === 0) return;

      const autoMsg = autoMsgs[0];

      // Insert as a system message (sender_id = '00000000-0000-0000-0000-000000000000' as system)
      await supabase.from("chat_messages").insert({
        room_id: roomId,
        sender_id: "00000000-0000-0000-0000-000000000000",
        message: autoMsg.message,
        message_type: "text",
      });

      await supabase.from("chat_rooms").update({
        last_message: autoMsg.message.slice(0, 100),
        last_message_at: new Date().toISOString(),
      }).eq("id", roomId);
    } catch (err) {
      console.error("Auto message error:", err);
    }
  }, []);

  return { sendAutoMessage };
}
