import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { ArrowLeft } from "lucide-react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import MainLayout from "@/components/layout/MainLayout";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const projectId = searchParams.get("project_id") || "";
  const amount = parseInt(searchParams.get("amount") || "0");
  const currency = searchParams.get("currency") || "krw";
  const serviceTitle = searchParams.get("title") || "서비스 결제";

  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: {
        project_id: projectId,
        amount,
        currency,
        service_title: serviceTitle,
        return_url: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  if (!projectId || !amount) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">결제 정보가 올바르지 않습니다.</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>돌아가기</Button>
        </div>
      </MainLayout>
    );
  }

  const displayAmount = currency === "usd"
    ? `$${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `${amount.toLocaleString("ko-KR")}원`;

  return (
    <MainLayout>
      <PaymentTestModeBanner />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {currency === "usd" ? "Back" : "뒤로가기"}
        </Button>
        <h1 className="text-2xl font-bold mb-2">{currency === "usd" ? "Checkout" : "결제하기"}</h1>
        <p className="text-muted-foreground mb-6">
          {serviceTitle} — {displayAmount}
        </p>
        <div className="border rounded-xl overflow-hidden">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </MainLayout>
  );
}
