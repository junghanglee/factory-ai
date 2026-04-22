import { useEffect, useState } from "react";

import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    let mounted = true;

    getPaddleEnvironment()
      .then((environment) => {
        if (mounted) setIsSandbox(environment === "sandbox");
      })
      .catch(() => {
        if (mounted) setIsSandbox(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!isSandbox) return null;

  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
      Paddle 테스트(Sandbox) 모드: 실제 결제가 이루어지지 않습니다.{" "}
      <a
        href="https://developer.paddle.com/concepts/payment-methods/test-payment-method"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        테스트 카드 보기
      </a>
    </div>
  );
}
