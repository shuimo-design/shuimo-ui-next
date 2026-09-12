import type { ConfirmQueue } from "../../overlay/confirm-queue";
import type { MessageQueue } from "../../overlay/message-queue";

/**
 * 函数式弹层渲染出口的 props。两个壳共用这一份，API 文档也从这里生成。
 *
 * 队列本身在 core（`message` / `confirm` 两个默认实例），出口只负责把它们渲染出来。
 * 不传就接默认那一套，也就是 `MMessage.success(...)` / `MConfirm.show(...)` 用的那一份。
 */
export interface OverlayOutletProps {
  /** 要接的消息队列，默认是 MMessage.* 用的那一份 */
  messages?: MessageQueue;
  /** 要接的确认框队列，默认是 MConfirm.show 用的那一份 */
  confirms?: ConfirmQueue;
}
