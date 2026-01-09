"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/store/chatStore";

export default function ChatPage() {
  const { addMessage, setMessages, messages } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mensagens iniciais
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

  // Scroll automático para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="w-full h-full p-4 flex flex-col gap-2 overflow-y-auto">
      {messages.length === 0 ? (
        <p className="text-white">Nenhuma mensagem ainda...</p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded ${
              msg.isRead ? "bg-gray-800" : "bg-blue-700"
            }`}
          >
            <strong className="text-white">{msg.sender}:</strong>{" "}
            <span className="text-white">{msg.content}</span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </section>
  );
}
