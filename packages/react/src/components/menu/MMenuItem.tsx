import {
  Children,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  createMenuDescendants,
  menuDescendantUid,
  menuHasDescendant,
  menuItemClasses,
  menuKeyAction,
  type MenuItem,
  type MenuItemProps as CoreMenuItemProps,
  type MenuLabelScope,
  type MenuParentContextValue,
} from "@shuimo-design/core";
import { MenuParentContextObject, useMenuContext, useMenuParent } from "./context";

export interface MMenuItemProps extends CoreMenuItemProps {
  /** 子菜单：放更多 MMenuItem */
  children?: ReactNode;
  /** 自定义文字，对应 Vue 的 label 插槽（作用域 { item, level }） */
  renderLabel?: (scope: MenuLabelScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MMenuItem(props: MMenuItemProps) {
  const { name, label = "", disabled = false, data, children } = props;

  const menu = useMenuContext();
  const parent = useMenuParent();

  const level = parent.level;
  const labelId = useId();

  const item: MenuItem = { key: name, label, disabled, level, data };
  const hasChildren = Children.count(children) > 0;
  const expanded = hasChildren && menu.expanded.has(name);
  const current = menu.current === name;

  /* ---------- 后代登记 ---------- */

  // 子项登记到这张表并一路往上报，祖先才知道当前项在不在自己下面。
  // 用 core 的登记表而不是一个 Set：它自带订阅，React 靠订阅重渲染，Vue 那边用的是同一份
  const descendants = useMemo(() => createMenuDescendants(), []);
  const snapshot = useSyncExternalStore(
    descendants.subscribe,
    descendants.getSnapshot,
    descendants.getServerSnapshot,
  );
  const containsCurrent = menuHasDescendant(snapshot, menu.current);

  // Vue 在 setup 里就登记好了；React 只能在 effect 里登记（渲染期不许有副作用）。
  // 子组件的 effect 先于父组件跑，所以父项第一次 effect 时后代已经齐了，最多多渲染一帧
  useEffect(() => {
    parent.register(name);
    return () => parent.unregister(name);
  }, [parent, name]);

  const childParent = useMemo<MenuParentContextValue>(
    () => ({
      level: level + 1,
      register(key) {
        descendants.register({ uid: menuDescendantUid(key) });
        parent.register(key);
      },
      unregister(key) {
        descendants.unregister(menuDescendantUid(key));
        parent.unregister(key);
      },
    }),
    [level, descendants, parent],
  );

  /* ---------- 展开跟随当前项（旧版 expand: 'isActive' 的行为） ---------- */

  /**
   * 挂载时（defaultExpandAll 或当前项就在自己下面）展开一次，之后只在"当前项刚进到这一支里"时再展开。
   * 记上一轮的值是必须的：Vue 那边用的是 watch（只在变化时触发），
   * 这边不记的话每次渲染都会重新展开一遍 —— 用户刚用左方向键收起来，下一帧就又被弹开了。
   * undefined 表示还没挂载过。
   */
  const seenInside = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!hasChildren) return;
    const was = seenInside.current;
    seenInside.current = containsCurrent;
    if (was === undefined) {
      if (menu.defaultExpandAll || containsCurrent) menu.expand(name);
    } else if (containsCurrent && !was) {
      menu.expand(name);
    }
  });

  /* ---------- 交互 ---------- */

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const action = menuKeyAction(event.key, { hasChildren, expanded, disabled });
    if (action.prevent) event.preventDefault();
    if (action.kind === "focus" && action.target)
      menu.moveFocus(event.currentTarget, action.target);
    else if (action.kind === "toggle") menu.toggleExpand(item);
    else if (action.kind === "activate") menu.activate(item, hasChildren, event.nativeEvent);
  }

  return (
    <li
      className={[
        menuItemClasses({
          root: level === 0,
          current,
          active: current || containsCurrent,
          expanded,
          disabled,
        }),
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--m-menu-level": level, ...props.style } as CSSProperties}
      role="none"
    >
      <div
        className="m-menu-item__row"
        role="menuitem"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-disabled={disabled || undefined}
        aria-current={current ? "true" : undefined}
        onClick={(event: MouseEvent<HTMLElement>) =>
          menu.activate(item, hasChildren, event.nativeEvent)
        }
        onKeyDown={onKeyDown}
      >
        <span id={labelId} className="m-menu-item__label">
          {props.renderLabel ? props.renderLabel({ item, level }) : label}
        </span>
      </div>
      {hasChildren ? (
        <div className="m-menu-item__sub">
          {/* 收起时 inert：还在 DOM 里参与高度动画，但不可聚焦、方向键也跳过 */}
          <ul className="m-menu-item__sub-list" role="menu" inert={!expanded}>
            <MenuParentContextObject.Provider value={childParent}>
              {children}
            </MenuParentContextObject.Provider>
          </ul>
        </div>
      ) : null}
    </li>
  );
}
