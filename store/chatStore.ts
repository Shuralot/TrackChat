import { create } from 'zustand';

/**
 * Definição do Tipo da Mensagem:
 * Este contrato deve ser seguido rigorosamente tanto pela API quanto pelo Socket
 * para garantir que a interface não quebre.
 */
export type Message = {
  id: string;
  chatwootMessageId?: string;
  content: string;
  sender: "USER" | "AGENT" | "BOT";
  senderName?: string; 
  isRead: boolean;
  conversationId: string; 
  contact: {
    id: string;
    name: string;
  };
  createdAt: string;
};

/**
 * Definição da Store:
 * O ChatState define quais dados temos (messages) e quais ações podemos fazer.
 */
type ChatState = {
  messages: Message[];
  addMessage: (message: Message) => void;
  markAsRead: (id: string) => void;
  setMessages: (messages: Message[]) => void;
};

/**
 * useChatStore: O "Cérebro" do Front-end.
 * Responsável por manter as mensagens sincronizadas entre o Dashboard e o ChatContainer.
 */
export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  
  /**
   * Adiciona uma nova mensagem ao estado.
   * * Importante: Inclui uma trava de segurança contra duplicidade.
   */
  addMessage: (message) =>
    set((state) => {
      // REGRA DE OURO: Em conexões estáveis de Socket, a mesma mensagem pode chegar
      // mais de uma vez (reconexões). Aqui verificamos se o ID já existe no estado.
      const exists = state.messages.some(m => 
        m.id === message.id || 
        (m.chatwootMessageId === message.chatwootMessageId && m.chatwootMessageId !== undefined)
      );

      if (exists) return state;

      // Mantemos a imutabilidade criando um novo array com a mensagem ao final.
      return {
        messages: [...state.messages, message],
      };
    }),

  /**
   * Localiza uma mensagem pelo ID e a marca como lida.
   * Útil para atualizar o UI imediatamente antes mesmo do banco responder.
   */
  markAsRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isRead: true } : m
      ),
    })),

  /**
   * Define todas as mensagens (usado no carregamento inicial da API).
   */
  setMessages: (messages) => set({ messages }),
}));