import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.41-1 3.57 0 0-.02.09.04.13.07.04.14.01.14.01.19-.03 2.19-1.44 3.13-2.1.65.09 1.33.14 2.03.14 5.52 0 10-3.58 10-7.94-.01-4.88-4.49-7.42-10-7.42z" fill="#3C1E1E"/>
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("로그인 실패: " + error.message);
    } else {
      toast.success("로그인 성공!");
      navigate("/");
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google 로그인 실패: " + (result.error instanceof Error ? result.error.message : String(result.error)));
        setSocialLoading(false);
        return;
      }
      if (result.redirected) return;
      toast.success("Google 로그인 성공!");
      navigate("/");
    } catch {
      toast.error("Google 로그인 중 오류가 발생했습니다.");
      setSocialLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <p className="text-sm text-muted-foreground">AI팩토리에 오신 것을 환영합니다</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={handleGoogleLogin}
                disabled={socialLoading}
              >
                <GoogleIcon />
                Google로 로그인
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                style={{ backgroundColor: "#FEE500", color: "#3C1E1E", borderColor: "#FEE500" }}
                disabled
                title="카카오 로그인은 준비 중입니다"
              >
                <KakaoIcon />
                카카오로 로그인
              </Button>
            </div>

            <div className="relative my-4">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">또는 이메일로 로그인</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">이메일</label>
                <input
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">비밀번호</label>
                <input
                  className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              계정이 없으신가요?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">회원가입</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
