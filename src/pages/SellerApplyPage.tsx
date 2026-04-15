import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, FileText, Image, CheckCircle2, Store } from "lucide-react";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SellerApplyPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">판매자 신청</h1>
          <p className="text-muted-foreground">판매자 신청을 위해 먼저 로그인해주세요.</p>
          <Button onClick={() => navigate("/login")}>로그인하기</Button>
        </div>
      </MainLayout>
    );
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const valid = newFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: 파일 크기가 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      toast.error("상호명/활동명을 입력해주세요.");
      return;
    }
    if (!bio.trim()) {
      toast.error("자기소개를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("seller-documents")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("seller-documents")
          .getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Create seller profile
      const { error } = await supabase.from("seller_profiles").insert({
        user_id: user.id,
        business_name: businessName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
        bank_info: JSON.stringify({ documents: uploadedUrls }),
        status: "신청",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("이미 판매자 신청을 하셨습니다.");
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      toast.success("판매자 신청이 완료되었습니다!");
    } catch (err: any) {
      toast.error("신청 중 오류가 발생했습니다: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
          <h1 className="text-2xl font-bold">신청이 완료되었습니다!</h1>
          <p className="text-muted-foreground text-center max-w-md">
            관리자가 신청 내용을 검토한 후 승인 여부를 알려드리겠습니다.
            승인 후 서비스 등록이 가능합니다.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">홈으로 돌아가기</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Store className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">판매자 신청</h1>
            <p className="text-muted-foreground mt-2">
              AI 콘텐츠 전문가로서 AI 팩토리에서 서비스를 판매해보세요
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>판매자 프로필에 표시될 정보입니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>상호명 / 활동명 <span className="text-red-500">*</span></Label>
                <Input
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="예: AI디자인스튜디오"
                  maxLength={50}
                />
              </div>
              <div>
                <Label>자기소개 / 전문 분야 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="전문 분야, 경력, 작업 스타일 등을 소개해주세요"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000</p>
              </div>
              <div>
                <Label>연락처</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>역량 증빙 자료</CardTitle>
              <CardDescription>
                포트폴리오, 자격증, 경력증명서 등 실력을 확인할 수 있는 자료를 첨부해주세요 (최대 {MAX_FILES}개, 각 10MB 이하)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    {file.type.startsWith("image/") ? (
                      <Image className="h-5 w-5 text-blue-500 shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-orange-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {files.length < MAX_FILES && (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      파일을 선택하거나 드래그하세요
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, 이미지, 문서 파일 지원
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleFileAdd}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="px-12"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "신청 중..." : "판매자 신청하기"}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SellerApplyPage;
