'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { Howl } from 'howler';

import { useChatStore } from '@/store/chatStore';
import { Header } from '@/components/Chat/Header';
import { ChatContainer } from '@/components/Chat/ChatContainer';

const sound = new Howl({
  src: ['/sounds/notification.mp3'],
  volume: 1,
});

export default function ChatDashboard() {
  const { addMessage, setMessages } = useChatStore();

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;

    fetch('/api/messages')
      .then((res) => res.json())
      .then(setMessages);

    fetch('/api/socket');

    socket = io({ path: '/api/socket' });

    socket.on('new-message', (message) => {
      addMessage(message);
      sound.play();
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [addMessage, setMessages]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <Header />
      <ChatContainer />
    </main>
  );
}
