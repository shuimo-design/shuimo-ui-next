import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  confirm as defaultConfirmQueue,
  message as defaultMessageQueue,
  messageGroups,
  notification as defaultNotificationQueue,
  notificationGroups,
  resolvePortalTarget,
  type OverlayOutletProps,
} from "@shuimo-design/core";
import { useMounted } from "../../runtime";
import { MConfirm } from "../confirm/MConfirm";
import { MMessageList } from "../message/MMessageList";
import { MNotificationList } from "../notification/MNotificationList";

/** props 定义在 core（`OverlayOutletProps`），和 Vue 那边共用一份 */
export type MOverlayOutletProps = OverlayOutletProps;

/**
 * 函数式弹层的渲染出口。
 *
 * 旧版的 Vue 实现是自己往 body 上手挂一棵树的，为此还要靠 `useMessage()` 偷记一份 appContext ——
 * React 里没有对等物，那条路走不通。现在队列在 core，消息、通知和确认框由这个组件渲染在
 * **用户自己的组件树里**：读得到用户的 Context、DevTools 看得见、不用再借上下文。
 * 代价是用户必须在树里放一个出口（`<MConfigProvider>` 自带，或者自己放一个这个）。
 *
 * DOM 还是传送到 body：消息列表是 fixed 定位的，留在原地会被祖先的 transform 困住。
 * createPortal 只挪 DOM，组件树上的父子关系不变，Context 照常。
 */
export function MOverlayOutlet(props: MOverlayOutletProps) {
  const messages = props.messages ?? defaultMessageQueue;
  const notifications = props.notifications ?? defaultNotificationQueue;
  const confirms = props.confirms ?? defaultConfirmQueue;

  const messageSnapshot = useSyncExternalStore(
    messages.subscribe,
    messages.getSnapshot,
    messages.getServerSnapshot,
  );
  const notificationSnapshot = useSyncExternalStore(
    notifications.subscribe,
    notifications.getSnapshot,
    notifications.getServerSnapshot,
  );
  const confirmSnapshot = useSyncExternalStore(
    confirms.subscribe,
    confirms.getSnapshot,
    confirms.getServerSnapshot,
  );

  // 登记"有出口了"，队列靠它判断要不要警告没人接
  useEffect(() => messages.attachOutlet(), [messages]);
  useEffect(() => notifications.attachOutlet(), [notifications]);
  useEffect(() => confirms.attachOutlet(), [confirms]);

  const groups = useMemo(() => messageGroups(messageSnapshot), [messageSnapshot]);
  const stacks = useMemo(() => notificationGroups(notificationSnapshot), [notificationSnapshot]);
  const current = confirmSnapshot.current;

  // 弹层一律不进服务端 HTML：createPortal 在服务端会直接抛错
  const mounted = useMounted();
  const target = mounted ? resolvePortalTarget(true) : null;
  if (!mounted) return null;

  const lists = (
    <>
      {groups.map((group) => (
        <MMessageList
          key={group.direction}
          direction={group.direction}
          items={group.items}
          onRemove={messages.remove}
        />
      ))}
      {stacks.map((stack) => (
        <MNotificationList
          key={stack.placement}
          placement={stack.placement}
          items={stack.items}
          onRemove={notifications.remove}
        />
      ))}
    </>
  );

  return (
    <>
      {target ? createPortal(lists, target) : lists}
      {current ? (
        <MConfirm
          key={current.id}
          {...current.props}
          open={current.open}
          onConfirm={() => confirms.settle(current.id, true)}
          onCancel={() => confirms.settle(current.id, false)}
          onClosed={() => confirms.remove(current.id)}
        />
      ) : null}
    </>
  );
}
