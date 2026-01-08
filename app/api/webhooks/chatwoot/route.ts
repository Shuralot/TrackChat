import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

declare global {
  var io: Server | undefined;
}

export async function POST(req: Request) {
  const payload = await req.json();

  if (payload.event !== 'message_created') {
    return NextResponse.json({ ok: true });
  }

  const message = payload.message;
  const conversationId = payload.conversation.id.toString();

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

  const savedMessage = await prisma.message.create({
    data: {
      chatwootMessageId: message.id.toString(),
      content: message.content,
      sender: message.sender.name,
      conversationId: conversation.id,
    },
  });

  // Emite para os monitores
  if (global.io) {
    global.io.emit('new-message', savedMessage);
  }

  return NextResponse.json({ success: true });
}
