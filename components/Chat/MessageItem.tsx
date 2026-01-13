'use client';

interface MessageItemProps {
  sender: string;
  content: string;
  isRead?: boolean;
}

export function MessageItem({ sender, content, isRead }: MessageItemProps) {
  // Define se a mensagem é do "usuário/atendente" ou do "cliente"
  // Ajuste a lógica conforme o seu sistema identifica o remetente
  const isMe = sender === 'me' || sender === 'atendente';

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMe
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`}
      >
        {!isMe && (
          <span className="block text-[10px] font-bold uppercase mb-1 opacity-70">
            {sender}
          </span>
        )}
        <p className="leading-relaxed break-words">{content}</p>
      </div>
      
      {isMe && (
        <span className={`text-[10px] mt-1 ${isRead ? 'text-blue-500' : 'text-gray-400'}`}>
          {isRead ? 'Lida' : 'Enviada'}
        </span>
      )}
    </div>
  );
}