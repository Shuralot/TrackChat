// socket/src/index.ts
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

// Definição mínima de mensagem
interface Message {
  id: string;
  content: string;
  sender: string;
  conversationId: string;
  createdAt: string;
}

const app = express();
app.use(cors());
app.use(express.json()); // <- necessário para ler JSON

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Health check
app.get("/health", (_: Request, res: Response) => {
  res.json({ ok: true });
});

// Endpoint para receber mensagens da API Next.js e emitir via Socket.IO
app.post("/emit-message", (req: Request, res: Response) => {
  const message: Message = req.body;

  if (!message?.id || !message?.content) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  console.log("📨 Emitting new message:", message.id);
  io.emit("new_message", message);

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});
