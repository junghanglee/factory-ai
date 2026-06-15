import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { smartCompress } from "@/utils/imageCompression";
import { toast } from "sonner";

export interface ChatRoom {
  id: string;
  customer_id: string;
  admin_id: string | null;
  seller_id: string | null;
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
  payment_status: string;
  quote_details: Record<string, any> | null;
  order_date: string;
  due_date: string;
  completed_date: string | null;
  notes: string | null;
  seller_id: string | null;
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

  // Create a new chat room (or reuse existing room for same customer+service)
  const createRoom = useCallback(async (title: string, serviceId?: string, metadata?: Record<string, any>) => {
    if (!user) return null;

    // ✅ One room per (customer, service): if a room already exists for this
    // customer and service, reuse it. Add-on orders/inquiries land in same room.
    if (serviceId) {
      const { data: existing } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("customer_id", user.id)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        // Optionally merge new metadata (e.g. latest order info) without losing existing
        if (metadata && Object.keys(metadata).length > 0) {
          const merged = { ...((existing as any).metadata || {}), ...metadata };
          await supabase.from("chat_rooms").update({ metadata: merged } as any).eq("id", (existing as any).id);
        }
        // Fire-and-forget Telegram notification (also for reused rooms)
        supabase.functions.invoke("notify-new-chat", {
          body: {
            roomId: (existing as any).id,
            title,
            serviceTitle: title,
            customerName: (user as any)?.user_metadata?.name || user.email || "고객",
          },
        }).catch((e) => console.warn("notify-new-chat failed", e));
        await fetchRooms();
        return existing as ChatRoom;
      }
    }

    // Auto-lookup seller_id from the service
    let sellerId: string | null = null;
    if (serviceId) {
      const { data: svc } = await supabase
        .from("services")
        .select("seller_id")
        .eq("id", serviceId)
        .maybeSingle();
      if (svc?.seller_id) sellerId = svc.seller_id;
    }

    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        customer_id: user.id,
        title,
        service_id: serviceId || null,
        seller_id: sellerId,
        metadata: metadata || {},
      } as any)
      .select()
      .single();
    if (error) { console.error(error); return null; }
    toast.success("채팅방이 생성되었습니다.");
    // Fire-and-forget Telegram notification to admin
    supabase.functions.invoke("notify-new-chat", {
      body: {
        roomId: (data as any)?.id,
        title,
        serviceTitle: title,
        customerName: (user as any)?.user_metadata?.name || user.email || "고객",
      },
    }).catch((e) => console.warn("notify-new-chat failed", e));
    await fetchRooms();
    return data as ChatRoom;
  }, [user, fetchRooms]);

  // Send text message
  const sendMessage = useCallback(async (text: string, overrideRoomId?: string) => {
    const roomId = overrideRoomId || selectedRoomId;
    if (!user) { toast.error("로그인이 필요합니다."); return; }
    if (!roomId) { toast.error("채팅방을 먼저 선택해주세요."); return; }
    if (!text.trim()) return;
    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: user.id,
      message: text.trim(),
      message_type: "text",
    });
    if (error) {
      console.error("sendMessage error:", error);
      toast.error(`메시지 전송 실패: ${error.message}`);
      return;
    }
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
    if (uploadError) { console.error(uploadError); toast.error("파일 업로드에 실패했습니다."); return; }
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
    if (error) { console.error(error); toast.error("파일 메시지 저장에 실패했습니다."); return; }
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

    // Auto-lookup seller_id from the chat room's linked service
    let sellerId: string | null = null;
    const room = rooms.find(r => r.id === selectedRoomId);
    if (room?.service_id) {
      const { data: svc } = await supabase
        .from("services")
        .select("seller_id")
        .eq("id", room.service_id)
        .maybeSingle();
      if (svc?.seller_id) sellerId = svc.seller_id;
    }

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
      seller_id: sellerId,
    }).select().single();

    if (error) { console.error(error); toast.error("프로젝트 생성에 실패했습니다."); return null; }

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

    // Send notification to seller if applicable
    if (sellerId) {
      await supabase.from("seller_notifications").insert({
        seller_id: sellerId,
        type: "new_order",
        title: "새 주문이 접수되었습니다",
        message: `서비스: ${params.serviceTitle}\n금액: ${params.price.toLocaleString()}원\n납기일: ${dueDate.toLocaleDateString("ko-KR")}`,
        metadata: { project_id: data.id, order_number: orderNumber },
      });
    }

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

  // Customer: Confirm project completion (legacy)
  const confirmProject = useCallback(async () => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({
      confirm_status: "확인완료",
      status: "완료",
      completed_date: new Date().toISOString().split("T")[0],
    }).eq("id", project.id);
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: "✅ 고객이 결과물을 확인하고 프로젝트를 완료 처리했습니다.",
      message_type: "text",
    });
    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "프로젝트 완료 확인", last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [project, selectedRoomId, user, fetchProject]);

  // Customer: Request revision
  const requestRevision = useCallback(async (reason: string) => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({ confirm_status: "수정요청", status: "수정중" }).eq("id", project.id);
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: `🔄 수정 요청\n\n사유: ${reason}`, message_type: "text",
    });
    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "수정 요청", last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
  }, [project, selectedRoomId, user, fetchProject]);

  // Admin/Seller: Send quote (신규 또는 추가금)
  const sendQuote = useCallback(async (params: {
    serviceTitle: string; packageName: string; price: number; priceUsd?: number | null; deliveryDays: number; memo: string;
    packageId?: string | null; quoteType?: "new" | "addon"; addonMode?: "separate" | "merge";
  }) => {
    if (!user || !selectedRoomId) return null;
    const isAddon = params.quoteType === "addon";
    const isMerge = isAddon && params.addonMode === "merge";
    const room = rooms.find(r => r.id === selectedRoomId);

    // ─── 추가금: 기존 결제건에 합산 ───
    if (isMerge) {
      // 채팅방의 기본 project_id 또는 가장 최근의 메인(ORD-) 프로젝트를 기준으로 합산
      let baseProjectId = room?.project_id || null;
      if (!baseProjectId && room?.customer_id) {
        const { data: latest } = await supabase.from("projects")
          .select("id, price")
          .eq("customer_id", room.customer_id)
          .like("order_number", "ORD-%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        baseProjectId = latest?.id || null;
      }
      if (!baseProjectId) {
        toast.error("합산할 기존 결제건을 찾지 못했습니다. '별도 청구서'로 발송해주세요.");
        return null;
      }
      const { data: baseProj } = await supabase.from("projects")
        .select("id, order_number, service_title, price, payment_status, quote_details")
        .eq("id", baseProjectId).maybeSingle();
      if (!baseProj) { toast.error("기존 결제건 정보를 불러올 수 없습니다."); return null; }

      const previousPrice = baseProj.price || 0;
      const newTotalPrice = previousPrice + params.price;
      const oldDetails = (baseProj.quote_details as any) || {};
      const addonHistory = Array.isArray(oldDetails.addonHistory) ? oldDetails.addonHistory : [];
      addonHistory.push({
        addedAt: new Date().toISOString(),
        amount: params.price,
        amountUsd: params.priceUsd ?? null,
        reason: params.serviceTitle,
        memo: params.memo || null,
      });
      const updatedDetails = {
        ...oldDetails,
        price: newTotalPrice,
        previousPrice,
        addonHistory,
      };

      // 원 프로젝트 금액을 합산값으로 갱신 (결제 상태는 유지하지 않고 차액 결제 대기로 전환)
      await supabase.from("projects").update({
        price: newTotalPrice,
        payment_status: "입금대기",
        quote_details: updatedDetails,
        notes: (baseProj as any).notes ? `${(baseProj as any).notes}\n[추가금 합산] +${params.price.toLocaleString()}원 - ${params.serviceTitle}` : `[추가금 합산] +${params.price.toLocaleString()}원 - ${params.serviceTitle}`,
      }).eq("id", baseProjectId);

      // 차액 결제용 견적 메시지 (기존 프로젝트에 연결)
      const mergeQuoteDetails = {
        serviceTitle: params.serviceTitle,
        packageName: params.packageName || undefined,
        price: params.price,
        priceUsd: params.priceUsd ?? undefined,
        deliveryDays: params.deliveryDays,
        memo: params.memo || undefined,
        orderNumber: baseProj.order_number,
        isAddon: true,
        isMerged: true,
        previousPrice,
        newTotalPrice,
      };
      await supabase.from("chat_messages").insert({
        room_id: selectedRoomId, sender_id: user.id,
        message: `🔗 추가금이 기존 결제건에 합산되었습니다.\n항목: ${params.serviceTitle}\n추가금: ${params.price.toLocaleString()}원${params.priceUsd ? ` ($${params.priceUsd})` : ""}\n총 결제 금액: ${previousPrice.toLocaleString()}원 → ${newTotalPrice.toLocaleString()}원`,
        message_type: "quote", file_name: JSON.stringify(mergeQuoteDetails),
      });
      await supabase.from("chat_rooms").update({
        last_message: `🔗 추가금 합산: +${params.price.toLocaleString()}원`,
        last_message_at: new Date().toISOString(),
      }).eq("id", selectedRoomId);

      toast.success("기존 결제건에 추가금이 합산되었습니다.");
      await fetchProject(selectedRoomId);
      await fetchRooms();
      return baseProj as Project;
    }

    // ─── 신규 견적 또는 별도 추가금 ───
    const orderPrefix = isAddon ? "ADD" : "ORD";
    const orderNumber = `${orderPrefix}-${Date.now().toString(36).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + params.deliveryDays);
    let sellerId: string | null = null;
    if (room?.service_id) {
      const { data: svc } = await supabase.from("services").select("seller_id").eq("id", room.service_id).maybeSingle();
      if (svc?.seller_id) sellerId = svc.seller_id;
    }
    const quoteDetails = {
      serviceTitle: params.serviceTitle,
      packageName: params.packageName || undefined,
      packageId: params.packageId || undefined,
      price: params.price,
      priceUsd: params.priceUsd ?? undefined,
      deliveryDays: params.deliveryDays,
      memo: params.memo || undefined,
      orderNumber,
      isAddon,
    };
    const { data: proj, error } = await supabase.from("projects").insert({
      order_number: orderNumber,
      service_title: isAddon ? `[추가금] ${params.serviceTitle}` : params.serviceTitle,
      package_name: params.packageName || null,
      customer: room?.title || "고객", customer_id: room?.customer_id || null, price: params.price,
      status: "대기", payment_status: "견적발송", quote_details: quoteDetails,
      due_date: dueDate.toISOString().split("T")[0], notes: params.memo || null, seller_id: sellerId,
    }).select().single();
    if (error || !proj) { console.error(error); toast.error("견적서 발송에 실패했습니다."); return null; }
    // 신규 견적인 경우에만 채팅방의 기본 project_id 갱신 (추가금은 별도 건으로 유지)
    if (!isAddon) {
      await supabase.from("chat_rooms").update({ project_id: proj.id }).eq("id", selectedRoomId);
    }
    const labelEmoji = isAddon ? "💳" : "📋";
    const labelText = isAddon ? "추가금 청구서" : "견적서";
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: `${labelEmoji} ${labelText}가 발송되었습니다.\n서비스: ${params.serviceTitle}\n금액: ${params.price.toLocaleString()}원${params.priceUsd ? ` ($${params.priceUsd})` : ''}`,
      message_type: "quote", file_name: JSON.stringify(quoteDetails),
    });
    await supabase.from("chat_rooms").update({
      last_message: `${labelEmoji} ${labelText}: ${params.price.toLocaleString()}원`, last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
    if (sellerId) {
      await supabase.from("seller_notifications").insert({
        seller_id: sellerId, type: isAddon ? "addon_quote_sent" : "quote_sent",
        title: isAddon ? "추가금 청구서가 발송되었습니다" : "견적서가 발송되었습니다",
        message: `서비스: ${params.serviceTitle}\n금액: ${params.price.toLocaleString()}원`,
        metadata: { project_id: proj.id, order_number: orderNumber, is_addon: isAddon },
      });
    }
    toast.success(`${labelText}가 발송되었습니다.`);
    await fetchRooms();
    return proj as Project;
  }, [user, selectedRoomId, rooms, fetchRooms, fetchProject]);

  // Admin/Seller: Confirm payment
  const confirmPayment = useCallback(async () => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({ payment_status: "입금완료", status: "작업중" }).eq("id", project.id);
    if (project.seller_id) {
      const { data: seller } = await supabase.from("seller_profiles").select("commission_rate").eq("id", project.seller_id).maybeSingle();
      const rate = seller?.commission_rate || 10;
      const commissionAmount = Math.round(project.price * rate / 100);
      await supabase.from("settlements").insert({
        seller_id: project.seller_id, project_id: project.id, order_amount: project.price,
        commission_rate: rate, commission_amount: commissionAmount,
        seller_amount: project.price - commissionAmount, status: "대기",
      });
    }
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: "💰 입금이 확인되었습니다. 제작을 시작합니다.", message_type: "text",
    });
    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "입금 확인 완료", last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
    toast.success("입금 확인 처리되었습니다.");
  }, [project, selectedRoomId, user, fetchProject]);

  // Admin/Seller: Send purchase confirmation request
  const sendPurchaseConfirmRequest = useCallback(async () => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: "결과물 확인 후 구매를 확정해주세요. 구매확정 후에는 수정 요청이 불가합니다.",
      message_type: "purchase_confirm", file_name: JSON.stringify({ confirmed: false }),
    });
    await supabase.from("chat_rooms").update({
      last_message: "구매확정 요청", last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
    toast.success("구매확정 요청이 전송되었습니다.");
  }, [project, selectedRoomId, user]);

  // Customer: Confirm purchase (irreversible)
  const confirmPurchase = useCallback(async (messageId: string) => {
    if (!project || !selectedRoomId || !user) return;
    await supabase.from("projects").update({
      confirm_status: "확인완료", payment_status: "구매확정", status: "완료",
      completed_date: new Date().toISOString().split("T")[0],
    }).eq("id", project.id);
    await supabase.from("chat_messages").update({
      file_name: JSON.stringify({ confirmed: true, confirmedAt: new Date().toISOString() }),
    }).eq("id", messageId);
    if (project.seller_id) {
      await supabase.from("settlements").update({
        status: "정산완료", settled_at: new Date().toISOString(),
      }).eq("project_id", project.id);
    }
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: "✅ 구매가 확정되었습니다. 이용해주셔서 감사합니다!", message_type: "text",
    });
    const room = rooms.find(r => r.id === selectedRoomId);
    await supabase.from("chat_messages").insert({
      room_id: selectedRoomId, sender_id: user.id,
      message: "서비스는 만족스러우셨나요? 리뷰를 작성해주세요!",
      message_type: "review_prompt",
      file_name: JSON.stringify({ serviceId: room?.service_id, projectId: project.id }),
    });
    await fetchProject(selectedRoomId);
    await supabase.from("chat_rooms").update({
      last_message: "구매 확정 완료", last_message_at: new Date().toISOString(),
    }).eq("id", selectedRoomId);
    if (project.customer_id) {
      const { data: member } = await supabase.from("members").select("order_count, total_spent").eq("id", project.customer_id).maybeSingle();
      if (member) {
        await supabase.from("members").update({
          order_count: (member.order_count || 0) + 1, total_spent: (member.total_spent || 0) + project.price,
        }).eq("id", project.customer_id);
      }
    }
    if (project.seller_id) {
      const { data: seller } = await supabase.from("seller_profiles").select("total_sales, total_revenue").eq("id", project.seller_id).maybeSingle();
      if (seller) {
        await supabase.from("seller_profiles").update({
          total_sales: (seller.total_sales || 0) + 1, total_revenue: (seller.total_revenue || 0) + project.price,
        }).eq("id", project.seller_id);
      }
    }
    toast.success("구매가 확정되었습니다!");
  }, [project, selectedRoomId, user, rooms, fetchProject]);

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
    sendQuote,
    confirmPayment,
    sendPurchaseConfirmRequest,
    confirmPurchase,
  };
}
