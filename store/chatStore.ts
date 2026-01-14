// ./store/chatStore.ts
import { create } from "zustand";

export type Message = {
  id: string;
  chatwootMessageId?: string;

  // Conteúdo
  content: string;

  // Quem mandou
  sender: "USER" | "AGENT" | "BOT";
  senderName?: string;
  senderPhone?: string;

  // Grupo / conversa
  conversationId: string;
  groupName?: string;

  isRead: boolean;
  createdAt: string;
  inboxId?: number;
};

type ChatState = {
  messages: Message[];
  addMessage: (message: Message) => void;
  markAsRead: (id: string) => void;
  setMessages: (messages: Message[]) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],

  // Adiciona mensagem no final (ordem correta)
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some(
        (m) =>
          m.id === message.id ||
          (m.chatwootMessageId &&
            m.chatwootMessageId === message.chatwootMessageId)
      );

      if (exists) return state;

      return {
        messages: [...state.messages, message],
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
