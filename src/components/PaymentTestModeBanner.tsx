const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("test_")) return null;

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
