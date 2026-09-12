import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  addMenuKey,
  buildMenuNodes,
  menuInkStyle,
  moveMenuFocus,
  resolveMenuFields,
  toggleMenuKey,
  type MenuFocusTarget,
  type MenuItem,
  type MenuKey,
  type MenuLabelScope,
  type MenuProps as CoreMenuProps,
} from "@shuimo-design/core";
import { useSize } from "../../runtime";
import { MenuContextObject, type MenuContext } from "./context";
import { MenuNode } from "./MenuNode";

export interface MMenuProps extends CoreMenuProps {
  /** 受控的当前项；不传就由组件自己记（配合 defaultValue） */
  value?: MenuKey;
  defaultValue?: MenuKey;
  onValueChange?: (key: MenuKey | undefined) => void;
  /** 受控的展开项 */
  expandedKeys?: MenuKey[];
  defaultExpandedKeys?: MenuKey[];
  onExpandedKeysChange?: (keys: MenuKey[]) => void;
  /** 点击菜单项（禁用项不触发）；键盘回车 / 空格也算 */
  onNodeClick?: (item: MenuItem, event: MouseEvent | KeyboardEvent) => void;
  /** 当前项变化（点叶子项），参数是新 key */
  onChange?: (key: MenuKey) => void;
  /** 子菜单展开 / 收起 */
  onExpand?: (item: MenuItem, expanded: boolean) => void;
  /** 传 data 时自定义每项文字，对应 Vue 的 label 插槽（作用域 { item, level }） */
  renderLabel?: (scope: MenuLabelScope) => ReactNode;
  /** 不传 data 时用它手写 MMenuItem */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MMenu(props: MMenuProps) {
  const { data, fieldNames, defaultExpandAll = false } = props;

  const fields = useMemo(() => resolveMenuFields(fieldNames), [fieldNames]);
  const nodes = useMemo(() => (data ? buildMenuNodes(data, fields) : []), [data, fields]);

  /* ---------- 两个双向绑定，受控 / 非受控都支持 ---------- */

  // value 用 in 判受控：undefined 是"没选中"这个合法值，用 !== undefined 判会把受控的空值错当成非受控
  const valueControlled = "value" in props;
  const [ownValue, setOwnValue] = useState<MenuKey | undefined>(props.defaultValue);
  const current = valueControlled ? props.value : ownValue;

  const expandedControlled = props.expandedKeys !== undefined;
  const [ownExpanded, setOwnExpanded] = useState<MenuKey[]>(props.defaultExpandedKeys ?? []);
  const expandedKeys = props.expandedKeys ?? ownExpanded;

  /**
   * 展开态另存一份 ref，每次渲染同步成最新。
   * 为什么不直接读渲染闭包里的 expandedKeys：初始全展开时好几个 MMenuItem 会在同一批 effect 里
   * 各自调一次 expand()，它们读到的都是这一帧的同一个数组，后一个会把前一个的结果盖掉。
   * 用 ref 串起来，同一批里连着调也能累加。
   */
  const expandedRef = useRef(expandedKeys);
  expandedRef.current = expandedKeys;

  function commitExpanded(next: MenuKey[]) {
    if (next === expandedRef.current) return;
    expandedRef.current = next;
    if (!expandedControlled) setOwnExpanded(next);
    props.onExpandedKeysChange?.(next);
  }

  const expanded = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  /** 程序性展开（跟随当前项、初始全展开）：已经展开时 addMenuKey 原样返回，引用相同就什么都不做 */
  function expand(key: MenuKey) {
    commitExpanded(addMenuKey(expandedRef.current, key));
  }

  function toggleExpand(item: MenuItem) {
    const was = expandedRef.current.includes(item.key);
    commitExpanded(toggleMenuKey(expandedRef.current, item.key));
    props.onExpand?.(item, !was);
  }

  /* ---------- 点击 ---------- */

  function activate(item: MenuItem, hasChildren: boolean, event: MouseEvent | KeyboardEvent) {
    if (item.disabled) return;
    props.onNodeClick?.(item, event);
    if (hasChildren) {
      toggleExpand(item);
      return;
    }
    if (current === item.key) return;
    if (!valueControlled) setOwnValue(item.key);
    props.onValueChange?.(item.key);
    props.onChange?.(item.key);
  }

  /* ---------- 键盘 ---------- */

  // 量高度的 ref 回调和自己要拿的根元素合成一个：ref 回调身份要稳，变了 React 会先 ref(null) 再 ref(node)
  const [sizeRef, size] = useSize();
  const root = useRef<HTMLElement | null>(null);
  const rootRef = useCallback(
    (el: HTMLUListElement | null) => {
      root.current = el;
      sizeRef(el);
    },
    [sizeRef],
  );

  // 看得见的行靠查 DOM 找（手写的 MMenuItem 根组件手里没有那棵树），整段在 core 里
  function moveFocus(from: HTMLElement, target: MenuFocusTarget) {
    moveMenuFocus(root.current, from, target);
  }

  // 上下文每次渲染现造一份：React 里只有换掉 value 才会让子树重渲染
  const context: MenuContext = {
    current,
    defaultExpandAll,
    expanded,
    toggleExpand,
    expand,
    activate,
    moveFocus,
    renderLabel: (scope: MenuLabelScope) =>
      props.renderLabel ? props.renderLabel(scope) : scope.item.label,
  };

  return (
    <ul
      ref={rootRef}
      className={["m-menu", props.className].filter(Boolean).join(" ")}
      role="menu"
      aria-orientation="vertical"
      // 左侧那一笔按菜单实际高度生成；分桶和画幅计算都在 core 的 menuInkStyle 里。
      // 首帧量不到高度（服务端也一样），按最短的一档画，挂载后再补
      style={{ ...menuInkStyle(size.height), ...props.style } as CSSProperties}
    >
      <MenuContextObject.Provider value={context}>
        {data
          ? nodes.map((node) => <MenuNode key={String(node.key)} node={node} />)
          : props.children}
      </MenuContextObject.Provider>
    </ul>
  );
}
