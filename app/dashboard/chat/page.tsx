"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import { Clock, MessageSquare, Lock, CircleUser, Pin, Settings2 } from "lucide-react";
import { formatDistanceToNow, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contact { id: string; name: string; }

interface Message {
  id: string;
  chatwootMessageId?: string;
  content: string;
  sender: "USER" | "AGENT" | "BOT";
  senderName?: string;
  isRead: boolean;
  conversationId: string;
  contact: Contact;
  createdAt: string;
  inboxId?: number; 
}

export default function QueueDashboard() {
  const { messages, setMessages, addMessage } = useChatStore();
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null);

  // 1. Persistência e Seleção de Inbox
  useEffect(() => {
    const savedPin = localStorage.getItem("pinned_conversations");
    if (savedPin) setPinnedIds(JSON.parse(savedPin));

    const savedInbox = localStorage.getItem("selected_inbox_id");
    if (savedInbox) {
      setSelectedInbox(Number(savedInbox));
    } else {
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pinned_conversations", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // CALCULO DO TOTAL DIÁRIO
  const dailyTotal = useMemo(() => {
    return messages.filter(msg => isToday(new Date(msg.createdAt))).length;
  }, [messages]);

  const handleSelectInbox = (id: number) => {
    localStorage.setItem("selected_inbox_id", id.toString());
    setSelectedInbox(id);
    setIsModalOpen(false);
    window.location.reload(); 
  };

  const togglePin = (conversationId: string) => {
    setPinnedIds(prev => 
      prev.includes(conversationId) ? prev.filter(id => id !== conversationId) : [...prev, conversationId]
    );
  };

  // 2. Ordenação
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

  // 3. Socket e Fetch dinâmico
  useEffect(() => {
    if (!selectedInbox) return;

    const socket = getSocket();
    
    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_inbox", selectedInbox.toString());
    });

    socket.on("disconnect", () => setIsConnected(false));

    const joinConversation = (conversationId: string) => {
      if (!conversationId) return;
      socket.emit("join_conversation", conversationId);
    };

    fetch(`/api/messages?inboxId=${selectedInbox}`)
      .then(res => res.json())
      .then((msgs: Message[]) => {
        setMessages(msgs);
        const allConversationIds = Array.from(new Set(msgs.map(m => m.conversationId)));
        allConversationIds.forEach(joinConversation);
      });

    const handleNewMessage = (message: Message) => {
      if (message.inboxId && Number(message.inboxId) !== selectedInbox) return;

      joinConversation(message.conversationId);
      addMessage(message);
      
      // AJUSTE NO SOM
      if (document.visibilityState === "visible") {
        // Caminho correto: Remove o "./public" e inicia com "/"
        const audio = new Audio("/sounds/notification.mp3");
        audio.currentTime = 0; // Reseta o áudio se ele já estiver tocando
        audio.play().catch(err => console.warn("Navegador bloqueou autoplay do som."));
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedInbox, addMessage, setMessages]);

  const getIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "AGENT": return <CircleUser size={14} className="text-purple-400" />;
      case "USER": return <MessageSquare size={14} className="text-green-400" />;
      default: return <Lock size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-4 font-sans overflow-hidden">
      
      <header className="flex justify-between items-center mb-4 shrink-0 h-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
            Ai Atende
          </span>
          <span className="text-xl font-extrabold text-white">
          | TrackChat
          </span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="ml-4 flex items-center gap-2 bg-[#1e2128] hover:bg-[#2a2e37] px-3 py-1 rounded border border-gray-700 transition-colors"
          >
            <Settings2 size={16} className="text-blue-400" />
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              {selectedInbox === 3 ? "Operacional" : selectedInbox === 2 ? "Comercial" : "Selecionar Filtro"}
            </span>
          </button>
        </div>

        <div className="flex gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            Data: <b className="text-white">{todayDate}</b>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            Hoje: <b className="text-white">{dailyTotal}</b>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "ON" : "OFF"}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
          {sortedConversations.map(([convoId, allMsgs]) => {
            const contactName = allMsgs[0]?.contact?.name || "Desconhecido";
            const recentMsgs = allMsgs.slice(-6);
            const isPinned = pinnedIds.includes(convoId);

            return (
              <div key={convoId} className={`bg-[#16181d] border rounded-lg flex flex-col h-[320px] transition-all duration-300 ${isPinned ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-gray-800"}`}>
                <div className={`p-3 border-b flex justify-between items-center rounded-t-lg ${isPinned ? "bg-[#1c222c]" : "bg-[#1e2128]"} border-gray-800`}>
                  <div className="flex items-center gap-2 truncate max-w-[80%]">
                    <button onClick={() => togglePin(convoId)} className={`shrink-0 ${isPinned ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}>
                      <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
                    </button>
                    <h3 className="font-semibold text-sm truncate" title={contactName}>{contactName}</h3>
                  </div>
                </div>

                <div className="flex-1 p-2 flex flex-col justify-end space-y-2 overflow-hidden bg-gradient-to-b from-transparent to-[#0f1115]/20">
                  {recentMsgs.map((msg) => (
                    <div key={msg.id} className="flex gap-2 items-start text-xs">
                      <div className="mt-0.5 opacity-70 shrink-0">{getIcon(msg.sender)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`line-clamp-2 ${msg.sender === 'AGENT' ? 'text-purple-300' : 'text-gray-300'}`}>
                          <span className="font-bold opacity-60">
                            {msg.sender === 'AGENT' ? (msg.senderName || 'Team') : 'User'}:
                          </span>{" "}
                          <span className="text-gray-400 font-light">{msg.content}</span>
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

      {/* MODAL DE SELEÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#16181d] border border-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-blue-500/10 p-3 rounded-full mb-4">
                <Settings2 className="text-blue-500" size={32} />
              </div>
              <h2 className="text-xl font-bold">Selecione o Fluxo</h2>
              <p className="text-gray-400 text-sm">Qual departamento você deseja monitorar?</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSelectInbox(3)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${selectedInbox === 3 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700 bg-[#1e2128]'}`}
              >
                <div>
                  <div className="font-bold text-white uppercase text-[10px] tracking-widest opacity-50">Canal 03</div>
                  <div className="text-lg font-black text-blue-400 uppercase">Operacional</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectInbox(2)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${selectedInbox === 2 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700 bg-[#1e2128]'}`}
              >
                <div>
                  <div className="font-bold text-white uppercase text-[10px] tracking-widest opacity-50">Canal 02</div>
                  <div className="text-lg font-black text-purple-400 uppercase">Comercial</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}