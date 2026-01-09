"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";
import { 
  AlertTriangle, Clock, Zap, Users, MessageSquare, 
  Search, Bell, Lock, Headphones, AlertCircle 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // Recomendo: npm install date-fns
import { ptBR } from "date-fns/locale";

export default function QueueDashboard() {
  const { addMessage, setMessages, messages } = useChatStore(); 
  const bottomRef = useRef<HTMLDivElement>(null);

  // Stats baseadas nos dados reais das mensagens
  const unansweredCount = messages.filter(m => !m.isRead).length;

  useEffect(() => {
    // Busca real do seu banco de dados via Prisma/API
    fetch("/api/messages")
      .then(res => res.json())
      .then(setMessages);

    const socket = getSocket();
    socket.on("new_message", (message) => {
      addMessage(message);
      new Audio("/notification.mp3").play();
    });

    return () => {
      socket.off("new_message");
    };
  }, [addMessage, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LÓGICA DE MAPEAMENTO (DB -> UI) ---
  
  const getIcon = (sender: string) => {
    // Exemplo: Se o sender for o bot, mostra lock, se for cliente mostra headset
    return sender.toLowerCase().includes("atendente") ? <Headphones size={18} /> : <MessageSquare size={18} />;
  };

  const getStatusColor = (isRead: boolean) => {
    // Mensagens não lidas ficam vermelhas (urgentes), lidas ficam azuis
    return isRead ? "bg-blue-500 text-blue-500" : "bg-red-500 text-red-500";
  };

  return (
    <div className="w-full h-screen bg-[#0f1115] text-white flex flex-col p-6 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Ai</span>
          <h1 className="text-xl font-semibold text-gray-200">Track Chat - Real Time</h1>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <Search className="w-5 h-5 cursor-pointer hover:text-white" />
          <Bell className="w-5 h-5 cursor-pointer hover:text-white" />
          <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden border border-gray-500">
            <img src="https://github.com/shadcn.png" alt="User" />
          </div>
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
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Nenhuma mensagem recebida no banco de dados...
          </div>
        ) : (
          messages.map((msg: any) => (
            <div 
              key={msg.id} 
              className="bg-[#1e2128] rounded flex items-center p-3 hover:bg-[#252830] transition-colors border-l-4 border-transparent relative overflow-hidden group"
            >
              {/* Indicador Lateral Baseado no isRead do seu DB */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(msg.isRead).split(' ')[0]}`}></div>

              {/* Icon */}
              <div className={`ml-3 mr-4 p-2 rounded-full bg-opacity-10 ${getStatusColor(msg.isRead)}`}>
                {getIcon(msg.sender)}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 font-medium text-sm">
                    ID: {msg.chatwootMessageId?.slice(0, 8)}
                  </span>
                  <span className="text-gray-600">|</span>
                  <span className={`text-sm font-bold ${!msg.isRead ? 'text-orange-400' : 'text-gray-300'}`}>
                    HÁ: {formatDistanceToNow(new Date(msg.createdAt), { locale: ptBR })}
                  </span>
                  <span className="text-gray-600">|</span>
                  <div className="text-white text-sm truncate flex gap-2">
                    <span className="font-semibold text-gray-300">{msg.sender}: </span>
                    <span className="text-gray-400 italic">"{msg.content}"</span>
                  </div>
                </div>

                {/* Tags dinâmicas baseadas no status */}
                <div className="flex gap-2 mt-1">
                  {!msg.isRead && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/50">
                      Não Lida
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                    Chatwoot
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}