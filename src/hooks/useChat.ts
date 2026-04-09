import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ChatRoom {
  id: string;
  customer_id: string;
  admin_id: string | null;
  title: string;
  service_id: string | null;
  project_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_customer: number;
  unread_admin: number;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  is_read: boolean;
  created_at: string;
}

export function useChat() {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    setLoadingRooms(true);
    const { data } = await supabase
      .from("chat_rooms")
      .select("*")
      .order("last_message_at", { ascending: false });
    if (data) setRooms(data as ChatRoom[]);
    setLoadingRooms(false);
  }, [user]);

  // Fetch messages for selected room
  const fetchMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
    setLoadingMessages(false);
  }, []);

  // Select room
  const selectRoom = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    fetchMessages(roomId);
  }, [fetchMessages]);

  // Create a new chat room
  const createRoom = useCallback(async (title: string, serviceId?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        customer_id: user.id,
        title,
        service_id: serviceId || null,
      })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    await fetchRooms();
    return data as ChatRoom;
  }, [user, fetchRooms]);

  // Send text message
  const sendMessage = useCallback(async (text: string) => {
    if (!user || !selectedRoomId || !text.trim()) return;
    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: text.trim(),
      message_type: "text",
    });
    if (error) { console.error(error); return; }
    // Update room's last message
    await supabase.from("chat_rooms").update({
      last_message: text.trim(),
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [user, selectedRoomId]);

  // Send file with optional size limit (0 = no limit)
  const sendFile = useCallback(async (file: File, maxSizeMB: number = 0) => {
    if (!user || !selectedRoomId) return;
    if (maxSizeMB > 0 && file.size > maxSizeMB * 1024 * 1024) {
      alert(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`);
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${selectedRoomId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);
    if (uploadError) { console.error(uploadError); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    let msgType = "file";
    if (file.type.startsWith("image/")) msgType = "image";
    else if (file.type.startsWith("video/")) msgType = "video";

    const displayName = file.name.length > 50 ? file.name.slice(0, 47) + "..." : file.name;

    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: displayName,
      message_type: msgType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    if (error) { console.error(error); return; }
    await supabase.from("chat_rooms").update({
      last_message: `📎 ${displayName}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [user, selectedRoomId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    fetchRooms();

    const roomChannel = supabase
      .channel("chat_rooms_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [user, fetchRooms]);

  useEffect(() => {
    if (!selectedRoomId) return;

    const msgChannel = supabase
      .channel(`chat_messages_${selectedRoomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${selectedRoomId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [selectedRoomId]);

  return {
    rooms,
    selectedRoomId,
    messages,
    loadingRooms,
    loadingMessages,
    selectRoom,
    sendMessage,
    sendFile,
    createRoom,
    fetchRooms,
    user,
    isAdmin,
  };
}
