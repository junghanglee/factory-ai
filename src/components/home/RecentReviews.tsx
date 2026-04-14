import { Star, Shield, User } from "lucide-react";
import { useRecentReviews } from "@/hooks/useServiceReviews";
import { Link } from "react-router-dom";

const RecentReviews = () => {
  const { data: reviews = [] } = useRecentReviews(6);

  if (reviews.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">고객 후기</h2>
          <p className="text-muted-foreground">실제 이용 고객들의 생생한 후기입니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-sm">{review.nickname}</span>
                </div>
                <div className="flex">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              {review.review_text && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{review.review_text}</p>
              )}
              {review.image_url && (
                <img src={review.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              {review.services && (
                <Link
                  to={`/service/${review.service_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  {review.services.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentReviews;
