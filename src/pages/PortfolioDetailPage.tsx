import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft, Calendar, Building2, Banknote, FileText, Play, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { localize } from "@/utils/localize";

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url) || url.includes("unsplash");

function FinalOutputItem({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!isVideoUrl(url)) return;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };
  }, [url]);

  if (isVideoUrl(url)) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden bg-black group cursor-pointer"
        style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
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
          className="w-full h-full object-contain"
          preload="metadata"
          playsInline
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth && v.videoHeight && !aspectRatio) {
              setAspectRatio(v.videoWidth / v.videoHeight);
            }
          }}
          controls={isPlaying && isHovered}
        />
        {/* Netflix-style overlay */}
        {(!isPlaying || isHovered) && (
          <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying && isHovered ? 'opacity-60' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 group-hover:bg-white/30 group-hover:scale-110 transition-all">
                  <Play className="h-8 w-8 md:h-10 md:w-10 text-white fill-white ml-1" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-lg">{title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/70 text-sm">{t("portfolio.videoResult")}</span>
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
  const { t } = useTranslation();

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
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <div className="max-w-[1000px] mx-auto px-5 py-10 text-center">
          <p className="text-muted-foreground mb-4">{t("portfolio.notFound")}</p>
          <Link to="/" className="text-primary hover:underline">{t("common.goHome")}</Link>
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
          <ArrowLeft className="h-4 w-4" /> {t("portfolio.goBack")}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{localize(item, "title")}</h1>
            {item.category && <Badge variant="secondary">{item.category}</Badge>}
          </div>
          {item.description && (
            <p className="text-muted-foreground text-base">{localize(item, "description")}</p>
          )}
        </div>

        {/* Final outputs - top showcase */}
        {finalOutputs.length > 0 && (
          <div className="mb-8 space-y-4">
            {finalOutputs.map((url, idx) => (
              <FinalOutputItem key={idx} url={url} title={localize(item, "title")} />
            ))}

            {/* Watermark disclaimer */}
            <div className="flex items-start gap-3 bg-muted/60 border border-border rounded-lg px-4 py-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("portfolio.watermarkNotice")}
              </p>
            </div>
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
                  <p className="text-xs text-muted-foreground">{t("portfolio.client")}</p>
                  <p className="font-medium text-sm">{item.client_name}</p>
                </div>
              </div>
            )}
            {item.duration && (
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("portfolio.duration")}</p>
                  <p className="font-medium text-sm">{item.duration}</p>
                </div>
              </div>
            )}
            {item.cost && (
              <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4">
                <Banknote className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("portfolio.cost")}</p>
                  <p className="font-medium text-sm">{item.cost}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail images */}
        {detailImages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t("portfolio.detailImages")}</h2>
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
            <h2 className="text-lg font-semibold mb-4">{t("portfolio.attachedFiles")}</h2>
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
