'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { useChatStore } from '@/store/chatStore';

export function ChatContainer() {
  const { messages, markAsRead } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll para novas mensagens
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 overflow-y-auto h-[calc(100vh-120px)] pr-4"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          onMouseEnter={() => markAsRead(msg.id)}
        >
          <MessageItem
            sender={msg.sender}
            content={msg.content}
            isRead={msg.isRead}
          />
        </div>
      ))}
    </div>
  );
}
