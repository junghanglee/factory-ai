import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SignupPage = () => {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <p className="text-sm text-muted-foreground">AI팩토리와 함께 시작하세요</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">이름</label>
              <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="이름" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">이메일</label>
              <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="email@example.com" type="email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">비밀번호</label>
              <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="비밀번호 (8자 이상)" type="password" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">비밀번호 확인</label>
              <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="비밀번호 확인" type="password" />
            </div>
            <Button className="w-full">가입하기</Button>

            <div className="relative my-4">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">또는</span>
            </div>

            <Button variant="outline" className="w-full">Google로 가입</Button>
            <Button variant="outline" className="w-full">카카오로 가입</Button>

            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">로그인</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SignupPage;
