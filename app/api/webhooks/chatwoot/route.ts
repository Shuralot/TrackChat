// ./app/api/webhooks/chatwoot/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Este Webhook recebe notificações do Chatwoot sobre novas mensagens.
 * Ele sincroniza os dados do Chatwoot com nosso banco local (Prisma)
 * e notifica o front-end via Socket em tempo real.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Filtro de Segurança: Só processamos eventos de criação de mensagem.
    // Outros eventos (como 'contato atualizado') são ignorados para economizar processamento.
    if (payload.event !== "message_created") {
      return NextResponse.json({ ok: true });
    }

    // Regra de Negócio: Filtramos quais canais (Inboxes) nossa aplicação aceita.
    // Exemplo: 3 (Operacional), 2 (Comercial).
    const allowedInboxes = [3, 2];
    const currentInboxId = payload.inbox?.id;

    if (!allowedInboxes.includes(currentInboxId)) {
      console.log(`[Webhook] Inbox ${currentInboxId} ignorado (não autorizado).`);
      return NextResponse.json({ ok: true, status: "ignored_inbox" });
    }

    const msgPayload = payload;
    if (!msgPayload || !msgPayload.sender) {
      return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
    }

    const currentSenderName = msgPayload.sender.name;

    /**
     * PASSO 1: Sincronizar Contato
     * O 'upsert' tenta encontrar o contato. Se existir, atualiza (update).
     * Se não existir, cria (create). Isso evita erros de duplicidade.
     */
    const contact = await prisma.contact.upsert({
      where: { chatwootContactId: msgPayload.sender.id.toString() },
      update: { 
        name: currentSenderName, 
        email: msgPayload.sender.email 
      },
      create: {
        chatwootContactId: msgPayload.sender.id.toString(),
        name: currentSenderName,
        email: msgPayload.sender.email,
        avatar: msgPayload.sender.avatar || "",
      },
    });

    /**
     * PASSO 2: Sincronizar Conversa
     * Atualizamos o status da conversa e o contador de mensagens não lidas.
     * Vinculamos a conversa ao contato criado/atualizado acima.
     */
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

    /**
     * PASSO 3: Registrar Mensagem
     * Mapeamos o 'message_type' do Chatwoot para o nosso ENUM (USER, AGENT, BOT).
     */
    const message = await prisma.message.upsert({
      where: { chatwootMessageId: msgPayload.id.toString() },
      update: {}, // Se a mensagem já existe, não alteramos nada (integridade de log).
      create: {
        chatwootMessageId: msgPayload.id.toString(),
        content: msgPayload.content,
        senderName: currentSenderName,
        sender:
          msgPayload.message_type === "incoming" ? "USER" : 
          msgPayload.message_type === "outgoing" ? "AGENT" : "BOT",
        isRead: false,
        conversationId: conversation.id,
        createdAt: new Date(msgPayload.created_at),
      },
    });

    /**
     * PASSO 4: Notificação em Tempo Real
     * Enviamos os dados para o servidor de Socket. 
     * Isso faz com que a mensagem apareça na tela do usuário sem ele precisar dar F5.
     */
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
          inboxId: currentInboxId, 
          contact: { id: contact.id, name: contact.name },
          createdAt: message.createdAt,
        }),
      });
    } catch (err) {
      // Erro no socket não deve travar o webhook, apenas logamos.
      console.error("[Socket] Falha ao emitir mensagem em tempo real:", err);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}