'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { Howl } from 'howler';
import { useChatStore } from '@/store/chatStore';

const sound = new Howl({
  src: ['/sounds/notification.mp3'],
  volume: 0.8,
});

export default function ChatDashboard() {
  const { messages, addMessage, setMessages, markAsRead } = useChatStore();

  useEffect(() => {
    // Carregar mensagens persistidas
    fetch('/api/messages')
      .then((res) => res.json())
      .then(setMessages);

    // Inicializar socket
    fetch('/api/socket');

    const socket = io({
      path: '/api/socket',
    });

    socket.on('new-message', (message) => {
      addMessage(message);
      sound.play();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📡 TrackChat</h1>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-zinc-900 p-4 rounded-xl flex justify-between"
            onMouseEnter={() => markAsRead(msg.id)}
          >
            <div>
              <p className="font-semibold">{msg.sender}</p>
              <p className="text-zinc-300">{msg.content}</p>
            </div>

            {!msg.isRead && (
              <span className="text-red-500 text-xl">●</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
