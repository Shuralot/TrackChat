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

// --------------------
// Tipagens
// --------------------
interface Contact {
  id: string;
  name: string;
}

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

type NotificationSound = "notification" | "augencio";

export default function QueueDashboard() {
  // --------------------
  // Zustand (estado global)
  // --------------------
  const { messages, setMessages, addMessage } = useChatStore();

  // --------------------
  // Estados locais
  // --------------------
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null);

  // 🔊 Som de notificação
  const [notificationSound, setNotificationSound] =
    useState<NotificationSound>("notification");

  // --------------------
  // Inicialização (localStorage)
  // --------------------
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

  // Persistência
  useEffect(() => {
    localStorage.setItem(
      "pinned_conversations",
      JSON.stringify(pinnedIds)
    );
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem("notification_sound", notificationSound);
  }, [notificationSound]);

  // --------------------
  // Métricas
  // --------------------
  const dailyTotal = useMemo(() => {
    return messages.filter((msg) =>
      isToday(new Date(msg.createdAt))
    ).length;
  }, [messages]);

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
  useEffect(() => {
    if (!selectedInbox) return;

    const socket = getSocket();

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
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedInbox, notificationSound, addMessage, setMessages]);

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
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-4 overflow-hidden">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 h-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold">
            Ai Atende | TrackChat
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
          <div className="bg-[#1e2128] px-3 py-1 rounded">
            Hoje: <b>{dailyTotal}</b>
          </div>
          <div className="bg-[#1e2128] px-3 py-1 rounded">
            {isConnected ? "🟢 ON" : "🔴 OFF"}
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedConversations.map(([id, msgs]) => {
            const recent = msgs.slice(-6);
            const isPinned = pinnedIds.includes(id);

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

                <div className="flex-1 p-2 space-y-2 overflow-hidden">
                  {recent.map((msg) => (
                    <div key={msg.id} className="text-xs">
                      {getIcon(msg.sender)} {msg.content}
                      <div className="text-gray-500">
                        {formatDistanceToNow(
                          new Date(msg.createdAt),
                          { locale: ptBR, addSuffix: true }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
