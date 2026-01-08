import { create } from 'zustand';

export type Message = {
  id: string;
  content: string;
  sender: string;
  isRead: boolean;
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
  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages],
    })),
  markAsRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isRead: true } : m
      ),
    })),
  setMessages: (messages) => set({ messages }),
}));
