// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  // O Front confia cegamente no que está no .env
  const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  // Logs para debugar onde o cliente está tentando conectar
  try {
    console.info("[getSocket] NEXT_PUBLIC_SOCKET_URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
    console.info("[getSocket] Using socket URL:", URL);
  } catch (e) {
    // ignore if console is unavailable
  }

  if (!socket) {
    console.info("[getSocket] Creating socket to", URL);
    socket = io(URL, {
      // Allow polling fallback so proxies that block websocket upgrades still connect
      transports: ["websocket", "polling"],
      // Increase timeout to give reverse-proxies a bit more time
      timeout: 20000,
      // Use secure when URL is https (useful for wss behind TLS-terminating proxy)
      secure: URL.startsWith("https"),
      autoConnect: true,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.info("[getSocket] connected, id=", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[getSocket] connect_error:", err);
    });
  } else {
    console.info("[getSocket] returning existing socket, id=", socket.id);
  }

  return socket;
}