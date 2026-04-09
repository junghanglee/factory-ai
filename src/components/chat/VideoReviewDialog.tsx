import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VideoComment {
  id: string;
  timestamp_seconds: number;
  comment: string;
  user_id: string;
  created_at: string;
}

interface VideoReviewDialogProps {
  open: boolean;
  onClose: () => void;
  messageId: string;
  roomId: string;
  videoUrl: string;
}

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoReviewDialog({ open, onClose, messageId, roomId, videoUrl }: VideoReviewDialogProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  // Get or create review
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("video_reviews")
        .select("*")
        .eq("message_id", messageId)
        .single();
      if (data) {
        setReviewId(data.id);
      } else {
        const { data: newReview } = await supabase
          .from("video_reviews")
          .insert({ message_id: messageId, room_id: roomId } as any)
          .select()
          .single();
        if (newReview) setReviewId(newReview.id);
      }
    })();
  }, [open, messageId, roomId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!reviewId) return;
    const { data } = await supabase
      .from("video_comments")
      .select("*")
      .eq("review_id", reviewId)
      .order("timestamp_seconds", { ascending: true });
    if (data) setComments(data as VideoComment[]);
  }, [reviewId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Realtime comments
  useEffect(() => {
    if (!reviewId) return;
    const ch = supabase
      .channel(`video_comments_${reviewId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "video_comments", filter: `review_id=eq.${reviewId}` }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reviewId, fetchComments]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !reviewId || !user) return;
    await supabase.from("video_comments").insert({
      review_id: reviewId,
      user_id: user.id,
      timestamp_seconds: Math.floor(currentTime),
      comment: newComment.trim(),
    } as any);
    setNewComment("");
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>영상 피드백</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full rounded-lg"
              onTimeUpdate={handleTimeUpdate}
            />
            <p className="text-xs text-muted-foreground mt-1">
              현재 위치: {formatTimestamp(currentTime)}
            </p>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-medium mb-2">수정 코멘트</h4>
            <ScrollArea className="flex-1 max-h-48 mb-3">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">아직 코멘트가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2 bg-secondary rounded-lg text-xs">
                      <button
                        onClick={() => seekTo(c.timestamp_seconds)}
                        className="text-primary font-mono font-medium hover:underline flex items-center gap-1 mb-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(c.timestamp_seconds)}
                      </button>
                      <p>{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex items-center gap-2">
              <div className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0">
                {formatTimestamp(currentTime)}
              </div>
              <Input
                placeholder="수정사항 입력..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                className="text-sm h-8"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSubmitComment} disabled={!newComment.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
