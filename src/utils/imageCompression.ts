/**
 * Predefined size presets for different upload contexts.
 * Each preset defines max dimensions optimized for where the image will be displayed.
 */
export type ImageSizePreset = "banner" | "thumbnail" | "avatar" | "detail" | "chat" | "portfolio" | "full";

const SIZE_PRESETS: Record<ImageSizePreset, { maxWidth: number; maxHeight: number; quality: number }> = {
  banner:    { maxWidth: 1440, maxHeight: 600,  quality: 0.80 },
  thumbnail: { maxWidth: 800,  maxHeight: 600,  quality: 0.78 },
  avatar:    { maxWidth: 256,  maxHeight: 256,  quality: 0.75 },
  detail:    { maxWidth: 1200, maxHeight: 1200, quality: 0.82 },
  chat:      { maxWidth: 1024, maxHeight: 1024, quality: 0.78 },
  portfolio: { maxWidth: 1200, maxHeight: 900,  quality: 0.80 },
  full:      { maxWidth: 1920, maxHeight: 1920, quality: 0.82 },
};

/**
 * Compress an image file using canvas API.
 * Supports preset-based sizing for different display contexts.
 */
export async function compressImage(
  file: File,
  presetOrWidth: ImageSizePreset | number = "full",
  maxHeight?: number,
  quality?: number
): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;
  // Skip SVGs and GIFs (can't compress meaningfully with canvas)
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  // Skip already small files (< 100KB)
  if (file.size < 100 * 1024) return file;

  let mw: number, mh: number, q: number;
  if (typeof presetOrWidth === "string") {
    const preset = SIZE_PRESETS[presetOrWidth] ?? SIZE_PRESETS.full;
    mw = preset.maxWidth;
    mh = preset.maxHeight;
    q = preset.quality;
  } else {
    mw = presetOrWidth;
    mh = maxHeight ?? presetOrWidth;
    q = quality ?? 0.82;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimensions
      if (width > mw || height > mh) {
        const ratio = Math.min(mw / width, mh / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
            type: "image/webp",
            lastModified: Date.now(),
          });
          console.log(
            `Image compressed [${typeof presetOrWidth === "string" ? presetOrWidth : "custom"}]: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${Math.round((1 - compressed.size / file.size) * 100)}% reduction, ${width}×${height})`
          );
          resolve(compressed);
        },
        "image/webp",
        q
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

/**
 * Compress a video file by reducing quality (returns original if browser doesn't support).
 * Videos are harder to compress client-side, so we mainly ensure reasonable size limits.
 */
export async function compressVideo(file: File, _maxSizeMB = 50): Promise<File> {
  // Client-side video compression is limited; just pass through
  // Server-side processing would be ideal for heavy compression
  return file;
}

/**
 * Smart compress: auto-detect file type and apply appropriate compression.
 */
export async function smartCompress(file: File, preset: ImageSizePreset = "full"): Promise<File> {
  if (file.type.startsWith("image/")) {
    return compressImage(file, preset);
  }
  if (file.type.startsWith("video/")) {
    return compressVideo(file);
  }
  return file;
}

/**
 * Compress multiple files with a specific preset.
 */
export async function compressFiles(files: File[], preset: ImageSizePreset = "full"): Promise<File[]> {
  return Promise.all(files.map((f) => smartCompress(f, preset)));
}
