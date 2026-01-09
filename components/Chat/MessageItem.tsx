import { UnreadBadge } from './UnreadBadge';

type Props = {
  sender: string;
  content: string;
  isRead: boolean;
};

export function MessageItem({ sender, content, isRead }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between gap-6">
      <div>
        <p className="text-lg font-semibold text-white">
          {sender}
        </p>
        <p className="text-zinc-300 text-xl mt-2 leading-relaxed">
          {content}
        </p>
      </div>

      {!isRead && <UnreadBadge />}
    </div>
  );
}
