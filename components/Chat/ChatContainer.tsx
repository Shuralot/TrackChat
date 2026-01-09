'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { useChatStore } from '@/store/chatStore';

export function ChatContainer() {
  const { messages, markAsRead } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }

    // Marca todas mensagens novas como lidas
    messages.forEach(msg => {
      if (!msg.isRead) markAsRead(msg.id);
    });
  }, [messages, markAsRead]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4"
    >
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          sender={msg.sender}
          content={msg.content}
          isRead={msg.isRead}
        />
      ))}
    </div>
  );
}
