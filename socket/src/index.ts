import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// Pega o domínio da ENV para o CORS, se não existir usa o wildcard
const allowedOrigin = process.env.DOMAIN ? `http://${process.env.DOMAIN}:3000` : "*";

app.use(cors({ origin: "*" })); // Webhooks geralmente não precisam de restrição de CORS
app.use(express.json());

const httpServer = createServer(app);

// Configuração do Socket.io com suporte a Long Polling e WebSockets
const io = new Server(httpServer, {
  cors: {
    origin: [allowedOrigin, "http://localhost:3000"], // Permite o domínio real e local para testes
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"] // Garante compatibilidade
});

io.on("connection", (socket) => {
  console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId.toString());
    console.log(`[JOIN CONVERSATION] Socket ${socket.id} -> Room: ${conversationId}`);
  });

  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    socket.join(`inbox_${inboxId}`);
    console.log(`[JOIN INBOX] Socket ${socket.id} -> Room: inbox_${inboxId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
  });
});

app.get("/health", (_, res) => res.json({ ok: true, domain: process.env.DOMAIN }));

app.post("/emit-message", (req, res) => {
  const {
    id, content, sender, senderName, senderPhone,
    conversationId, inboxId, groupName, createdAt,
  } = req.body;

  if (!id || !content || !conversationId) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  const socketPayload = {
    id, content, sender, senderName, senderPhone,
    conversationId: conversationId.toString(),
    inboxId, groupName, createdAt,
  };

  console.log(`[EMIT] Msg ${id} | Room: ${conversationId} | From: ${senderName}`);

  // IMPORTANTE: Garantir que conversationId seja string para o io.to()
  io.to(conversationId.toString()).emit("new_message", socketPayload);

  if (inboxId) {
    io.to(`inbox_${inboxId}`).emit("new_message", socketPayload);
  }

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () =>
  console.log(`[SERVER] Socket server running on port ${PORT}`)
);