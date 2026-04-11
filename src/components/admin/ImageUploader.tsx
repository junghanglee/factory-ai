import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, type ImageSizePreset } from "@/utils/imageCompression";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  className?: string;
  aspectLabel?: string;
  sizePreset?: ImageSizePreset;
}

export default function ImageUploader({
  value,
  onChange,
  bucket = "portfolio-files",
  folder = "services",
  className,
  aspectLabel = "대표이미지",
  sizePreset = "thumbnail",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const upload = useCallback(async (file: File) => {
    if (uploading) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, sizePreset);
      const ext = compressed.name.split(".").pop() || "webp";
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, compressed);
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChangeRef.current(data.publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, sizePreset, uploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  }, [upload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div className={cn("relative", className)}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border aspect-video">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 rounded text-sm font-medium text-foreground"
            >
              변경
            </button>
            <button
              type="button"
              onClick={() => onChangeRef.current("")}
              className="p-1.5 bg-white/90 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{aspectLabel}</span>
              <span className="text-xs text-muted-foreground">클릭 또는 드래그하여 업로드</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
