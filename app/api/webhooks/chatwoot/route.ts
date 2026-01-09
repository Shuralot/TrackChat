import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();

  if (payload.event !== "message_created") return NextResponse.json({ ok: true });

  const msgPayload = payload.message;

  // Upsert do contato
  const contact = await prisma.contact.upsert({
    where: { chatwootContactId: payload.contact.id.toString() },
    update: { name: payload.contact.name, email: payload.contact.email, avatar: payload.contact.avatar },
    create: {
      chatwootContactId: payload.contact.id.toString(),
      name: payload.contact.name,
      email: payload.contact.email,
      avatar: payload.contact.avatar,
    },
  });

  // Upsert da conversa
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

  // Upsert da mensagem
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

  // Emite para Socket.IO
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
        conversationStatus: conversation.status,
        conversationUnreadCount: conversation.unreadCount,
        contact: { id: contact.id, name: contact.name, avatar: contact.avatar },
        createdAt: message.createdAt,
        additionalAttributes: msgPayload.conversation.additional_attributes || {},
      }),
    });
  } catch (err) {
    console.error("Failed to emit message to socket server", err);
  }

  return NextResponse.json({ ok: true });
}
