import { useState, useRef, useCallback } from "react";
import { Upload, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, type ImageSizePreset } from "@/utils/imageCompression";
import { cn } from "@/lib/utils";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  maxFiles?: number;
  sizePreset?: ImageSizePreset;
}

export default function MultiImageUploader({
  value = [],
  onChange,
  bucket = "portfolio-files",
  folder = "services/portfolio",
  maxFiles = 10,
  sizePreset = "detail",
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, maxFiles - value.length);
    if (fileArr.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of fileArr) {
        const compressed = await compressImage(file, sizePreset);
        const ext = compressed.name.split(".").pop() || "webp";
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, compressed);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange([...value, ...urls]);
    } catch (err: any) {
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, maxFiles, onChange, value]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }} />
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div key={idx} className="relative group aspect-video rounded overflow-hidden border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < maxFiles && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-1.5 cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">이미지 추가 (최대 {maxFiles}개)</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
