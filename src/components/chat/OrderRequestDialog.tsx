import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, X, Upload } from "lucide-react";

interface OrderRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    title: string;
    category_id: string | null;
  };
  pkg: {
    name: string;
    price: number;
    delivery_days: number;
    revisions: number;
    features: string[] | null;
  };
  categoryName: string;
  userName: string;
  userEmail: string;
  onSubmit: (data: OrderFormData) => void;
}

export interface OrderFormData {
  // Common
  requesterName: string;
  requesterEmail: string;
  serviceTitle: string;
  packageName: string;
  price: number;
  deliveryDays: number;
  categoryName: string;
  // Category-specific
  refUrl?: string;
  description?: string;
  productionTime?: string;
  quantity?: string;
  subject?: string;
  videoTime?: string;
  llmOwned?: string;
  pcMemory?: string;
  aiAgentExp?: string;
  // Files
  files: File[];
}

type CategoryType = "ai-image" | "ai-video" | "ai-webtoon" | "ai-ads" | "ai-assistant" | "mini-game" | "other";

function getCategoryType(categoryName: string): CategoryType {
  if (categoryName.includes("이미지")) return "ai-image";
  if (categoryName.includes("영상제작") || categoryName.includes("모션")) return "ai-video";
  if (categoryName.includes("웹툰")) return "ai-webtoon";
  if (categoryName.includes("바이럴") || categoryName.includes("광고")) return "ai-ads";
  if (categoryName.includes("비서") || categoryName.includes("크레딧")) return "ai-assistant";
  if (categoryName.includes("미니게임")) return "mini-game";
  return "other";
}

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

export default function OrderRequestDialog({
  open, onOpenChange, service, pkg, categoryName, userName, userEmail, onSubmit,
}: OrderRequestDialogProps) {
  const catType = getCategoryType(categoryName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refUrl, setRefUrl] = useState("");
  const [description, setDescription] = useState("");
  const [productionTime, setProductionTime] = useState("");
  const [quantity, setQuantity] = useState("");
  const [subject, setSubject] = useState("");
  const [videoTime, setVideoTime] = useState("");
  const [llmOwned, setLlmOwned] = useState("");
  const [pcMemory, setPcMemory] = useState("");
  const [aiAgentExp, setAiAgentExp] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    e.target.value = "";
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    const data: OrderFormData = {
      requesterName: userName,
      requesterEmail: userEmail,
      serviceTitle: service.title,
      packageName: pkg.name,
      price: pkg.price,
      deliveryDays: pkg.delivery_days,
      categoryName,
      files,
    };
    if (refUrl) data.refUrl = refUrl;
    if (description) data.description = description;
    if (productionTime) data.productionTime = productionTime;
    if (quantity) data.quantity = quantity;
    if (subject) data.subject = subject;
    if (videoTime) data.videoTime = videoTime;
    if (llmOwned) data.llmOwned = llmOwned;
    if (pcMemory) data.pcMemory = pcMemory;
    if (aiAgentExp) data.aiAgentExp = aiAgentExp;
    onSubmit(data);
  };

  const showRefUrl = catType !== "ai-assistant";
  const showDescription = catType !== "ai-assistant";
  const showProductionTime = catType === "ai-video";
  const showQuantity = ["ai-video", "ai-webtoon", "ai-ads", "mini-game"].includes(catType);
  const showSubject = catType === "ai-ads";
  const showVideoTime = catType === "ai-ads";
  const showLlm = catType === "ai-assistant";
  const showPcMemory = catType === "ai-assistant";
  const showAiExp = catType === "ai-assistant";
  const quantityLabel = catType === "mini-game" ? "제작 갯수" : "제작 편수";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>의뢰 요청서</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 py-4">
            {/* Package summary */}
            <div className="rounded-lg border bg-accent/30 p-4 space-y-2">
              <h3 className="font-semibold text-sm">{service.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>패키지: <strong className="text-foreground">{pkg.name}</strong></span>
                <span>금액: <strong className="text-foreground">{formatPrice(pkg.price)}원</strong></span>
                {(pkg as any).price_text && <span className="col-span-2 text-xs">({(pkg as any).price_text})</span>}
                <span>납기: <strong className="text-foreground">{pkg.delivery_days}일</strong></span>
                <span>수정: <strong className="text-foreground">{pkg.revisions}회</strong></span>
              </div>
              {pkg.features && pkg.features.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {pkg.features.map((f) => (
                    <span key={f} className="text-xs bg-background px-2 py-0.5 rounded-full border">✓ {f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Requester info (auto) */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">요청자 정보</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">이름</Label>
                  <Input value={userName} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">이메일</Label>
                  <Input value={userEmail} disabled className="mt-1 bg-muted" />
                </div>
              </div>
            </div>

            {/* Category-specific fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">의뢰 상세</h4>

              {showSubject && (
                <div>
                  <Label className="text-xs">주제 *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="주제를 선택하세요" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="상품">상품</SelectItem>
                      <SelectItem value="서비스">서비스</SelectItem>
                      <SelectItem value="SNS용 콘텐츠">SNS용 콘텐츠</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showRefUrl && (
                <div>
                  <Label className="text-xs">참고 URL</Label>
                  <Input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                </div>
              )}

              {showProductionTime && (
                <div>
                  <Label className="text-xs">제작시간 (편당)</Label>
                  <Input value={productionTime} onChange={(e) => setProductionTime(e.target.value)} placeholder="예: 30초, 1분" className="mt-1" />
                </div>
              )}

              {showVideoTime && (
                <div>
                  <Label className="text-xs">영상시간</Label>
                  <Input value={videoTime} onChange={(e) => setVideoTime(e.target.value)} placeholder="예: 30초, 1분" className="mt-1" />
                </div>
              )}

              {showQuantity && (
                <div>
                  <Label className="text-xs">{quantityLabel}</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" className="mt-1" />
                </div>
              )}

              {showLlm && (
                <div>
                  <Label className="text-xs">LLM 보유 여부</Label>
                  <Select value={llmOwned} onValueChange={setLlmOwned}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="선택하세요" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="보유">보유</SelectItem>
                      <SelectItem value="미보유">미보유</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showPcMemory && (
                <div>
                  <Label className="text-xs">PC 메모리 사양</Label>
                  <Input value={pcMemory} onChange={(e) => setPcMemory(e.target.value)} placeholder="예: 16GB" className="mt-1" />
                </div>
              )}

              {showAiExp && (
                <div>
                  <Label className="text-xs">AI 에이전트 이용 경험</Label>
                  <Select value={aiAgentExp} onValueChange={setAiAgentExp}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="선택하세요" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="있음">있음</SelectItem>
                      <SelectItem value="없음">없음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* File attachment */}
              <div>
                <Label className="text-xs">기획서/자료 (파일첨부)</Label>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
                <div className="mt-1 space-y-2">
                  {files.length > 0 && (
                    <div className="space-y-1">
                      {files.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-secondary rounded-md px-3 py-2">
                          <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{f.name}</span>
                          <span className="text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                          <button onClick={() => removeFile(idx)}><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> 파일 추가 ({files.length}/10)
                  </Button>
                </div>
              </div>

              {showDescription && (
                <div>
                  <Label className="text-xs">상세설명 (5,000자 이내)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                    placeholder="의뢰 내용을 상세히 설명해주세요..."
                    className="mt-1 min-h-[120px]"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">{description.length}/5,000</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit}>의뢰 요청하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
