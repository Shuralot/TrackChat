// ./app/api/messages/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "asc" }, // do mais antigo para o mais recente
    include: {
      conversation: {
        include: {
          contact: true,
        },
      },
    },
  });

  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    chatwootMessageId: msg.chatwootMessageId,
    content: msg.content,
    sender: msg.sender,
    isRead: msg.isRead,
    conversationId: msg.conversationId,
    contact: msg.conversation?.contact
      ? { id: msg.conversation.contact.id, name: msg.conversation.contact.name }
      : { id: "unknown", name: "Sem Contato" },
    createdAt: msg.createdAt,
  }));

  return NextResponse.json(formattedMessages);
}
