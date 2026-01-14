// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  // O Front confia cegamente no que está no .env
  const URL = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (!URL) {
      console.error("❌ ERRO: NEXT_PUBLIC_SOCKET_URL não definida!");
      // Fallback de segurança para localhost:4000
      return io("http://localhost:4000", { autoConnect: false });
  }

  if (!socket) {
    socket = io(URL, {
      transports: ["websocket"],
      autoConnect: false,
    });
  }
  return socket;
}