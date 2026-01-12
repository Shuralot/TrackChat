import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
  const payload = await req.json();
  console.log(payload)
  if (payload.event !== "message_created") return NextResponse.json({ ok: true });

  //Filtro de canais
  const allowedInboxIds = 3;
  if (payload.inbox && payload.inbox.id !== allowedInboxIds) {
    console.log("Inbox não permitido:", payload.inbox.id);
    return NextResponse.json({ ok: true, status:"ignored_inbox" });
  }


  // No payload que você recebeu, a mensagem é o payload inteiro
  const msgPayload = payload;

  if (!msgPayload || !msgPayload.sender) {
    console.error("Payload inválido:", payload);
    return NextResponse.json({ ok: false, error: "Mensagem sem sender" });
  }

  const sender = msgPayload.sender;

  // 1️⃣ Upsert do contato
  const contact = await prisma.contact.upsert({
    where: { chatwootContactId: sender.id.toString() },
    update: { name: sender.name, email: sender.email },
    create: {
      chatwootContactId: sender.id.toString(),
      name: sender.name,
      email: sender.email,
      avatar: sender.avatar || "",
    },
  });

  // 2️⃣ Upsert da conversa
  const conversation = await prisma.conversation.upsert({
    where: { chatwootConversationId: msgPayload.conversation.id.toString() },
    update: {
      unreadCount: msgPayload.conversation.unread_count,
      lastMessageAt: new Date(msgPayload.created_at),
      contactId: contact.id,
      status: msgPayload.conversation.status || "open",
    },
    create: {
      chatwootConversationId: msgPayload.conversation.id.toString(),
      unreadCount: msgPayload.conversation.unread_count,
      lastMessageAt: new Date(msgPayload.created_at),
      contactId: contact.id,
      status: msgPayload.conversation.status || "open",
    },
  });

  // 3️⃣ Upsert da mensagem
  const message = await prisma.message.upsert({
    where: { chatwootMessageId: msgPayload.id.toString() },
    update: {},
    create: {
      chatwootMessageId: msgPayload.id.toString(),
      content: msgPayload.content,
      sender:
        msgPayload.message_type === "incoming"
          ? "USER"
          : msgPayload.message_type === "outgoing"
          ? "AGENT"
          : "BOT",
      isRead: false,
      conversationId: conversation.id,
      createdAt: new Date(msgPayload.created_at),
    },
  });

  // 4️⃣ Emit via Socket
  try {
    await fetch(`${process.env.SOCKET_SERVER_URL}/emit-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: message.id,
        chatwootMessageId: message.chatwootMessageId,
        content: message.content,
        sender: message.sender,
        isRead: message.isRead,
        conversationId: conversation.id,
        contact: { id: contact.id, name: contact.name },
        createdAt: message.createdAt,
      }),
    });
  } catch (err) {
    console.error("Failed to emit message to socket server", err);
  }

  return NextResponse.json({ ok: true });
}
