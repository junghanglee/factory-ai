import { useState, useEffect, useCallback } from "react";
import { User, Video, MessageSquare, Send, Trash2, Clock, Mail, Phone, CalendarDays, ShoppingCart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface AdminInfoPanelProps {
  customerId: string;
  roomId: string;
  currentUserId: string;
}

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

interface VideoFeedback {
  id: string;
  status: string;
  created_at: string;
  video_url: string | null;
  file_name: string | null;
  comments: {
    id: string;
    comment: string;
    timestamp_seconds: number;
    created_at: string;
  }[];
}

interface AdminNote {
  id: string;
  author_id: string;
  note: string;
  created_at: string;
  author_name?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminInfoPanel({ customerId, roomId, currentUserId }: AdminInfoPanelProps) {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [feedbacks, setFeedbacks] = useState<VideoFeedback[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMember = useCallback(async () => {
    // Try profiles first, then members
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", customerId)
      .single();

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (memberData) {
      setMember(memberData as MemberInfo);
    } else if (profile) {
      setMember({
        id: profile.user_id,
        name: profile.name || "미지정",
        email: "",
        phone: profile.phone,
        status: "활성",
        order_count: 0,
        total_spent: 0,
        created_at: profile.created_at,
      });
    }
  }, [customerId]);

  const fetchFeedbacks = useCallback(async () => {
    const { data: reviews } = await supabase
      .from("video_reviews")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (!reviews || reviews.length === 0) { setFeedbacks([]); return; }

    const feedbackList: VideoFeedback[] = [];
    for (const review of reviews) {
      // Get the message for video URL
      const { data: msg } = await supabase
        .from("chat_messages")
        .select("file_url, file_name")
        .eq("id", review.message_id)
        .single();

      // Get comments
      const { data: comments } = await supabase
        .from("video_comments")
        .select("*")
        .eq("review_id", review.id)
        .order("timestamp_seconds", { ascending: true });

      feedbackList.push({
        id: review.id,
        status: review.status,
        created_at: review.created_at,
        video_url: msg?.file_url || null,
        file_name: msg?.file_name || null,
        comments: (comments || []).map((c: any) => ({
          id: c.id,
          comment: c.comment,
          timestamp_seconds: Number(c.timestamp_seconds),
          created_at: c.created_at,
        })),
      });
    }
    setFeedbacks(feedbackList);
  }, [roomId]);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notes")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (data) {
      // Get author names from profiles
      const authorIds = [...new Set(data.map((n: any) => n.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", authorIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.name || "관리자"; });

      setNotes(data.map((n: any) => ({
        ...n,
        author_name: nameMap[n.author_id] || "관리자",
      })));
    }
  }, [roomId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMember(), fetchFeedbacks(), fetchNotes()]).finally(() => setLoading(false));
  }, [fetchMember, fetchFeedbacks, fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from("admin_notes").insert({
      room_id: roomId,
      author_id: currentUserId,
      note: newNote.trim(),
    });
    if (!error) {
      setNewNote("");
      await fetchNotes();
    }
  };

  const handleDeleteNote = async (id: string) => {
    await supabase.from("admin_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <div className="w-72 border-l flex items-center justify-center text-sm text-muted-foreground shrink-0">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="w-80 border-l flex flex-col shrink-0 bg-card">
      <Tabs defaultValue="member" className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 pt-2 pb-0 h-auto">
          <TabsTrigger value="member" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <User className="h-3.5 w-3.5 mr-1" /> 회원정보
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <Video className="h-3.5 w-3.5 mr-1" /> 피드백
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> 내부메모
          </TabsTrigger>
        </TabsList>

        {/* Member Info Tab */}
        <TabsContent value="member" className="flex-1 m-0 overflow-auto">
          <ScrollArea className="h-full">
            {member ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{member.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${member.status === "활성" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {member.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>가입일: {formatDate(member.created_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{member.order_count}</p>
                    <p className="text-xs text-muted-foreground">주문 수</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{member.total_spent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">총 결제액</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">회원 정보를 찾을 수 없습니다</div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Video Feedback Tab */}
        <TabsContent value="feedback" className="flex-1 m-0 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {feedbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">영상 피드백이 없습니다</p>
              ) : (
                feedbacks.map((fb) => (
                  <div key={fb.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{fb.file_name || "영상"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        fb.status === "approved" ? "bg-green-100 text-green-700" :
                        fb.status === "revision_requested" ? "bg-amber-100 text-amber-700" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {fb.status === "approved" ? "승인" : fb.status === "revision_requested" ? "수정요청" : "대기"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</p>

                    {fb.comments.length > 0 ? (
                      <div className="space-y-1.5 pt-1 border-t">
                        <p className="text-xs font-medium text-muted-foreground">코멘트 ({fb.comments.length})</p>
                        {fb.comments.map((c) => (
                          <div key={c.id} className="bg-secondary rounded-md p-2">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-xs font-mono text-primary">{formatTimestamp(c.timestamp_seconds)}</span>
                            </div>
                            <p className="text-xs">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-1 border-t">코멘트 없음</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Admin Notes Tab */}
        <TabsContent value="notes" className="flex-1 m-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">내부 메모가 없습니다</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-secondary rounded-lg p-3 group relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary">{note.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    {note.author_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="내부 메모 작성..."
              className="text-xs min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(); }
              }}
            />
            <Button size="sm" className="shrink-0 self-end" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
