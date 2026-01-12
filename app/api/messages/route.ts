// ./app/api/messages/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // 1. Captura o inboxId da URL (ex: /api/messages?inboxId=3)
  const { searchParams } = new URL(req.url);
  const inboxId = searchParams.get("inboxId");

  const messages = await prisma.message.findMany({
    // 2. Filtra as mensagens pelo inboxId da conversa vinculada
    where: inboxId ? {
      conversation: {
        chatwootInboxId: inboxId // Filtra pelo ID do canal (3 ou 4)
      }
    } : {}, 
    orderBy: { createdAt: "asc" },
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
    senderName: msg.senderName,
    conversationId: msg.conversationId,
    contact: msg.conversation?.contact
      ? { id: msg.conversation.contact.id, name: msg.conversation.contact.name }
      : { id: "unknown", name: "Sem Contato" },
    createdAt: msg.createdAt,
  }));

  return NextResponse.json(formattedMessages);
}