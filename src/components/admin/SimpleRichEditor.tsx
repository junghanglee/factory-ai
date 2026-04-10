import { useRef, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

export default function SimpleRichEditor({ value, onChange, className, placeholder }: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const buttons = [
    { icon: Bold, cmd: "bold", label: "굵게" },
    { icon: Italic, cmd: "italic", label: "기울임" },
    { icon: Heading2, cmd: "formatBlock", val: "H3", label: "소제목" },
    { icon: List, cmd: "insertUnorderedList", label: "목록" },
    { icon: ListOrdered, cmd: "insertOrderedList", label: "순서 목록" },
    { icon: Minus, cmd: "insertHorizontalRule", label: "구분선" },
  ];

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-secondary/30">
        {buttons.map(({ icon: Icon, cmd, val, label }) => (
          <button
            key={cmd + (val || "")}
            type="button"
            title={label}
            onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
            className="p-1.5 rounded hover:bg-secondary transition-colors"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[160px] p-3 text-sm focus:outline-none prose prose-sm max-w-none [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_hr]:my-3"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || "" }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
