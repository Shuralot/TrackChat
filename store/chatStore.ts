import { create } from 'zustand';

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

type ChatState = {
  messages: Message[];
  addMessage: (message: Message) => void;
  markAsRead: (id: string) => void;
  setMessages: (messages: Message[]) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  
  // Ajustado para adicionar ao FINAL do array
  addMessage: (message) =>
    set((state) => {
      // Evita mensagens duplicadas (comum em conexões socket)
      const exists = state.messages.some(m => m.id === message.id || (m.chatwootMessageId === message.chatwootMessageId && m.chatwootMessageId !== undefined));
      if (exists) return state;

      return {
        messages: [...state.messages, message], // 👈 Agora adiciona no fim
      };
    }),

  markAsRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isRead: true } : m
      ),
    })),

  setMessages: (messages) => set({ messages }),
}));