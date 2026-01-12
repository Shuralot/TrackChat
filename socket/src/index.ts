import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

/**
 * Servidor de Socket Independente
 * Responsável por distribuir mensagens em tempo real sem sobrecarregar a API principal.
 * Utiliza o conceito de 'Rooms' para segmentar o tráfego de dados.
 */

const app = express();
app.use(cors({ origin: "*" })); // Permite que o Front-end e o Webhook acessem o servidor
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

/**
 * GESTÃO DE CONEXÕES E SALAS (ROOMS)
 */
io.on("connection", (socket) => {
  console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

  /**
   * Sala de Conversa Específica:
   * Usada quando um atendente abre um chat individual.
   * Garante que mensagens de 'João' não apareçam na tela da 'Maria'.
   */
  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`[JOIN CONVERSATION] Socket ${socket.id} -> Room: ${conversationId}`);
  });

  /**
   * Sala de Canal (Inbox):
   * Usada pelo Dashboard principal para monitorar TUDO de um departamento.
   * Ex: Quem entrar na sala 'inbox_3' verá todas as mensagens do Operacional.
   */
  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    socket.join(`inbox_${inboxId}`);
    console.log(`[JOIN INBOX] Socket ${socket.id} -> Room: inbox_${inboxId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
  });
});

/**
 * ENDPOINT DE EMISSÃO (PONTE WEBHOOK -> CLIENTE)
 * O Webhook do Next.js faz um POST aqui para "avisar" que chegou algo novo.
 */
app.post("/emit-message", (req, res) => {
  const message = req.body;

  // Validação de Integridade: Impede que lixo seja enviado para os clientes
  if (!message?.id || !message?.content || !message?.conversationId) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  console.log(`[EMIT] Msg ${message.id} -> Conv: ${message.conversationId} | Inbox: ${message.inboxId}`);

  /**
   * DISPARO DUPLO (Double Emission):
   * 1. Enviamos para a sala da conversa (quem está lendo o chat agora).
   * 2. Enviamos para a sala do inbox (quem está olhando a lista de conversas no dashboard).
   */
  io.to(message.conversationId).emit("new_message", message);

  if (message.inboxId) {
    io.to(`inbox_${message.inboxId}`).emit("new_message", message);
  }

  return res.json({ ok: true });
});

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`--- ✅ SERVIDOR DE SOCKET ATIVO ---`);
  console.log(`[SERVER] Rodando na porta ${PORT}`);
});