import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAutoMessages() {
  const { user } = useAuth();

  // Trigger auto messages via secure RPC. Server enforces:
  //  - caller is authenticated and a participant of the room (customer/seller/admin)
  //  - auto_messages table is no longer readable client-side
  const sendAutoMessage = useCallback(async (roomId: string, triggerType: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any).rpc("send_auto_messages", {
        _room_id: roomId,
        _trigger_type: triggerType,
      });
      if (error) console.error("Auto message error:", error);
    } catch (err) {
      console.error("Auto message error:", err);
    }
  }, [user]);

  return { sendAutoMessage };
}
