import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const payload = await req.json();
  console.log(payload);

  if (payload.event !== "message_created") return NextResponse.json({ ok: true });

  // 1️⃣ Ajuste no Filtro: Agora aceitamos 3 (Operacional) e 4 (Comercial)
  const allowedInboxes = [3, 2];
  const currentInboxId = payload.inbox?.id;

  if (!allowedInboxes.includes(currentInboxId)) {
    console.log("Inbox ignorado:", currentInboxId);
    return NextResponse.json({ ok: true, status: "ignored_inbox" });
  }

  const msgPayload = payload;
  if (!msgPayload || !msgPayload.sender) return NextResponse.json({ ok: false });

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

  // 2️⃣ Upsert da conversa (SALVANDO O INBOX_ID)
  const conversation = await prisma.conversation.upsert({
    where: { chatwootConversationId: msgPayload.conversation.id.toString() },
    update: {
      unreadCount: msgPayload.conversation.unread_count,
      lastMessageAt: new Date(msgPayload.created_at),
      contactId: contact.id,
      status: msgPayload.conversation.status || "open",
      chatwootInboxId: currentInboxId.toString(),
    },
    create: {
      chatwootConversationId: msgPayload.conversation.id.toString(),
      unreadCount: msgPayload.conversation.unread_count,
      lastMessageAt: new Date(msgPayload.created_at),
      contactId: contact.id,
      status: msgPayload.conversation.status || "open",
      chatwootInboxId: currentInboxId.toString(),
    },
  });

  // 3️⃣ Upsert da mensagem
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
        senderName: currentSenderName,
        conversationId: conversation.id,
        inboxId: currentInboxId, // 👈 Importante para o Front saber de qual canal é
        contact: { id: contact.id, name: contact.name },
        createdAt: message.createdAt,
      }),
    });
  } catch (err) {
    console.error("Socket emit failed", err);
  }

  return NextResponse.json({ ok: true });
}