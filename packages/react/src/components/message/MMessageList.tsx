// 某个方向的消息列表容器。由 MOverlayOutlet 渲染，不对外导出
import {
  messageListClasses,
  MESSAGE_LIST_LABEL,
  type MessageDirection,
  type MessageEntry,
} from "@shuimo-design/core";
import { MMessage } from "./MMessage";

export interface MMessageListProps {
  direction: MessageDirection;
  items: readonly MessageEntry[];
  /** 某条的离场动画走完了 */
  onRemove: (id: number) => void;
}

export function MMessageList({ direction, items, onRemove }: MMessageListProps) {
  return (
    <div
      className={messageListClasses(direction).join(" ")}
      role="region"
      aria-live="polite"
      aria-label={MESSAGE_LIST_LABEL}
    >
      {items.map((entry) => (
        <MMessage
          key={entry.id}
          {...entry.props}
          direction={direction}
          closing={entry.closing}
          onClose={() => onRemove(entry.id)}
        />
      ))}
    </div>
  );
}
