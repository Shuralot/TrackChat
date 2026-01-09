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
  console.log("Client connected:", socket.id);

  socket.on("join_conversation", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

// Recebe mensagem do webhook e emite para a room
app.post("/emit-message", (req, res) => {
  const message = req.body;

  if (!message?.id || !message?.content) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  console.log("Emitting message to room:", message.conversationId);
  io.to(message.conversationId).emit("new_message", message);

  return res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
