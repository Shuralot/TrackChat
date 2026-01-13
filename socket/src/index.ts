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

  // Join por Conversa (grupo)
  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(
      `[JOIN CONVERSATION] Socket ${socket.id} -> Room: ${conversationId}`
    );
  });

  // Join por Inbox (canal)
  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    socket.join(`inbox_${inboxId}`);
    console.log(
      `[JOIN INBOX] Socket ${socket.id} -> Room: inbox_${inboxId}`
    );
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

// Recebe mensagem do webhook e emite para as salas certas
app.post("/emit-message", (req, res) => {
  const {
    id,
    content,
    sender,
    senderName,
    senderPhone,
    conversationId,
    inboxId,
    groupName,
    createdAt,
  } = req.body;

  // Validação mínima
  if (!id || !content || !conversationId) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  // Payload PADRÃO para o front
  const socketPayload = {
    id,
    content,
    sender,
    senderName,
    senderPhone,
    conversationId,
    inboxId,
    groupName,
    createdAt,
  };

  console.log(
    `[EMIT] Msg ${id} | Group: ${groupName} | From: ${senderName} (${senderPhone})`
  );

  // Emite para a conversa (grupo específico)
  io.to(conversationId).emit("new_message", socketPayload);

  // Emite para o inbox (canal inteiro)
  if (inboxId) {
    io.to(`inbox_${inboxId}`).emit("new_message", socketPayload);
  }

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () =>
  console.log(`[SERVER] Socket server running on port ${PORT}`)
);
