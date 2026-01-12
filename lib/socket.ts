import { io, Socket } from "socket.io-client";

/**
 * Variável de controle interna (módulo).
 * Mantemos a instância do socket fora da função para que ela funcione como um "Singleton",
 * garantindo que toda a aplicação compartilhe a mesma conexão física.
 */
let socket: Socket | null = null;

/**
 * getSocket: Função para obter a conexão com o servidor de mensagens.
 * * Este padrão é chamado de 'Lazy Initialization' (Inicialização Preguiçosa):
 * A conexão só é aberta no exato momento em que o primeiro componente pedir por ela.
 */
export function getSocket() {
  if (!socket) {
    // Verificação de segurança: A URL do servidor de Socket DEVE estar no .env
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (!socketUrl) {
      console.error("[Socket] Erro: NEXT_PUBLIC_SOCKET_URL não definida!");
    }

    // Inicializamos a conexão
    socket = io(socketUrl!, {
      /**
       * 'transports: ["websocket"]': 
       * Forçamos o uso de WebSockets diretamente em vez de HTTP Polling.
       * Isso reduz a latência e melhora a performance em sistemas de chat.
       */
      transports: ["websocket"],
      // Tenta reconectar automaticamente caso o servidor caia
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // Logs de debug para facilitar a vida do desenvolvedor iniciante
    socket.on("connect", () => console.log(`[Socket] Conectado com ID: ${socket?.id}`));
    socket.on("connect_error", (err) => console.error("[Socket] Erro na conexão:", err.message));
  }

  return socket;
}