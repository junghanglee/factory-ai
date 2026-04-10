import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "./useChat";
import { smartCompress } from "@/utils/imageCompression";

export function useChatPanel(roomId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as ChatMessage[]);
        if (!cancelled) setLoading(false);
      });

    // Realtime
    const ch = supabase
      .channel(`panel_msgs_${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [roomId]);

  // Mark as read
  useEffect(() => {
    if (!roomId || !userId) return;
    supabase
      .from("chat_rooms")
      .update({ unread_admin: 0 })
      .eq("id", roomId)
      .then();
  }, [roomId, userId, messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!userId || !text.trim()) return;
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: userId,
      message: text.trim(),
      message_type: "text",
    });
    await supabase.from("chat_rooms").update({
      last_message: text.trim(),
      last_message_at: new Date().toISOString(),
    }).eq("id", roomId);
  }, [roomId, userId]);

  const sendFile = useCallback(async (file: File, attachedMessage?: string) => {
    if (!userId) return;
    const compressed = await smartCompress(file, "chat");
    const ext = compressed.name.split(".").pop();
    const path = `${roomId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
    if (uploadError) { console.error(uploadError); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    let msgType = "file";
    if (file.type.startsWith("image/")) msgType = "image";
    else if (file.type.startsWith("video/")) msgType = "video";
    const displayName = file.name.length > 50 ? file.name.slice(0, 47) + "..." : file.name;

    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: userId,
      message: attachedMessage || displayName,
      message_type: msgType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    await supabase.from("chat_rooms").update({
      last_message: `📎 ${displayName}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", roomId);
  }, [roomId, userId]);

  return { messages, loading, sendMessage, sendFile };
}