import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Calendar, Building2, Banknote, FileText, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || url.includes("unsplash");

function FinalOutputItem({ url, title }: { url: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (isVideoUrl(url)) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden bg-black group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          const v = videoRef.current;
          if (!v) return;
          if (v.paused) { v.play(); setIsPlaying(true); }
          else { v.pause(); setIsPlaying(false); }
        }}
      >
        <video
          ref={videoRef}
          src={url}
          className="w-full max-h-[600px] object-contain"
          preload="metadata"
          playsInline
          onEnded={() => setIsPlaying(false)}
          controls={isPlaying && isHovered}
        />
        {/* Netflix-style overlay */}
        {(!isPlaying || isHovered) && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying && isHovered ? 'opacity-60' : 'opacity-100'}`}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            {/* Play button */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <Play className="h-8 w-8 md:h-10 md:w-10 text-white fill-white ml-1" />
                </div>
              </div>
            )}
            {/* Bottom info bar - Netflix style */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-lg">{title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/70 text-sm">영상 결과물</span>
                <span className="text-green-400 text-sm font-medium">HD</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isImageUrl(url)) {
    return (
      <div className="w-full rounded-xl overflow-hidden">
        <img src={url} alt={title} className="w-full max-h-[600px] object-cover" />
      </div>
    );
  }

  return null;
}

const PortfolioDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["portfolio_detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-[1000px] mx-auto px-5 py-10">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <div className="max-w-[1000px] mx-auto px-5 py-10 text-center">
          <p className="text-muted-foreground mb-4">포트폴리오를 찾을 수 없습니다.</p>
          <Link to="/" className="text-primary hover:underline">홈으로 돌아가기</Link>
        </div>
      </MainLayout>
    );
  }

  const detailImages: string[] = (item.detail_images as string[] | null) || [];
  const files: string[] = (item.files as string[] | null) || [];
  const finalOutputs: string[] = (item.final_outputs as string[] | null) || [];
  const getFileName = (url: string) => {
    try { return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "file"); } catch { return "file"; }
  };

  return (
    <MainLayout>
      <div className="max-w-[1000px] mx-auto px-5 py-8">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{item.title}</h1>
            {item.category && <Badge variant="secondary">{item.category}</Badge>}
          </div>
          {item.description && (
            <p className="text-muted-foreground text-base">{item.description}</p>
          )}
        </div>

        {/* Final outputs - top showcase */}
        {finalOutputs.length > 0 && (
          <div className="mb-8 space-y-4">
            {finalOutputs.map((url, idx) => (
              <FinalOutputItem key={idx} url={url} title={item.title} />
            ))}
          </div>
        )}

        {/* Main image (only if no final outputs) */}
        {finalOutputs.length === 0 && item.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={item.image_url} alt={item.title} className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* Extra info */}
        {item.show_extra_info && (item.client_name || item.duration || item.cost) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {item.client_name && (
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">고객</p>
                  <p className="font-medium text-sm">{item.client_name}</p>
                </div>
              </div>
            )}
            {item.duration && (
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">제작기간</p>
                  <p className="font-medium text-sm">{item.duration}</p>
                </div>
              </div>
            )}
            {item.cost && (
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4">
                <Banknote className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">제작비용</p>
                  <p className="font-medium text-sm">{item.cost}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail images */}
        {detailImages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">상세 이미지</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailImages.map((url, idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedImage(url)}
                >
                  <img src={url} alt={`상세 ${idx + 1}`} className="w-full h-auto object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attached files */}
        {files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">첨부 파일</h2>
            <div className="space-y-2">
              {files.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors"
                >
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm truncate">{getFileName(url)}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-foreground/80 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </MainLayout>
  );
};

export default PortfolioDetailPage;
