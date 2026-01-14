// ./app/dashboard/chat/page.tsx

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore, Message } from "@/store/chatStore";
import { 
  Clock, MessageSquare, Lock, CircleUser, Pin, 
  Settings2, Volume2, VolumeX, Check, Music, Activity, Cpu, X, 
  MessagesSquare
} from "lucide-react";
import { formatDistanceToNow, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function QueueDashboard() {
  const { messages, setMessages, addMessage } = useChatStore();
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null);

  // SOM
  const [soundType, setSoundType] = useState<"default" | "augencio">("default");
  const [isMuted, setIsMuted] = useState(false);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);

  const soundsRef = useRef<Record<"default" | "augencio", HTMLAudioElement> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      soundsRef.current = {
        default: new Audio("/sounds/notification.wav"),
        augencio: new Audio("/sounds/augencio.mp3"),
      };
      Object.values(soundsRef.current).forEach(sound => {
        sound.volume = 0.25;
        sound.preload = "auto";
      });
    }
  }, []);

  useEffect(() => {
    const savedPin = localStorage.getItem("pinned_conversations");
    if (savedPin) setPinnedIds(JSON.parse(savedPin));

    const savedInbox = localStorage.getItem("selected_inbox_id");
    if (savedInbox) setSelectedInbox(Number(savedInbox));
    else setIsModalOpen(true);

    const savedSound = localStorage.getItem("selected_sound");
    if (savedSound) setSoundType(savedSound as "default" | "augencio");

    const savedMute = localStorage.getItem("is_muted");
    if (savedMute) setIsMuted(JSON.parse(savedMute));
  }, []);

  useEffect(() => {
    localStorage.setItem("pinned_conversations", JSON.stringify(pinnedIds));
    localStorage.setItem("is_muted", JSON.stringify(isMuted));
    localStorage.setItem("selected_sound", soundType);
  }, [pinnedIds, isMuted, soundType]);

  const dailyTotal = useMemo(() => messages.filter(msg => isToday(new Date(msg.createdAt))).length, [messages]);

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
        Array.from(new Set(msgs.map(m => m.conversationId))).forEach(joinConversation);
      });

    const handleNewMessage = (message: Message) => {
      if (message.inboxId && Number(message.inboxId) !== selectedInbox) return;

      joinConversation(message.conversationId);
      addMessage(message);

      if (document.visibilityState === "visible" && !isMuted && soundsRef.current) {
        const audio = soundsRef.current[soundType];
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("Erro ao tocar som:", err));
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedInbox, addMessage, setMessages, soundType, isMuted]);

  const getIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "AGENT": return <div className="p-1 rounded-full bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.4)]"><CircleUser size={12} className="text-purple-400" /></div>;
      case "USER": return <div className="p-1 rounded-full bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.4)]"><MessageSquare size={12} className="text-green-400" /></div>;
      default: return <div className="p-1 rounded-full bg-gray-500/20"><Lock size={12} className="text-gray-500" /></div>;
    }
  };

  return (
    <div className="w-full h-screen bg-[#050505] text-white flex flex-col p-4 font-sans overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50 pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-6 shrink-0 relative z-10 glass-panel rounded-xl p-3 border border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
              <MessagesSquare size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight">TrackChat</span>
              <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">Ai Atende</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-black/40 hover:bg-black/60 px-4 py-1.5 rounded-full border border-white/10 transition-all hover:border-cyan-500/30"
          >
            <Settings2 size={14} className="text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
              {selectedInbox === 3 ? "Operacional" : selectedInbox === 2 ? "Comercial" : "Selecionar Filtro"}
            </span>
          </motion.button>

          {/* Som Control */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSoundModalOpen(!isSoundModalOpen)}
              className={cn(
                "p-2 rounded-full border transition-all duration-300",
                isMuted 
                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              )}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </motion.button>

            <AnimatePresence>
              {isSoundModalOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 left-0 w-56 bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl z-50 p-3 overflow-hidden backdrop-blur-xl"
                >
                  <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 mb-2 tracking-widest border-b border-white/5">Audio Settings</div>
                  
                  <div className="space-y-1">
                    {[
                        { id: 'default', label: 'Padrão (Bip)', icon: Music },
                        { id: 'augencio', label: 'Augêncio (IA)', icon: Activity }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setSoundType(opt.id as any); setIsSoundModalOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group",
                          soundType === opt.id ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-2">
                           <opt.icon size={14} className={soundType === opt.id ? "text-cyan-400" : "text-gray-600 group-hover:text-gray-400"} />
                           <span>{opt.label}</span>
                        </div>
                        {soundType === opt.id && <motion.div layoutId="check"><Check size={14} /></motion.div>}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-white/10 my-2" />

                  <button 
                    onClick={() => { setIsMuted(!isMuted); setIsSoundModalOpen(false); }} 
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                      isMuted ? "text-red-400 bg-red-500/10" : "text-gray-300 hover:bg-white/5"
                    )}
                  >
                    {isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    <span>{isMuted ? "Ativar Áudio" : "Silenciar Sistema"}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
            <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Sys.Date</span>
            <span className="text-xs font-mono text-gray-200">{todayDate}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
             <Clock className="w-3 h-3 text-cyan-500" />
             <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Daily</span>
             <span className="text-xs font-bold text-white font-mono bg-cyan-500/20 px-1.5 rounded text-cyan-400">{dailyTotal}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
            <motion.div 
              animate={{ opacity: isConnected ? [1, 0.4, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", isConnected ? "bg-emerald-500 shadow-emerald-500" : "bg-red-500 shadow-red-500")} 
            />
            <span className={cn("text-xs font-bold tracking-wider font-mono", isConnected ? "text-emerald-400" : "text-red-400")}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      {/* Grid de conversas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0 pr-2">
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
          <AnimatePresence mode="popLayout">
            {sortedConversations.map(([convoId, allMsgs]) => {
              const groupName = allMsgs[0]?.groupName || "ID " + convoId.substring(0,8);
              // MUDANÇA: Exibe apenas as últimas 6 mensagens
              const recentMsgs = allMsgs.slice(-6); 
              const isPinned = pinnedIds.includes(convoId);

              return (
                <motion.div
                  layout="position"
                  key={convoId}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={cn(
                    "relative flex flex-col h-[340px] rounded-xl overflow-hidden transition-all duration-300 group/card",
                    isPinned 
                      ? "bg-[#0b0d12] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                      : "bg-[#0a0a0a]/80 border border-white/5 hover:border-white/10"
                  )}
                >
                  {/* Header do Card */}
                  <div className={cn(
                    "p-3 flex justify-between items-center border-b backdrop-blur-sm",
                    isPinned ? "bg-cyan-950/20 border-cyan-500/20" : "bg-white/[0.02] border-white/5"
                  )}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <motion.button 
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => togglePin(convoId)} 
                        className={cn("shrink-0 transition-colors", isPinned ? "text-cyan-400" : "text-gray-600 hover:text-gray-300")}
                      >
                        <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
                      </motion.button>
                      <h3 className="font-semibold text-xs text-gray-200 truncate uppercase tracking-wider font-mono" title={groupName}>
                        {groupName}
                      </h3>
                    </div>
                    {isPinned && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]" />}
                  </div>

                  {/* Corpo das Mensagens */}
                  <div className="flex-1 p-3 flex flex-col justify-end space-y-3 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

                    {recentMsgs.map((msg, idx) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.sender === 'AGENT' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          "flex gap-3 text-xs relative z-0 max-w-[90%]",
                          // Ajuste aqui: self-end para alinhar o bloco todo à direita
                          msg.sender === "AGENT" ? "self-end flex-row-reverse text-right" : "self-start flex-row text-left"
                        )}
                      >
                        {/* Ícone */}
                        <div className="mt-0.5 shrink-0 opacity-80">
                          {getIcon(msg.sender)}
                        </div>

                        {/* Conteúdo de Texto */}
                        <div className={cn(
                          "flex-1 min-w-0 flex flex-col gap-0.5", 
                          msg.sender === "AGENT" ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "flex items-baseline gap-2", 
                            msg.sender === "AGENT" ? "flex-row-reverse" : "flex-row"
                          )}>
                            <span className={cn(
                              "font-bold text-[10px] uppercase tracking-wide",
                              msg.sender === "AGENT" ? "text-purple-400" : "text-emerald-400"
                            )}>
                              {msg.senderName || (msg.sender === "AGENT" ? "Ai" : "User")}
                            </span>
                            <span className="text-[9px] text-gray-600 font-mono">
                              {formatDistanceToNow(new Date(msg.createdAt), { locale: ptBR, addSuffix: false })}
                            </span>
                          </div>
                          
                          {/* CORREÇÃO DO ERRO AQUI: */}
                          {/* Adicionado 'break-all' para quebrar strings longas sem espaço */}
                          <p className={cn(
                            "leading-relaxed line-clamp-2 break-all", 
                            msg.sender === "AGENT" ? "text-gray-400" : "text-gray-300"
                          )}>
                            {msg.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* MODAL DE SELEÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f11] border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden"
            >
              {/* MUDANÇA: Botão de fechar (X) */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white transition-colors z-20"
              >
                <X size={20} />
              </button>

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />
              
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-4 rounded-2xl mb-4 border border-white/5 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                    <Settings2 className="text-cyan-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Selecionar Fluxo</h2>
                <p className="text-gray-500 text-xs mt-2 font-mono">Configure o canal do TrackChat</p>
              </div>

              <div className="space-y-4 relative z-10">
                <button 
                    onClick={() => handleSelectInbox(3)} 
                    className={cn(
                        "w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between group",
                        selectedInbox === 3 
                        ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                        : "border-white/10 hover:border-cyan-500/50 bg-white/[0.02]"
                    )}
                >
                  <div>
                    <div className="font-bold text-gray-500 uppercase text-[10px] tracking-[0.2em] mb-1">Canal 03</div>
                    <div className="text-xl font-black text-white uppercase group-hover:text-cyan-400 transition-colors">Operacional</div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button 
                    onClick={() => handleSelectInbox(2)} 
                    className={cn(
                        "w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between group",
                        selectedInbox === 2 
                        ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                        : "border-white/10 hover:border-purple-500/50 bg-white/[0.02]"
                    )}
                >
                  <div>
                    <div className="font-bold text-gray-500 uppercase text-[10px] tracking-[0.2em] mb-1">Canal 02</div>
                    <div className="text-xl font-black text-white uppercase group-hover:text-purple-400 transition-colors">Comercial</div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}