// ./socket/src/index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// 1. Configuração de Origens Dinâmicas
// Usamos fallbacks para garantir que funcione mesmo se a ENV falhar
const APP_URL = process.env.APP_URL || `http://localhost:3000`;

const allowedOrigins = [
  `${APP_URL}`,
  "http://localhost:3000",
  "http://localhost:1700",
  "179.73.180.164"
];

// Middleware de CORS para as rotas HTTP (como o /emit-message)
app.use(cors({ origin: "*" })); 
app.use(express.json());

const httpServer = createServer(app);

// 2. Configuração do Socket.io com CORS dinâmico
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Se não houver origin (ex: Postman ou chamadas server-side) ou se estiver na lista, permite
      if (!origin || allowedOrigins.includes(origin) || origin.includes(APP_URL)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Bloqueado para: ${origin}`);
        callback(null, true); // Em teste local/VPS, podemos permitir para evitar travas, ou mude para callback(new Error("CORS")) em prod estrita
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  console.log(`[SOCKET] Cliente Conectado: ${socket.id}`);

  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) return;
    const room = conversationId.toString();
    socket.join(room);
    console.log(`[ROOM] Socket ${socket.id} entrou na Conversa: ${room}`);
  });

  socket.on("join_inbox", (inboxId: string) => {
    if (!inboxId) return;
    const room = `inbox_${inboxId}`;
    socket.join(room);
    console.log(`[ROOM] Socket ${socket.id} entrou no Inbox: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Cliente Desconectado: ${socket.id}`);
  });
});

// 3. Healthcheck - Útil para o Docker verificar se o serviço está vivo
app.get("/health", (_, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    config: { host: APP_URL }
  });
});

// 4. Endpoint de Emissão (Chamado pelo seu backend Next.js)
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

  console.log(`[EMIT] Enviando para sala: ${conversationId}`);
  
  // Envia para a conversa específica
  io.to(conversationId.toString()).emit("new_message", socketPayload);

  // Envia para o inbox específico
  if (inboxId) {
    io.to(`inbox_${inboxId}`).emit("new_message", socketPayload);
  }

  return res.json({ sent: true });
});

// 5. Inicialização
const PORT = 4000; // Porta interna do container
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("-----------------------------------------");
  console.log(`[SERVER] Socket rodando em: http://0.0.0.0:${PORT}`);
  console.log(`[CORS] Aceitando: ${APP_URL}`);
  console.log("-----------------------------------------");
});