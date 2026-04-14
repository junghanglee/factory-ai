import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { smartCompress } from "@/utils/imageCompression";

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
  metadata: Record<string, any> | null;
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

export interface Project {
  id: string;
  order_number: string;
  service_title: string;
  package_name: string | null;
  customer: string;
  customer_id: string | null;
  price: number;
  status: string;
  confirm_status: string;
  order_date: string;
  due_date: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  url: string;
  uploaded_at: string;
}

export function useChat() {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

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

  // Fetch project for selected room
  const fetchProject = useCallback(async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room?.project_id) {
      setProject(null);
      setProjectFiles([]);
      return;
    }
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", room.project_id)
      .single();
    if (data) {
      setProject(data as Project);
      // Fetch project files
      const { data: files } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", data.id)
        .order("uploaded_at", { ascending: false });
      if (files) setProjectFiles(files as ProjectFile[]);
    } else {
      setProject(null);
      setProjectFiles([]);
    }
  }, [rooms]);

  // Select room
  const selectRoom = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchMessages(roomId);

    // Reset unread count for current user
    if (user) {
      if (isAdmin) {
        await supabase.from("chat_rooms").update({ unread_admin: 0 }).eq("id", roomId);
      } else {
        await supabase.from("chat_rooms").update({ unread_customer: 0 }).eq("id", roomId);
      }
    }
  }, [fetchMessages, user, isAdmin]);

  // Fetch project when room or rooms change
  useEffect(() => {
    if (selectedRoomId) {
      fetchProject(selectedRoomId);
    }
  }, [selectedRoomId, rooms, fetchProject]);

  // Create a new chat room
  const createRoom = useCallback(async (title: string, serviceId?: string, metadata?: Record<string, any>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        customer_id: user.id,
        title,
        service_id: serviceId || null,
        metadata: metadata || {},
      } as any)
      .select()
      .single();
    if (error) { console.error(error); return null; }
    await fetchRooms();
    return data as ChatRoom;
  }, [user, fetchRooms]);

  // Send text message
  const sendMessage = useCallback(async (text: string, overrideRoomId?: string) => {
    const roomId = overrideRoomId || selectedRoomId;
    if (!user || !roomId || !text.trim()) return;
    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.id,
      message: text.trim(),
      message_type: "text",
    });
    if (error) { console.error(error); return; }
    await supabase.from("chat_rooms").update({
      last_message: text.trim(),
      last_message_at: new Date().toISOString(),
    }).eq("id", roomId);
  }, [user, selectedRoomId]);

  // Send file with optional size limit (0 = no limit) and optional attached message
  const sendFile = useCallback(async (file: File, maxSizeMB: number = 0, attachedMessage?: string, overrideRoomId?: string) => {
    const roomId = overrideRoomId || selectedRoomId;
    if (!user || !roomId) return;
    if (maxSizeMB > 0 && file.size > maxSizeMB * 1024 * 1024) {
      alert(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`);
      return;
    }
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

    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.id,
      message: attachedMessage || displayName,
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
    }).eq("id", roomId);
  }, [user, selectedRoomId]);

  // Send confirm video (admin only)
  const sendConfirmVideo = useCallback(async (file: File, attachedMessage?: string) => {
    if (!user || !selectedRoomId) return;
    const compressed = await smartCompress(file, "chat");
    const ext = compressed.name.split(".").pop();
    const path = `${selectedRoomId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
    if (uploadError) { console.error(uploadError); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: attachedMessage || `🎬 컨펌 요청: ${file.name}`,
      message_type: "confirm_video",
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    if (error) { console.error(error); return; }
    await supabase.from("chat_rooms").update({
      last_message: `🎬 컨펌 요청: ${file.name}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [user, selectedRoomId]);

  // Admin: Create project from chat order and link to room
  const createProjectFromChat = useCallback(async (params: {
    serviceTitle: string;
    packageName?: string;
    price: number;
    deliveryDays: number;
    customerName: string;
    customerId: string;
    notes?: string;
  }) => {
    if (!user || !selectedRoomId) return null;
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + params.deliveryDays);

    const { data, error } = await supabase.from("projects").insert({
      order_number: orderNumber,
      service_title: params.serviceTitle,
      package_name: params.packageName || null,
      customer: params.customerName,
      customer_id: params.customerId,
      price: params.price,
      status: "작업중",
      due_date: dueDate.toISOString().split("T")[0],
      notes: params.notes || null,
    }).select().single();

    if (error) { console.error(error); return null; }

    // Link project to chat room
    await supabase.from("chat_rooms").update({
      project_id: data.id,
    }).eq("id", selectedRoomId);

    // Send system message
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: `✅ 프로젝트가 생성되었습니다.\n\n주문번호: ${orderNumber}\n서비스: ${params.serviceTitle}\n금액: ${params.price.toLocaleString()}원\n납기일: ${dueDate.toLocaleDateString("ko-KR")}`,
      message_type: "text",
    });

    await fetchRooms();
    return data as Project;
  }, [user, selectedRoomId, fetchRooms]);

  // Admin: Update project status
  const updateProjectStatus = useCallback(async (newStatus: string) => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);

    const statusEmojis: Record<string, string> = {
      "대기": "⏳", "작업중": "🔨", "검수중": "🔍", "수정중": "✏️", "완료": "✅",
    };
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: `${statusEmojis[newStatus] || "📌"} 프로젝트 상태가 "${newStatus}"(으)로 변경되었습니다.`,
      message_type: "text",
    });

    // Refresh
    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: `상태 변경: ${newStatus}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [project, selectedRoomId, user, fetchProject]);

  // Admin: Upload deliverable file to project
  const uploadDeliverable = useCallback(async (file: File) => {
    if (!project || !user) return;
    const compressed = await smartCompress(file, "detail");
    const ext = compressed.name.split(".").pop();
    const path = `deliverables/${project.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
    if (uploadError) { console.error(uploadError); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);

    await supabase.from("project_files").insert({
      project_id: project.id,
      name: file.name,
      url: urlData.publicUrl,
    });

    // Also send as chat message
    if (selectedRoomId) {
      await supabase.from("chat_messages").insert({
        room_id: selectedRoomId,
        sender_id: user.id,
        message: `📦 결과물 납품: ${file.name}`,
        message_type: "file",
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      await supabase.from("chat_rooms").update({
        last_message: `📦 결과물 납품: ${file.name}`,
        last_message_at: new Date().toISOString(),
      }).eq("id", selectedRoomId);
    }

    await fetchProject(selectedRoomId!);
  }, [project, user, selectedRoomId, fetchProject]);

  // Customer: Confirm project completion
  const confirmProject = useCallback(async () => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({
      confirm_status: "확인완료",
      status: "완료",
      completed_date: new Date().toISOString().split("T")[0],
    }).eq("id", project.id);

    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: "✅ 고객이 결과물을 확인하고 프로젝트를 완료 처리했습니다.",
      message_type: "text",
    });

    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "프로젝트 완료 확인",
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [project, selectedRoomId, user, fetchProject]);

  // Customer: Request revision
  const requestRevision = useCallback(async (reason: string) => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({
      confirm_status: "수정요청",
      status: "수정중",
    }).eq("id", project.id);

    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: `🔄 수정 요청\n\n사유: ${reason}`,
      message_type: "text",
    });

    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "수정 요청",
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [project, selectedRoomId, user, fetchProject]);

  // Admin: Send feedback request with files
  const sendFeedbackRequest = useCallback(async (requestText: string, files?: File[]) => {
    if (!user || !selectedRoomId || (!requestText.trim() && (!files || files.length === 0))) return;

    // Get room's service category for form template
    const room = rooms.find((r) => r.id === selectedRoomId);
    let categoryName = "";
    let serviceId = room?.service_id || "";
    let categoryId = "";
    if (room?.service_id) {
      const { data: svc } = await supabase
        .from("services")
        .select("category_id")
        .eq("id", room.service_id)
        .maybeSingle();
      if (svc?.category_id) {
        categoryId = svc.category_id;
        const { data: cat } = await supabase
          .from("categories")
          .select("name")
          .eq("id", svc.category_id)
          .maybeSingle();
        if (cat) categoryName = cat.name;
      }
    }
    // Also check metadata for category
    if (!categoryName && room?.metadata) {
      const meta = room.metadata as any;
      if (meta?.categoryName) categoryName = meta.categoryName;
      if (meta?.categoryId) categoryId = meta.categoryId;
    }

    // Upload files first
    const uploadedFiles: { url: string; name: string; type: string; size: number }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const compressed = await smartCompress(file, "chat");
        const ext = compressed.name.split(".").pop();
        const path = `${selectedRoomId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, compressed);
        if (uploadError) { console.error(uploadError); continue; }
        const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
        uploadedFiles.push({
          url: urlData.publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      }
    }

    // Build feedback message content with metadata
    const feedbackMeta = JSON.stringify({
      categoryName,
      serviceId,
      categoryId,
      files: uploadedFiles,
    });

    // Insert chat message with feedback_request type
    const { data: msgData, error: msgError } = await supabase.from("chat_messages").insert({
      room_id: selectedRoomId,
      sender_id: user.id,
      message: requestText.trim() || "피드백을 요청합니다.",
      message_type: "feedback_request",
      file_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
      file_name: uploadedFiles.length > 0 ? feedbackMeta : null,
    }).select().single();
    if (msgError || !msgData) { console.error(msgError); return; }

    // Insert feedback_requests record
    await supabase.from("feedback_requests").insert({
      room_id: selectedRoomId,
      message_id: msgData.id,
      request_text: requestText.trim() || "피드백을 요청합니다.",
      status: "pending",
    } as any);

    await supabase.from("chat_rooms").update({
      last_message: `📝 피드백 요청: ${requestText.trim().slice(0, 50) || "첨부파일 확인 요청"}`,
      last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [user, selectedRoomId, rooms]);

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

  // Realtime project updates
  useEffect(() => {
    if (!project) return;

    const projChannel = supabase
      .channel(`project_${project.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "projects",
        filter: `id=eq.${project.id}`,
      }, () => {
        if (selectedRoomId) fetchProject(selectedRoomId);
      })
      .subscribe();

    return () => { supabase.removeChannel(projChannel); };
  }, [project?.id, selectedRoomId, fetchProject]);

  return {
    rooms,
    selectedRoomId,
    messages,
    loadingRooms,
    loadingMessages,
    selectRoom,
    sendMessage,
    sendFile,
    sendConfirmVideo,
    sendFeedbackRequest,
    createRoom,
    fetchRooms,
    user,
    isAdmin,
    project,
    projectFiles,
    createProjectFromChat,
    updateProjectStatus,
    uploadDeliverable,
    confirmProject,
    requestRevision,
  };
}
