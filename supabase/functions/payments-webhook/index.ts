import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const projectId = session.metadata?.project_id;
  const userId = session.metadata?.user_id;

  if (!projectId) {
    console.error("No project_id in checkout metadata");
    return;
  }

  console.log("Payment completed for project:", projectId);

  // Record the payment
  await supabase.from("payments").insert({
    project_id: projectId,
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    amount: session.amount_total,
    currency: session.currency,
    status: "completed",
    environment: env,
  });

  // Update project payment_status to 입금완료
  await supabase
    .from("projects")
    .update({ payment_status: "입금완료" })
    .eq("id", projectId);

  // Find the chat room for this project and send a system message
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("project_id", projectId)
    .single();

  if (room) {
    await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: userId || "system",
      message: "✅ 카드결제가 완료되었습니다.",
      message_type: "system",
    });

    await supabase.from("chat_rooms").update({
      last_message: "✅ 카드결제가 완료되었습니다.",
      last_message_at: new Date().toISOString(),
    }).eq("id", room.id);
  }
}
