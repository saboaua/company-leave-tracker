import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;

  if (!message || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();

  // Basic command handling – expand for full request flow
  if (text.startsWith("/request")) {
    // Parse dates and type, create leave request, notify admins
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Request received. Please use the web app or complete the details.",
    });
  }

  if (text === "/balance") {
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: "Check your balance on the dashboard.",
    });
  }

  return NextResponse.json({ ok: true });
}
