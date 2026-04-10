import { useState, useEffect } from "react";
import { MessageSquareText, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface QuickPhrasesProps {
  userId: string;
  onSelect: (phrase: string) => void;
}

interface Phrase {
  id: string;
  phrase: string;
  sort_order: number;
}

export default function QuickPhrases({ userId, onSelect }: QuickPhrasesProps) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchPhrases = async () => {
    const { data } = await supabase
      .from("quick_phrases")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order");
    if (data) setPhrases(data as Phrase[]);
  };

  useEffect(() => {
    if (open) fetchPhrases();
  }, [open, userId]);

  const handleAdd = async () => {
    if (!newPhrase.trim()) return;
    await supabase.from("quick_phrases").insert({
      user_id: userId,
      phrase: newPhrase.trim(),
      sort_order: phrases.length,
    });
    setNewPhrase("");
    await fetchPhrases();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("quick_phrases").delete().eq("id", id);
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSelect = (phrase: string) => {
    onSelect(phrase);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="자주쓰는 문구">
          <MessageSquareText className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="top">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm font-medium">자주쓰는 문구</span>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(!editing)}>
            {editing ? "완료" : "편집"}
          </Button>
        </div>
        <ScrollArea className="max-h-48">
          {phrases.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">등록된 문구가 없습니다</p>
          ) : (
            phrases.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors border-b last:border-0">
                <button
                  className="flex-1 text-left text-sm truncate"
                  onClick={() => !editing && handleSelect(p.phrase)}
                >
                  {p.phrase}
                </button>
                {editing && (
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </ScrollArea>
        <div className="p-2 border-t flex items-center gap-1.5">
          <Input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="새 문구 입력..."
            className="h-8 text-xs"
          />
          <Button size="sm" className="h-8 px-2 shrink-0" onClick={handleAdd} disabled={!newPhrase.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
