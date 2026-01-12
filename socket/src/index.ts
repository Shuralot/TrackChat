import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

  // 1. Join por Conversa (Já existia)
  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`[JOIN CONVERSATION] Socket ${socket.id} -> Room: ${conversationId}`);
  });

  // 2. NOVO: Join por Inbox (Para o Dashboard filtrar o canal todo)
  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    socket.join(`inbox_${inboxId}`);
    console.log(`[JOIN INBOX] Socket ${socket.id} -> Room: inbox_${inboxId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

// 3. Recebe mensagem do webhook e emite para as salas certas
app.post("/emit-message", (req, res) => {
  const message = req.body;

  if (!message?.id || !message?.content || !message?.conversationId) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  console.log(`[EMIT] Msg ${message.id} to Conv: ${message.conversationId} and Inbox: ${message.inboxId}`);

  // Emite para quem está ouvindo a conversa específica
  io.to(message.conversationId).emit("new_message", message);

  // Emite para quem está ouvindo o canal (Operacional ou Comercial)
  // Isso garante que se uma conversa nova surgir, o dashboard do canal certo a receba
  if (message.inboxId) {
    io.to(`inbox_${message.inboxId}`).emit("new_message", message);
  }

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`[SERVER] Socket server running on port ${PORT}`));