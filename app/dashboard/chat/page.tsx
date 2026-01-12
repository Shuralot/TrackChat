"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import {
  Clock,
  MessageSquare,
  Lock,
  CircleUser,
  Pin,
  Settings2,
} from "lucide-react";
import { formatDistanceToNow, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

<<<<<<< HEAD
// --------------------
// Tipagens
// --------------------
interface Contact {
  id: string;
  name: string;
}
=======
interface Contact { id: string; name: string; }
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)

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

<<<<<<< HEAD
type NotificationSound = "notification" | "augencio";

export default function QueueDashboard() {
  // --------------------
  // Zustand (estado global)
  // --------------------
  const { messages, setMessages, addMessage } = useChatStore();

  // --------------------
  // Estados locais
  // --------------------
=======
export default function QueueDashboard() {
  const { messages, setMessages, addMessage } = useChatStore();
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null);

<<<<<<< HEAD
  // 🔊 Som de notificação
  const [notificationSound, setNotificationSound] =
    useState<NotificationSound>("notification");

  // --------------------
  // Inicialização (localStorage)
  // --------------------
=======
  // 1. Persistência e Seleção de Inbox
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  useEffect(() => {
    const savedPin = localStorage.getItem("pinned_conversations");
    if (savedPin) setPinnedIds(JSON.parse(savedPin));

    const savedInbox = localStorage.getItem("selected_inbox_id");
    if (savedInbox) {
      setSelectedInbox(Number(savedInbox));
    } else {
      setIsModalOpen(true);
    }

    const savedSound = localStorage.getItem(
      "notification_sound"
    ) as NotificationSound;
    if (savedSound) setNotificationSound(savedSound);
  }, []);

<<<<<<< HEAD
  // Persistência
=======
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  useEffect(() => {
    localStorage.setItem(
      "pinned_conversations",
      JSON.stringify(pinnedIds)
    );
  }, [pinnedIds]);

<<<<<<< HEAD
  useEffect(() => {
    localStorage.setItem("notification_sound", notificationSound);
  }, [notificationSound]);

  // --------------------
  // Métricas
  // --------------------
=======
  // CALCULO DO TOTAL DIÁRIO
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  const dailyTotal = useMemo(() => {
    return messages.filter((msg) =>
      isToday(new Date(msg.createdAt))
    ).length;
  }, [messages]);

<<<<<<< HEAD
  // --------------------
  // Agrupamento + ordenação
  // --------------------
  const sortedConversations = useMemo(() => {
    const grouped = messages.reduce<Record<string, Message[]>>(
      (acc, msg) => {
        if (!acc[msg.conversationId]) acc[msg.conversationId] = [];
        acc[msg.conversationId].push(msg);
        return acc;
      },
      {}
    );

    return Object.entries(grouped).sort(
      ([idA, msgsA], [idB, msgsB]) => {
        const isPinnedA = pinnedIds.includes(idA);
        const isPinnedB = pinnedIds.includes(idB);

        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;

        const lastA = new Date(
          msgsA[msgsA.length - 1].createdAt
        ).getTime();
        const lastB = new Date(
          msgsB[msgsB.length - 1].createdAt
        ).getTime();

        return lastB - lastA;
      }
    );
  }, [messages, pinnedIds]);

  // --------------------
  // Socket.IO
  // --------------------
=======
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
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  useEffect(() => {
    if (!selectedInbox) return;

    const socket = getSocket();
<<<<<<< HEAD

=======
    
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_inbox", selectedInbox.toString());
    });

    socket.on("disconnect", () => setIsConnected(false));

    const joinConversation = (conversationId: string) => {
      socket.emit("join_conversation", conversationId);
    };

    fetch(`/api/messages?inboxId=${selectedInbox}`)
      .then((res) => res.json())
      .then((msgs: Message[]) => {
        setMessages(msgs);
<<<<<<< HEAD
        const ids = Array.from(
          new Set(msgs.map((m) => m.conversationId))
        );
        ids.forEach(joinConversation);
      });

    const handleNewMessage = (message: Message) => {
      if (
        message.inboxId &&
        Number(message.inboxId) !== selectedInbox
      )
        return;

      joinConversation(message.conversationId);
      addMessage(message);

      if (document.visibilityState === "visible") {
        const audio = new Audio(
          `/sounds/${notificationSound}.mp3`
        );
        audio.currentTime = 0;
        audio.play().catch(() => {});
=======
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
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
      }
    };

    socket.on("new_message", handleNewMessage);
<<<<<<< HEAD

=======
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedInbox, notificationSound, addMessage, setMessages]);

