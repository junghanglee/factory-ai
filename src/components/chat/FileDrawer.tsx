import { useMemo } from "react";
import { FileText, Download, Image, Video, File } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChatMessage } from "@/hooks/useChat";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

interface FileDrawerProps {
  messages: ChatMessage[];
  onClose: () => void;
}

export default function FileDrawer({ messages, onClose }: FileDrawerProps) {
  const fileMessages = useMemo(() =>
    messages.filter((m) => m.file_url && ["image", "video", "file", "confirm_video"].includes(m.message_type)),
    [messages]
  );

  const images = fileMessages.filter((m) => m.message_type === "image");
  const videos = fileMessages.filter((m) => m.message_type === "video" || m.message_type === "confirm_video");
  const docs = fileMessages.filter((m) => m.message_type === "file");

  return (
    <div className="w-72 border-l flex flex-col shrink-0 bg-muted/30">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">파일함</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">닫기</button>
      </div>
      <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 h-8">
          <TabsTrigger value="all" className="text-xs h-6 px-2">전체 ({fileMessages.length})</TabsTrigger>
          <TabsTrigger value="images" className="text-xs h-6 px-2">이미지 ({images.length})</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs h-6 px-2">영상 ({videos.length})</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs h-6 px-2">문서 ({docs.length})</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1 p-3">
          <TabsContent value="all" className="mt-0">
            <FileList files={fileMessages} />
          </TabsContent>
          <TabsContent value="images" className="mt-0">
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((m) => (
                <a key={m.id} href={m.file_url!} target="_blank" rel="noopener noreferrer">
                  <img src={m.file_url!} alt="" className="w-full h-16 object-cover rounded" />
                </a>
              ))}
            </div>
            {images.length === 0 && <Empty />}
          </TabsContent>
          <TabsContent value="videos" className="mt-0">
            <FileList files={videos} />
          </TabsContent>
          <TabsContent value="docs" className="mt-0">
            <FileList files={docs} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function FileList({ files }: { files: ChatMessage[] }) {
  if (files.length === 0) return <Empty />;
  return (
    <div className="space-y-1.5">
      {files.map((m) => {
        const icon = m.message_type === "image" ? <Image className="h-4 w-4" /> :
          (m.message_type === "video" || m.message_type === "confirm_video") ? <Video className="h-4 w-4" /> :
            <FileText className="h-4 w-4" />;
        return (
          <a key={m.id} href={m.file_url!} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-lg bg-background/80 hover:bg-accent text-xs group">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.file_name || "파일"}</p>
              <p className="text-muted-foreground text-[10px]">
                {m.file_size ? formatFileSize(m.file_size) : ""} · {formatDate(m.created_at)}
              </p>
            </div>
            <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground py-4 text-center">파일이 없습니다</p>;
}
