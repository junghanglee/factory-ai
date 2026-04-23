import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, Paperclip } from "lucide-react";

interface Popup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  position: string;
  width: number;
  height: number | null;
  offset_x: number;
  offset_y: number;
  show_pages: string[];
  start_at: string | null;
  end_at: string | null;
  show_today_close: boolean;
  show_close_button: boolean;
  active: boolean;
}

const STORAGE_PREFIX = "popup-hide-";

const matchPath = (pages: string[], current: string) => {
  if (pages.includes("*")) return true;
  return pages.some((p) => {
    if (p === "/") return current === "/";
    return current.startsWith(p);
  });
};

const isHidden = (id: string) => {
  const v = localStorage.getItem(STORAGE_PREFIX + id);
  if (!v) return false;
  return Date.now() < Number(v);
};

const PopupDisplay = () => {
  const location = useLocation();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [closed, setClosed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPopups = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("popups")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (!data) return;
      const filtered = (data as Popup[]).filter((p) => {
        if (p.start_at && p.start_at > now) return false;
        if (p.end_at && p.end_at < now) return false;
        if (!matchPath(p.show_pages, location.pathname)) return false;
        if (isHidden(p.id)) return false;
        return true;
      });
      setPopups(filtered);
    };
    fetchPopups();
  }, [location.pathname]);

  const close = (id: string, hideToday = false) => {
    if (hideToday) {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      localStorage.setItem(STORAGE_PREFIX + id, String(tomorrow.getTime()));
    }
    setClosed((prev) => new Set(prev).add(id));
  };

  const visible = popups.filter((p) => !closed.has(p.id));
  if (!visible.length) return null;

  const positionStyle = (p: Popup): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed",
      width: `${p.width}px`,
      maxWidth: "calc(100vw - 32px)",
      zIndex: 9999,
    };
    if (p.height) base.maxHeight = `${p.height}px`;
    const ox = p.offset_x, oy = p.offset_y;
    switch (p.position) {
      case "top-left": return { ...base, top: 16 + oy, left: 16 + ox };
      case "top-right": return { ...base, top: 16 + oy, right: 16 - ox };
      case "bottom-left": return { ...base, bottom: 16 - oy, left: 16 + ox };
      case "bottom-right": return { ...base, bottom: 16 - oy, right: 16 - ox };
      default: return { ...base, top: `calc(50% + ${oy}px)`, left: `calc(50% + ${ox}px)`, transform: "translate(-50%, -50%)" };
    }
  };

  const handleClick = (p: Popup, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-popup-control]")) return;
    if (p.link_url) {
      if (p.link_url.startsWith("http")) window.open(p.link_url, "_blank");
      else window.location.href = p.link_url;
    }
  };

  return (
    <>
      {visible.map((p) => (
        <div
          key={p.id}
          style={positionStyle(p)}
          className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => handleClick(p, e)}
          role="dialog"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-secondary/50">
            <h3 className="font-bold text-sm truncate">{p.title}</h3>
            {p.show_close_button && (
              <button
                data-popup-control
                onClick={() => close(p.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className={`flex-1 overflow-auto ${p.link_url ? "cursor-pointer" : ""}`}>
            {p.image_url && (
              <img src={p.image_url} alt={p.title} className="w-full h-auto block" />
            )}
            {p.content && (
              <div
                className="p-4 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: p.content }}
              />
            )}
            {p.attachment_url && (
              <a
                data-popup-control
                href={p.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs text-primary hover:underline border-t"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip className="h-3 w-3" />
                {p.attachment_name || "첨부파일 다운로드"}
              </a>
            )}
          </div>

          {p.show_today_close && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-secondary/30 text-xs">
              <button
                data-popup-control
                onClick={() => close(p.id, true)}
                className="text-muted-foreground hover:text-foreground"
              >
                오늘 하루 보지 않기
              </button>
              {p.show_close_button && (
                <button
                  data-popup-control
                  onClick={() => close(p.id)}
                  className="text-foreground font-medium"
                >
                  닫기
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default PopupDisplay;