<<<<<<< HEAD
  // --------------------
  // Handlers
  // --------------------
  const handleSelectInbox = (id: number) => {
    localStorage.setItem("selected_inbox_id", id.toString());
    setSelectedInbox(id);
    setIsModalOpen(false);
    window.location.reload();
  };

  const togglePin = (conversationId: string) => {
    setPinnedIds((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

=======
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
  const getIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "AGENT":
        return <CircleUser size={14} className="text-purple-400" />;
      case "USER":
        return (
          <MessageSquare size={14} className="text-green-400" />
        );
      default:
        return <Lock size={14} className="text-gray-500" />;
    }
  };

  // --------------------
  // Render
  // --------------------
  return (
<<<<<<< HEAD
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-4 overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 h-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold">
            Ai Atende | TrackChat
=======
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-4 font-sans overflow-hidden">
      
      <header className="flex justify-between items-center mb-4 shrink-0 h-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-300">
            Ai Atende
          </span>
          <span className="text-xl font-extrabold text-white">
          | TrackChat
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
          </span>

          {/* 🔊 Seletor de som */}
          <div className="flex items-center gap-1 bg-[#1e2128] p-1 rounded border border-gray-700">
            <button
              onClick={() => setNotificationSound("notification")}
              className={`text-xs px-2 py-1 rounded ${
                notificationSound === "notification"
                  ? "bg-blue-600"
                  : "text-gray-400"
              }`}
            >
              🔔 Padrão
            </button>
            <button
              onClick={() => setNotificationSound("augencio")}
              className={`text-xs px-2 py-1 rounded ${
                notificationSound === "augencio"
                  ? "bg-purple-600"
                  : "text-gray-400"
              }`}
            >
              🎧 Augêncio
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-700"
          >
            <Settings2 size={16} />
            {selectedInbox === 3
              ? "Operacional"
              : selectedInbox === 2
              ? "Comercial"
              : "Selecionar"}
          </button>
        </div>

        <div className="flex gap-4">
<<<<<<< HEAD
          <div className="bg-[#1e2128] px-3 py-1 rounded">
            Hoje: <b>{dailyTotal}</b>
=======
          <div className="hidden sm:flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            Data: <b className="text-white">{todayDate}</b>
          </div>
          <div className="flex items-center gap-2 bg-[#1e2128] px-3 py-1 rounded border border-gray-800 text-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            Hoje: <b className="text-white">{dailyTotal}</b>
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
          </div>
          <div className="bg-[#1e2128] px-3 py-1 rounded">
            {isConnected ? "🟢 ON" : "🔴 OFF"}
          </div>
        </div>
      </header>

<<<<<<< HEAD
      {/* GRID */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedConversations.map(([id, msgs]) => {
            const recent = msgs.slice(-6);
            const isPinned = pinnedIds.includes(id);
=======
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
          {sortedConversations.map(([convoId, allMsgs]) => {
            const contactName = allMsgs[0]?.contact?.name || "Desconhecido";
            const recentMsgs = allMsgs.slice(-6);
            const isPinned = pinnedIds.includes(convoId);
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)

            return (
              <div
                key={id}
                className={`border rounded-lg h-[320px] flex flex-col ${
                  isPinned ? "border-blue-500" : "border-gray-800"
                }`}
              >
                <div className="p-3 flex justify-between">
                  <button onClick={() => togglePin(id)}>
                    <Pin size={14} />
                  </button>
                  <span>{msgs[0].contact.name}</span>
                </div>

<<<<<<< HEAD
                <div className="flex-1 p-2 space-y-2 overflow-hidden">
                  {recent.map((msg) => (
                    <div key={msg.id} className="text-xs">
                      {getIcon(msg.sender)} {msg.content}
                      <div className="text-gray-500">
                        {formatDistanceToNow(
                          new Date(msg.createdAt),
                          { locale: ptBR, addSuffix: true }
                        )}
=======
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
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

<<<<<<< HEAD
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#16181d] p-6 rounded-xl space-y-3">
            <button onClick={() => handleSelectInbox(3)}>
              Operacional
            </button>
            <button onClick={() => handleSelectInbox(2)}>
              Comercial
            </button>
=======
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
>>>>>>> parent of a7a20a2 (Limpeza e comentarios)
          </div>
        </div>
      )}
    </div>
  );
}
