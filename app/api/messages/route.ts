// ./app/api/messages/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inboxId = searchParams.get("inboxId");

  const messages = await prisma.message.findMany({
    where: inboxId
      ? {
          conversation: {
            chatwootInboxId: inboxId,
          },
        }
      : {},
    orderBy: { createdAt: "asc" },
    include: {
      conversation: true,
    },
  });

  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    chatwootMessageId: msg.chatwootMessageId,
    content: msg.content,

    // 🔥 QUEM MANDOU
    sender: msg.sender,
    senderName: msg.senderName,
    senderPhone: msg.senderPhone,

    // 🔥 GRUPO
    groupName: msg.conversation.groupName,
    conversationId: msg.conversationId,

    isRead: msg.isRead,
    createdAt: msg.createdAt,
  }));

  return NextResponse.json(formattedMessages);
}
