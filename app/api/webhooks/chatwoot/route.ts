import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json();

  if (payload.event !== "message_created") return NextResponse.json({ ok: true });

  const allowedInboxIds = 3;
  if (payload.inbox && payload.inbox.id !== allowedInboxIds) {
    return NextResponse.json({ ok: true, status: "ignored_inbox" });
  }

  const msgPayload = payload;
  if (!msgPayload || !msgPayload.sender) return NextResponse.json({ ok: false });

  // Nome do Agente ou Usuário vindo do Chatwoot
  const currentSenderName = msgPayload.sender.name;

  // 1️⃣ Upsert do contato
  const contact = await prisma.contact.upsert({
    where: { chatwootContactId: msgPayload.sender.id.toString() },
    update: { name: currentSenderName, email: msgPayload.sender.email },
    create: {
      chatwootContactId: msgPayload.sender.id.toString(),
      name: currentSenderName,
      email: msgPayload.sender.email,
      avatar: msgPayload.sender.avatar || "",
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

  // 3️⃣ Upsert da mensagem (AGORA COM SENDERNAME)
  const message = await prisma.message.upsert({
    where: { chatwootMessageId: msgPayload.id.toString() },
    update: {},
    create: {
      chatwootMessageId: msgPayload.id.toString(),
      content: msgPayload.content,
      senderName: currentSenderName,
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
        content: message.content,
        sender: message.sender,
        senderName: currentSenderName, // Envia Paulo César para o Front
        conversationId: conversation.id,
        contact: { id: contact.id, name: contact.name },
        createdAt: message.createdAt,
      }),
    });
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return NextResponse.json({ ok: true });
}