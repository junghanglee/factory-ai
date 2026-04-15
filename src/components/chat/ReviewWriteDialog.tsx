import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewWriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  userId: string;
  nickname: string;
  onComplete?: () => void;
}

export default function ReviewWriteDialog({
  open,
  onOpenChange,
  serviceId,
  userId,
  nickname,
  onComplete,
}: ReviewWriteDialogProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("service_reviews").insert({
        service_id: serviceId,
        user_id: userId,
        rating,
        review_text: reviewText.trim() || null,
        nickname,
        is_admin_entry: false,
      });
      if (error) throw error;

      // Update service review count and rating
      const { data: reviews } = await supabase
        .from("service_reviews")
        .select("rating")
        .eq("service_id", serviceId);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
        await supabase.from("services").update({
          rating: Math.round(avg * 10) / 10,
          review_count: reviews.length,
        }).eq("id", serviceId);
      }

      toast.success("리뷰가 등록되었습니다!");
      onOpenChange(false);
      onComplete?.();
    } catch (e: any) {
      toast.error("리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>리뷰 작성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Star rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          {/* Review text */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">후기 (선택)</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="서비스 이용 후기를 작성해주세요"
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>나중에</Button>
          <Button onClick={handleSubmit} disabled={submitting || rating < 1}>
            {submitting ? "등록중..." : "리뷰 등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
