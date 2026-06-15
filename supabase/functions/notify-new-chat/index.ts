// Sends a Telegram notification to the admin when a new chat room is created.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE_URL = "https://linktofactory.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title, customerName, serviceTitle, roomId } = await req.json().catch(() => ({}));
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!botToken || !chatId) {
      return new Response(JSON.stringify({ error: "telegram secrets missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatUrl = roomId
      ? `${APP_BASE_URL}/admin/chat-popup?roomId=${encodeURIComponent(roomId)}`
      : `${APP_BASE_URL}/admin/chat`;

    const text =
      `🔔 <b>새 채팅 요청</b>\n` +
      `👤 고객: ${escape(customerName || "-")}\n` +
      `🛍️ 서비스: ${escape(serviceTitle || title || "-")}\n\n` +
      `💬 <a href="${chatUrl}">채팅창 바로가기</a>\n` +
      `<i>(관리자 로그인 후 답변 가능)</i>`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{ text: "💬 채팅 답변하기", url: chatUrl }]],
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "telegram failed", data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escape(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
