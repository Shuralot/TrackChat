"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import { 
  AlertTriangle, Clock, Zap, Users, MessageSquare, 
  Search, Bell, Headphones, Lock 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contact { id: string; name: string; }
interface Message {
  id: string;
  chatwootMessageId: string;
  content: string;
  sender: "USER" | "AGENT" | "BOT";
  isRead: boolean;
  conversationId: string;
  contact: Contact;
  createdAt: string;
}

export default function QueueDashboard() {
  const { messages, setMessages, addMessage } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Agrupa mensagens por conversa
  const conversationsGrouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    if (!acc[msg.conversationId]) acc[msg.conversationId] = [];
    acc[msg.conversationId].push(msg);
    return acc;
  }, {});

  const unansweredCount = messages.filter(m => !m.isRead).length;

  useEffect(() => {
    const socket = getSocket();

    // Função para entrar em uma conversa
    const joinConversation = (conversationId: string) => {
      if (!conversationId) return;
      socket.emit("join_conversation", conversationId);
    };

    // Buscar mensagens iniciais
    fetch("/api/messages")
      .then(res => res.json())
      .then((msgs: Message[]) => {
        setMessages(msgs);
        // Entrar em todas as salas já existentes
        const allConversationIds = Array.from(new Set(msgs.map(m => m.conversationId)));
        allConversationIds.forEach(joinConversation);
      });

    // Receber mensagens novas
    const handleNewMessage = (message: Message) => {
      // Entrar na sala se ainda não estiver
      joinConversation(message.conversationId);

      // Adicionar a mensagem
      addMessage(message);

      // Tocar áudio se o usuário estiver ativo na página
      if (document.visibilityState === "visible") {
        new Audio("/notification.mp3").play().catch(() => {
          console.warn("Não foi possível tocar o áudio de notificação");
        });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [addMessage, setMessages]);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "AGENT": return <Headphones size={18} />;
      case "USER": return <MessageSquare size={18} />;
      default: return <Lock size={18} />;
    }
  };

  const getStatusColor = (isRead: boolean) =>
    isRead ? "bg-blue-500 text-blue-500" : "bg-red-500 text-red-500";

  return (
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-6 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Ai Atende</span>
          <h1 className="text-xl font-semibold text-gray-200">Track Chat</h1>
        </div>  
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#d32f2f] rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Aguardando Resposta:</p>
            <h2 className="text-4xl font-bold">{unansweredCount}</h2>
          </div>
          <AlertTriangle className="w-8 h-8 opacity-50" />
        </div>
        <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 mb-1">Total de Mensagens:</p>
            <h2 className="text-3xl font-mono font-bold">{messages.length}</h2>
          </div>
          <Clock className="w-6 h-6 text-gray-500" />
        </div>
        <div className="bg-[#10b981] rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Status do Sistema:</p>
            <h2 className="text-3xl font-mono font-bold">Online</h2>
          </div>
          <Zap className="w-6 h-6 text-yellow-300 fill-current" />
        </div>
        <div className="bg-[#0f4c75] rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Operadores:</p>
            <h2 className="text-3xl font-bold">Ativo</h2>
          </div>
          <Users className="w-8 h-8 opacity-60" />
        </div>
      </div>

      {/* QUEUE LIST */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {Object.entries(conversationsGrouped).map(([convoId, msgs]) => {
          const contactName = msgs[0]?.contact?.name || "Sem Contato";
          const unreadCount = msgs.filter(m => !m.isRead).length;

          return (
            <div key={convoId} className="border border-gray-800 rounded-lg p-4 bg-[#1e2128]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{contactName}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/50">
                    {unreadCount} Não Lida
                  </span>
                )}
              </div>
              {msgs.map(msg => (
                <div key={msg.id} className="flex items-center gap-3 mb-2 p-2 rounded hover:bg-[#252830] transition-colors border-l-4 border-transparent relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(msg.isRead).split(' ')[0]}`}></div>
                  <div className={`p-2 rounded-full bg-opacity-10 ${getStatusColor(msg.isRead)}`}>
                    {getIcon(msg.sender)}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 text-xs">ID: {msg.chatwootMessageId?.slice(0,8)}</span>
                      <span className="text-gray-600">|</span>
                      <span className={`text-sm font-bold ${!msg.isRead ? 'text-orange-400' : 'text-gray-300'}`}>
                        HÁ: {formatDistanceToNow(new Date(msg.createdAt), { locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-gray-400 italic">{msg.sender}: "{msg.content}"</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
