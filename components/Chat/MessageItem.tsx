import { UnreadBadge } from './UnreadBadge';

/**
 * Interface de Definição de Dados (Props)
 * @param sender - Nome ou identificador de quem enviou a mensagem (ex: Agente, Cliente).
 * @param content - O corpo da mensagem em texto.
 * @param isRead - Booleano que controla a exibição do selo de "não lido".
 */
type Props = {
  sender: string;
  content: string;
  isRead: boolean;
};

/**
 * MessageItem: Renderiza o "balão" ou card individual de cada mensagem.
 * Este componente foca na legibilidade e na hierarquia visual:
 * 1. Nome do remetente (Destaque)
 * 2. Conteúdo (Leitura principal)
 * 3. Badge de notificação (Urgência)
 */
export function MessageItem({ sender, content, isRead }: Props) {
  return (
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between gap-6 transition-all hover:border-zinc-700"
      role="listitem" // Atributo ARIA para leitores de tela saberem que é um item de uma lista
    >
      <div className="flex-1 min-w-0">
        {/* Remetente: Semibold para diferenciar da mensagem */}
        <p className="text-lg font-semibold text-white truncate">
          {sender}
        </p>
        
        {/* Conteúdo: Texto maior e com espaçamento (leading-relaxed) para facilitar a leitura */}
        <p className="text-zinc-300 text-xl mt-2 leading-relaxed break-words">
          {content}
        </p>
      </div>

      {/* Indicador Visual:
          Renderização Condicional do Badge. Se 'isRead' for falso, 
          mostramos o componente UnreadBadge para chamar a atenção do usuário.
      */}
      {!isRead && (
        <div className="flex shrink-0 items-start pt-1">
          <UnreadBadge />
        </div>
      )}
    </div>
  );
}