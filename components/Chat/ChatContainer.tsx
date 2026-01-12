'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { useChatStore } from '@/store/chatStore';

/**
 * ChatContainer: Responsável por renderizar a lista de mensagens e gerenciar
 * o comportamento da área de rolagem.
 */
export function ChatContainer() {
  // Acessamos o estado global para pegar as mensagens e a função de atualizar status
  const { messages, markAsRead } = useChatStore();
  
  /**
   * useRef: Criamos uma "âncora" para o elemento HTML real (div).
   * Isso nos permite manipular o scroll diretamente, algo que o React puro não faz sozinho.
   */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * EFEITO: Gestão de Scroll e Status de Leitura
   * Este efeito roda toda vez que a lista de mensagens é alterada.
   */
  useEffect(() => {
    // 1. AUTO-SCROLL:
    // Fazemos com que a barra de rolagem desça automaticamente até o final (scrollHeight)
    // para que o usuário sempre veja a mensagem mais recente ao abrir o chat.
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }

    // 2. MARK AS READ (Sincronização):
    // Percorremos as mensagens e, se houver alguma não lida, disparamos a ação.
    // DICA: Certifique-se de que 'markAsRead' no Store não cause uma nova renderização 
    // se o status já for 'true', para evitar loops de performance.
    messages.forEach(msg => {
      if (!msg.isRead) {
        markAsRead(msg.id);
      }
    });
    
  }, [messages, markAsRead]); // Re-executa se as mensagens mudarem ou a função da store mudar

  return (
    <div
      ref={containerRef} // Vinculamos nossa âncora à div de scroll
      className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar"
    >
      {/* Mapeamento de Mensagens:
          Usamos o ID único do banco como 'key' para que o React saiba exatamente 
          qual item atualizar no DOM sem precisar renderizar a lista toda novamente.
      */}
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