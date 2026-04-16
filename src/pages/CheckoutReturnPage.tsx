import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";

export default function CheckoutReturnPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        {sessionId ? (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">결제가 완료되었습니다!</h1>
            <p className="text-muted-foreground">
              주문이 성공적으로 처리되었습니다.<br />
              프로젝트 페이지에서 진행 상황을 확인하세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/my-projects">
                  내 프로젝트 보기 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/chat">채팅으로 이동</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">결제 정보를 찾을 수 없습니다</h1>
            <Button asChild>
              <Link to="/">홈으로 돌아가기</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
