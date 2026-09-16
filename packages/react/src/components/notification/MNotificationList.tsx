// 某个角的通知栈容器。由 MOverlayOutlet 渲染，不对外导出
import {
  notificationListClasses,
  NOTIFICATION_LIST_LABEL,
  type NotificationEntry,
  type NotificationPlacement,
} from "@shuimo-design/core";
import { MNotification } from "./MNotification";

export interface MNotificationListProps {
  placement: NotificationPlacement;
  items: readonly NotificationEntry[];
  /** 某条的离场动画走完了 */
  onRemove: (id: number) => void;
}

export function MNotificationList({ placement, items, onRemove }: MNotificationListProps) {
  return (
    <div
      className={notificationListClasses(placement).join(" ")}
      role="region"
      aria-live="polite"
      aria-label={NOTIFICATION_LIST_LABEL}
    >
      {items.map((entry) => (
        <MNotification
          key={entry.id}
          {...entry.props}
          placement={placement}
          closing={entry.closing}
          onClose={() => onRemove(entry.id)}
        />
      ))}
    </div>
  );
}
