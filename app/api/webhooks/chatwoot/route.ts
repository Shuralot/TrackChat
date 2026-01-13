import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json();

  if (payload.event !== "message_created") {
    return NextResponse.json({ ok: true });
  }

  const allowedInboxes = [3, 2];
  const currentInboxId = payload.inbox?.id;

  if (!allowedInboxes.includes(currentInboxId)) {
    return NextResponse.json({ ok: true });
  }

  // -----------------------------
  // 🧠 EXTRAÇÃO INTELIGENTE
  // -----------------------------

  let senderName = payload.sender.name; // fallback
  let senderPhone: string | null = null;
  let cleanContent = payload.content;

  // Detecta mensagem de grupo (incoming)
  if (payload.message_type === "incoming") {
    const match = payload.content.match(
      /^\*\*(.*?)\:\*\*\s*\n\n([\s\S]*)$/
    );

    if (match) {
      const header = match[1]; // +55 8186601822 - Júlio
      cleanContent = match[2]; // mensagem real

      if (header.includes(" - ")) {
        const [phone, name] = header.split(" - ");
        senderPhone = phone.trim();
        senderName = name.trim();
      }
    }
  }

  // -----------------------------
  // 👤 CONTACT (representa o grupo)
  // -----------------------------

  const contact = await prisma.contact.upsert({
    where: {
      chatwootContactId: payload.sender.id.toString(),
    },
    update: {
      name: payload.sender.name,
    },
    create: {
      chatwootContactId: payload.sender.id.toString(),
      name: payload.sender.name,
      avatar: payload.sender.avatar || "",
    },
  });

  // -----------------------------
  // 💬 CONVERSATION (grupo)
  // -----------------------------

  const conversation = await prisma.conversation.upsert({
    where: {
      chatwootConversationId: payload.conversation.id.toString(),
    },
    update: {
      unreadCount: payload.conversation.unread_count,
      lastMessageAt: new Date(payload.created_at),
      contactId: contact.id,
      status: payload.conversation.status,
      chatwootInboxId: currentInboxId.toString(),

      // 👇 GRUPO
      groupName: payload.sender.name,
      groupChatwootId: payload.sender.identifier,
    },
    create: {
      chatwootConversationId: payload.conversation.id.toString(),
      unreadCount: payload.conversation.unread_count,
      lastMessageAt: new Date(payload.created_at),
      contactId: contact.id,
      status: payload.conversation.status,
      chatwootInboxId: currentInboxId.toString(),

      groupName: payload.sender.name,
      groupChatwootId: payload.sender.identifier,
    },
  });

  // -----------------------------
  // 📨 MESSAGE (pessoa real)
  // -----------------------------

  const message = await prisma.message.upsert({
    where: {
      chatwootMessageId: payload.id.toString(),
    },
    update: {},
    create: {
      chatwootMessageId: payload.id.toString(),
      content: cleanContent,
      senderName,
      senderPhone,
      sender: payload.message_type === "incoming" ? "USER" : "AGENT",
      isRead: false,
      conversationId: conversation.id,
      createdAt: new Date(payload.created_at),
    },
  });

  // -----------------------------
  // 📡 SOCKET
  // -----------------------------

  await fetch(`${process.env.SOCKET_SERVER_URL}/emit-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: message.id,
      content: message.content,
      sender: message.sender,
      senderName: message.senderName,
      senderPhone: message.senderPhone,
      conversationId: conversation.id,
      inboxId: currentInboxId,
      groupName: conversation.groupName,
      createdAt: message.createdAt,
    }),
  });

  return NextResponse.json({ ok: true });
}
