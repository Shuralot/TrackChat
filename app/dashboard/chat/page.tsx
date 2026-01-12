"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import { Clock, MessageSquare, Lock, CircleUser, Pin } from "lucide-react";
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
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // 1. Persistência dos Pins no LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("pinned_conversations");
    if (saved) setPinnedIds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("pinned_conversations", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (conversationId: string) => {
    setPinnedIds(prev => 
      prev.includes(conversationId) 
        ? prev.filter(id => id !== conversationId) 
        : [...prev, conversationId]
    );
  };

  // 2. Ordenação: Primeiro PINADOS, depois por DATA RECENTE
  const sortedConversations = useMemo(() => {
    const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
      if (!acc[msg.conversationId]) acc[msg.conversationId] = [];
      acc[msg.conversationId].push(msg);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([idA, msgsA], [idB, msgsB]) => {
      const isPinnedA = pinnedIds.includes(idA);
      const isPinnedB = pinnedIds.includes(idB);

      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;

      const lastA = new Date(msgsA[msgsA.length - 1].createdAt).getTime();
      const lastB = new Date(msgsB[msgsB.length - 1].createdAt).getTime();
      return lastB - lastA;
    });
  }, [messages, pinnedIds]);

  const todayDate = new Date().toLocaleDateString("pt-BR");

  // 3. Socket e Handlers
  useEffect(() => {
    const socket = getSocket();
    
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    const joinConversation = (conversationId: string) => {
      if (!conversationId) return;
      socket.emit("join_conversation", conversationId);
    };

    fetch("/api/messages")
      .then(res => res.json())
      .then((msgs: Message[]) => {
        setMessages(msgs);
        const allConversationIds = Array.from(new Set(msgs.map(m => m.conversationId)));
        allConversationIds.forEach(joinConversation);
      });

    const handleNewMessage = (message: Message) => {
      joinConversation(message.conversationId);
      addMessage(message);
      if (document.visibilityState === "visible") {
        new Audio("/notification.mp3").play().catch(() => {});
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [addMessage, setMessages]);

  const getIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "AGENT": return <CircleUser size={14} className="text-purple-400" />;
      case "USER": return <MessageSquare size={14} className="text-green-400" />;
      default: return <Lock size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-4 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 shrink-0 h-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
            Ai Atende
          </span>
          <span className="text-lg font-semibold text-gray-300">| TrackChat</span>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            Data: <b className="text-white">{todayDate}</b>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            Total: <b className="text-white">{messages.length}</b>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "Conectado" : "Desconectado"}</span>
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
          {sortedConversations.map(([convoId, allMsgs]) => {
            const contactName = allMsgs[0]?.contact?.name || "Desconhecido";
            const recentMsgs = allMsgs.slice(-6);
            const isPinned = pinnedIds.includes(convoId);

            return (
              <div 
                key={convoId} 
                className={`bg-[#16181d] border rounded-lg flex flex-col h-[320px] shadow-sm transition-all duration-300 ${
                  isPinned ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {/* CARD HEADER COM PIN */}
                <div className={`p-3 border-b flex justify-between items-center rounded-t-lg ${isPinned ? "bg-[#1c222c]" : "bg-[#1e2128]"} border-gray-800`}>
                  <div className="flex items-center gap-2 truncate max-w-[80%]">
                    <button 
                      onClick={() => togglePin(convoId)}
                      className={`shrink-0 transition-colors ${isPinned ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}
                    >
                      <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
                    </button>
                    <h3 className="font-semibold text-sm truncate" title={contactName}>
                      {contactName}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded italic">
                    {allMsgs.length} msgs
                  </span>
                </div>

                {/* MENSAGENS */}
                <div className="flex-1 p-2 flex flex-col justify-end space-y-2 overflow-hidden bg-gradient-to-b from-transparent to-[#0f1115]/20">
                  {recentMsgs.map((msg) => (
                    <div key={msg.id} className="flex gap-2 items-start text-xs">
                      <div className="mt-0.5 opacity-70 shrink-0">{getIcon(msg.sender)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`line-clamp-2 ${msg.sender === 'AGENT' ? 'text-purple-300' : 'text-gray-300'}`}>
                          <span className="font-bold opacity-50">{msg.sender === 'AGENT' ? 'Team' : 'User'}:</span> {msg.content}
                        </p>
                        <span className="text-[10px] text-gray-600">
                          {formatDistanceToNow(new Date(msg.createdAt), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}