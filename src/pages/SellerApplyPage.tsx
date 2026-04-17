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
import { useTranslation } from "react-i18next";
import { useFeatureFlag } from "@/hooks/useSiteSettings";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SellerApplyPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const certifiedSellersEnabled = useFeatureFlag("certified_sellers_enabled");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!certifiedSellersEnabled) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">현재 판매자 신청을 받고 있지 않습니다</h1>
          <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
          <Button onClick={() => navigate("/")}>홈으로</Button>
        </div>
      </MainLayout>
    );
  }


  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t("seller.apply")}</h1>
          <p className="text-muted-foreground">{t("seller.loginRequired")}</p>
          <Button onClick={() => navigate("/login")}>{t("common.goLogin")}</Button>
        </div>
      </MainLayout>
    );
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const valid = newFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(t("seller.fileSizeError", { name: f.name }));
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
      toast.error(t("seller.enterBusinessName"));
      return;
    }
    if (!bio.trim()) {
      toast.error(t("seller.enterBio"));
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
          toast.error(t("seller.alreadyApplied"));
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      toast.success(t("seller.applySuccess"));
    } catch (err: any) {
      toast.error(t("seller.applyError") + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
          <h1 className="text-2xl font-bold">{t("seller.submitted")}</h1>
          <p className="text-muted-foreground text-center max-w-md">
            {t("seller.submittedDesc")}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">{t("common.goHome")}</Button>
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
            <h1 className="text-3xl font-bold">{t("seller.apply")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("seller.applyDesc")}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("seller.basicInfo")}</CardTitle>
              <CardDescription>{t("seller.basicInfoDesc")}</CardDescription>
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
                <Label>{t("seller.bioLabel")} <span className="text-red-500">*</span></Label>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={t("seller.bioPlaceholder")}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/1000</p>
              </div>
              <div>
                <Label>{t("seller.contact")}</Label>
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
              <CardTitle>{t("seller.documents")}</CardTitle>
              <CardDescription>
                {t("seller.documentsDesc", { max: MAX_FILES })}
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
                      {t("seller.selectOrDrag")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("seller.supportedFiles")}
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
              {submitting ? t("seller.submitting") : t("seller.submitApply")}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SellerApplyPage;
