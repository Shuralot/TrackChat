import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// 1. Configuração de Origens (Versatilidade Local vs VPS)
const allowedOrigins = [
  // O que vem do seu .env (ex: http://localhost:1700 ou http://seu-ip:1700)
  `http://${process.env.EXTERNAL_HOST}:${process.env.PORT_APP}`,
  "http://localhost:3000",
  "http://localhost:1700"
];

app.use(cors({ origin: "*" })); 
app.use(express.json());

const httpServer = createServer(app);

// 2. Configuração do Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Permite requests sem origin (como mobile ou Postman) ou se estiver na lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  console.log(`[SOCKET] Conectado: ${socket.id}`);

  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.join(conversationId.toString());
    console.log(`[ROOM] Socket ${socket.id} entrou na Conversa: ${conversationId}`);
  });

  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    socket.join(`inbox_${inboxId}`);
    console.log(`[ROOM] Socket ${socket.id} entrou no Inbox: ${inboxId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Desconectado: ${socket.id}`);
  });
});

// 3. Healthcheck para o Docker Compose
app.get("/health", (_, res) => {
  res.json({ 
    status: "ok", 
    host: process.env.EXTERNAL_HOST,
    port_app: process.env.PORT_APP 
  });
});

app.post("/emit-message", (req, res) => {
  const {
    id, content, sender, senderName, senderPhone,
    conversationId, inboxId, groupName, createdAt,
  } = req.body;

  if (!id || !content || !conversationId) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const socketPayload = {
    id, content, sender, senderName, senderPhone,
    conversationId: conversationId.toString(),
    inboxId, groupName, createdAt,
  };

  // Envia para a sala da conversa
  io.to(conversationId.toString()).emit("new_message", socketPayload);

  // Envia para a sala do inbox (para atualizar a lista lateral)
  if (inboxId) {
    io.to(`inbox_${inboxId}`).emit("new_message", socketPayload);
  }

  return res.json({ sent: true });
});

// 4. Porta Interna (Sempre a mesma no Docker)
const PORT = 4000; 
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`[SERVER] Socket rodando internamente na porta ${PORT}`)
);