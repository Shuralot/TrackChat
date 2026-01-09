import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Rooms por conversationId
io.on("connection", (socket) => {
  console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

  socket.on("join_conversation", (conversationId: string) => {
    if (!conversationId) {
      console.warn(`[SOCKET WARNING] Socket ${socket.id} tentou entrar em room inválida`);
      return;
    }
    socket.join(conversationId);
    console.log(`[SOCKET JOIN] Socket ${socket.id} joined room "${conversationId}"`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Client ID: ${socket.id}`);
  });
});

// Health check
app.get("/health", (_, res) => {
  console.log("[HTTP] /health called");
  res.json({ ok: true });
});

// Recebe mensagem do webhook e emite para a room
app.post("/emit-message", (req, res) => {
  const message = req.body;

  console.log("[HTTP POST] /emit-message payload:", message);

  if (!message?.id || !message?.content || !message?.conversationId) {
    console.warn("[HTTP WARNING] Invalid message payload received");
    return res.status(400).json({ error: "Invalid message payload" });
  }

  console.log(`[EMIT MESSAGE] Emitting message ID: ${message.id} to room "${message.conversationId}"`);
  io.to(message.conversationId).emit("new_message", message);

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`[SERVER] Socket server running on port ${PORT}`));
