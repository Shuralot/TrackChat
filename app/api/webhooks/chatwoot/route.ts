import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const payload = await req.json();

  if (payload.event !== 'message_created') {
    return NextResponse.json({ ok: true });
  }

  const message = payload.message;
  const conversationId = payload.conversation.id.toString();

  // Upsert da conversa
  const conversation = await prisma.conversation.upsert({
    where: { chatwootConversationId: conversationId },
    update: {
      unreadCount: { increment: 1 },
      lastMessageAt: new Date(),
    },
    create: {
      chatwootConversationId: conversationId,
      unreadCount: 1,
    },
  });

  // Salva a mensagem
  const savedMessage = await prisma.message.create({
    data: {
      chatwootMessageId: message.id.toString(),
      content: message.content,
      sender: message.sender.name,
      conversationId: conversation.id,
    },
  });

  // Emite para Socket Server externo
  try {
    await fetch(`${process.env.SOCKET_SERVER_URL}/emit-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savedMessage),
    });
  } catch (err) {
    console.error("Failed to emit message to socket server", err);
  }

  return NextResponse.json({ success: true });
}
