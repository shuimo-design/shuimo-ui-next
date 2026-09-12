/** MMessageList 与 api.ts 之间的内部契约，不对外导出 */
import type { MessageProps } from "./types";

export interface MessageEntry {
  id: number;
  props: MessageProps;
  /** 这条消息离场并从列表移除后调用 */
  onClosed: () => void;
}

export interface MessageListExposed {
  add(entry: MessageEntry): void;
  /** 触发某条消息的离场动画 */
  close(id: number): void;
  closeAll(): void;
}
