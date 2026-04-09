import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/data/services";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const OrderPage = () => {
  const service = services[0];
  const packagePrice = Math.round(service.price * 1.8);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">주문/결제</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Order summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">주문 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img src={service.thumbnail} alt="" className="w-24 h-18 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-sm">{service.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">Standard 패키지</p>
                    <p className="text-sm text-muted-foreground">납기: 5일 · 수정: 3회</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">요구사항</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">프로젝트 제목</label>
                  <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="프로젝트 제목을 입력하세요" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">상세 요구사항</label>
                  <textarea className="w-full h-32 px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="원하시는 스타일, 참고 자료, 특별 요청사항 등을 자세히 적어주세요." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">참고 파일 첨부</label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
                    클릭하거나 파일을 드래그하여 업로드하세요
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">결제 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">카드 번호</label>
                    <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0000-0000-0000-0000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">유효기간</label>
                    <input className="w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="MM/YY" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price summary sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">결제 금액</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">서비스 금액</span>
                  <span>{formatPrice(packagePrice)}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">할인</span>
                  <span className="text-destructive">-0원</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>총 결제 금액</span>
                  <span className="text-primary">{formatPrice(packagePrice)}원</span>
                </div>
                <Button className="w-full mt-4">결제하기</Button>
                <p className="text-xs text-muted-foreground text-center">
                  결제 시 이용약관에 동의하는 것으로 간주합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderPage;
