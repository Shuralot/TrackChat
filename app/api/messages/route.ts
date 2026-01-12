// ./app/api/messages/route.ts

// Importa a instância do Prisma Client para acessar o banco
import { prisma } from "@/lib/prisma";

// Utilitário do Next.js para retornar respostas HTTP
import { NextResponse } from "next/server";

// Handler do método GET da rota /api/messages
export async function GET(req: Request) {
  /**
   * 1. Extrai os parâmetros da URL
   * Exemplo de chamada:
   * /api/messages?inboxId=3
   */
  const { searchParams } = new URL(req.url);

  // Captura o inboxId (ID do canal / inbox do Chatwoot)
  // Vem sempre como string ou null
  const inboxId = searchParams.get("inboxId");

  /**
   * 2. Busca as mensagens no banco
   *
   * - Se inboxId existir:
   *   filtra mensagens cuja conversa esteja vinculada
   *   ao inbox (canal) informado
   *
   * - Se inboxId NÃO existir:
   *   retorna todas as mensagens
   */
  const messages = await prisma.message.findMany({
    where: inboxId
      ? {
          conversation: {
            // Filtra pelo ID do inbox/canal do Chatwoot (ex: 3 ou 4)
            chatwootInboxId: inboxId,
          },
        }
      : {},

    // Ordena as mensagens da mais antiga para a mais recente
    orderBy: { createdAt: "asc" },

    /**
     * Inclui dados relacionados:
     * - conversation: conversa da mensagem
     * - contact: contato associado à conversa
     */
    include: {
      conversation: {
        include: {
          contact: true,
        },
      },
    },
  });

  /**
   * 3. Formata o retorno
   *
   * Remove dados desnecessários do Prisma
   * e padroniza a estrutura enviada para o frontend
   */
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    chatwootMessageId: msg.chatwootMessageId,
    content: msg.content,
    sender: msg.sender,
    isRead: msg.isRead,
    senderName: msg.senderName,
    conversationId: msg.conversationId,

    /**
     * Se existir um contato associado à conversa,
     * retorna id e nome.
     * Caso contrário, retorna um fallback.
     */
    contact: msg.conversation?.contact
      ? {
          id: msg.conversation.contact.id,
          name: msg.conversation.contact.name,
        }
      : {
          id: "unknown",
          name: "Sem Contato",
        },

    // Data de criação da mensagem
    createdAt: msg.createdAt,
  }));

  /**
   * 4. Retorna a resposta em JSON
   * O NextResponse já seta os headers corretamente
   */
  return NextResponse.json(formattedMessages);
}
