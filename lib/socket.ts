// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  // O Front confia cegamente no que está no .env
  const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  if (!socket) {
    socket = io(URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }

  return socket;
}