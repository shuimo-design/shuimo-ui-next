import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  buildTreeNodes,
  collectInitialExpanded,
  computeTreeCheckStates,
  createVirtualList,
  createVirtualTreeFocus,
  flattenVirtualTree,
  mergeTreeKeys,
  nextCheckedKeys,
  resolveTreeFields,
  toggleTreeKey,
  treeCheckState,
  treeInkStyle,
  treeKeyAction,
  treeRowClasses,
  virtualListBodyStyle,
  virtualListItemStyle,
  virtualListOffsets,
  virtualListPhantomStyle,
  virtualListRange,
  virtualListTotalHeight,
  virtualTreeClasses,
  virtualTreeResumesFocus,
  virtualTreeRootStyle,
  virtualTreeRowIndexes,
  TREE_COLLAPSE_LABEL,
  TREE_EXPAND_LABEL,
  type TreeKey,
  type TreeLabelScope,
  type TreeNode as TreeNodeType,
  type VirtualListAlign,
  type VirtualTreeExpose,
  type VirtualTreeProps as CoreVirtualTreeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { MCheckbox } from "../checkbox";

export interface MVirtualTreeProps extends CoreVirtualTreeProps {
  /** 受控的选中项；不传就由组件自己记（配合 defaultSelectedKey） */
  selectedKey?: TreeKey;
  defaultSelectedKey?: TreeKey;
  onSelectedKeyChange?: (key: TreeKey | undefined) => void;
  /** 受控的勾选项 */
  checkedKeys?: TreeKey[];
  defaultCheckedKeys?: TreeKey[];
  onCheckedKeysChange?: (keys: TreeKey[]) => void;
  /** 受控的展开项 */
  expandedKeys?: TreeKey[];
  defaultExpandedKeys?: TreeKey[];
  onExpandedKeysChange?: (keys: TreeKey[]) => void;
  /** 点击节点行（禁用节点不触发）；键盘回车 / 空格也算 */
  onNodeClick?: (node: TreeNodeType, event: MouseEvent | KeyboardEvent) => void;
  /** 勾选态变化，带上变化后的全部已勾选 key */
  onCheck?: (node: TreeNodeType, checkedKeys: TreeKey[]) => void;
  /** 展开 / 收起 */
  onExpand?: (node: TreeNodeType, expanded: boolean) => void;
  /** 滚动时，参数是 scrollTop */
  onScroll?: (top: number) => void;
  /** 自定义节点文字，对应 Vue 的默认插槽（作用域 { node, level }） */
  renderLabel?: (scope: TreeLabelScope) => ReactNode;
  ref?: Ref<VirtualTreeExpose>;
  className?: string;
  style?: CSSProperties;
}

export function MVirtualTree(props: MVirtualTreeProps) {
  const {
    data,
    fieldNames,
    checkable = false,
    checkStrictly = false,
    defaultExpandAll = false,
    selectable = true,
    itemHeight,
    estimatedItemHeight = 32,
    buffer = 5,
    height,
  } = props;

  /* ---------- 树：与 MTree 同一套 core 函数 ---------- */

  const fields = useMemo(() => resolveTreeFields(fieldNames), [fieldNames]);
  // 一次性建出带 parent / level 的完整树：勾选联动和方向键都遍历它，不靠上下文逐层冒泡
  const nodes = useMemo(() => buildTreeNodes(data, fields), [data, fields]);

  // 初始展开只在建起来时算一次，之后完全由绑定值说了算，和 Vue 那边 setup 里算一次是同一个时机
  const initialExpanded = useRef<TreeKey[] | undefined>(undefined);
  initialExpanded.current ??= collectInitialExpanded(nodes, fields, defaultExpandAll);

  const expandedControlled = props.expandedKeys !== undefined;
  const [ownExpanded, setOwnExpanded] = useState<TreeKey[]>(() =>
    mergeTreeKeys(props.defaultExpandedKeys ?? [], initialExpanded.current ?? []),
  );
  const expandedKeys = props.expandedKeys ?? ownExpanded;

  const checkedControlled = props.checkedKeys !== undefined;
  const [ownChecked, setOwnChecked] = useState<TreeKey[]>(props.defaultCheckedKeys ?? []);
  const checkedKeys = props.checkedKeys ?? ownChecked;

  // selectedKey 用 in 判受控：undefined 是"没选中"这个合法值，用 !== undefined 判会把受控的空值错当成非受控
  const selectedControlled = "selectedKey" in props;
  const [ownSelected, setOwnSelected] = useState<TreeKey | undefined>(props.defaultSelectedKey);
  const selectedKey = selectedControlled ? props.selectedKey : ownSelected;

  function setExpandedKeys(next: TreeKey[]) {
    if (!expandedControlled) setOwnExpanded(next);
    props.onExpandedKeysChange?.(next);
  }
  function setCheckedKeys(next: TreeKey[]) {
    if (!checkedControlled) setOwnChecked(next);
    props.onCheckedKeysChange?.(next);
  }
  function setSelectedKey(next: TreeKey) {
    if (!selectedControlled) setOwnSelected(next);
    props.onSelectedKeyChange?.(next);
  }

  /**
   * 自动展开出来的那几个 key 要让外面知道（Vue 那边是 setup 里写一次 v-model）：
   * 非受控时初值里已经带上了，只补一声通知；受控时得把合并后的值写回去。
   * ref 拦着只做一次，StrictMode 跑两轮也不会重复。
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const initial = initialExpanded.current ?? [];
    if (initial.length === 0) return;
    const merged = mergeTreeKeys(expandedKeys, initial);
    if (!expandedControlled && merged === expandedKeys) props.onExpandedKeysChange?.(expandedKeys);
    else setExpandedKeys(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在挂起来那一次做，同 MTree
  }, []);

  const expanded = useMemo(() => new Set(expandedKeys), [expandedKeys]);
  const checkStates = useMemo(
    () => computeTreeCheckStates(nodes, checkedKeys, checkStrictly),
    [nodes, checkedKeys, checkStrictly],
  );

  /* ---------- 虚拟化：摊平的可见行就是列表项，控制器与 MVirtualList 同一个 ---------- */

  const rows = useMemo(() => flattenVirtualTree(nodes, expanded), [nodes, expanded]);
  const count = rows.length;
  // 按键和 scrollToKey 都按这两份查，展开序变一次算一次，不用每次按键都遍历全树
  const rowIndexes = useMemo(() => virtualTreeRowIndexes(rows), [rows]);
  const visibleNodes = useMemo(() => rows.map((row) => row.node), [rows]);

  const [vtree, state] = useController(createVirtualList, {
    itemHeight,
    estimatedItemHeight,
    buffer,
    onScroll: props.onScroll,
  });

  // 展开集合一变，行序整个重排，量过的行高全部作废（判断在 core 的 setItems 里）
  useEffect(() => vtree.setItems(rows), [vtree, rows]);

  // 前缀和只跟行高有关，跟滚到哪没关系：量到的行高表一直是同一个 Map，靠版本号当依赖
  const offsets = useMemo(
    () => virtualListOffsets({ count, itemHeight, estimatedItemHeight, measured: state.measured }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured 是同一个 Map，version 才是"变了"的信号
    [count, itemHeight, estimatedItemHeight, state.version, state.measured],
  );
  const range = useMemo(
    () =>
      virtualListRange({
        offsets,
        count,
        scrollTop: state.scrollTop,
        viewportHeight: state.viewportHeight,
        buffer,
      }),
    [offsets, count, state.scrollTop, state.viewportHeight, buffer],
  );
  const visible = rows.slice(range.start, range.end);

  useImperativeHandle(
    props.ref,
    () => ({
      scrollToKey: (key: TreeKey, align?: VirtualListAlign) => {
        const index = rowIndexes.get(key);
        if (index !== undefined) vtree.scrollTo(index, align);
      },
      scrollTo: vtree.scrollTo,
      scrollToOffset: vtree.scrollToOffset,
      scrollTop: vtree.scrollTop,
    }),
    // 展开序变了闭包里才是新下标；控制器方法身份恒定
    [vtree, rowIndexes],
  );

  /* ---------- 焦点：行元素表在 core；目标行不在渲染窗口时先滚过去，挂上来再补聚焦 ---------- */

  const rowEls = useMemo(() => createVirtualTreeFocus(), []);
  // 根元素既是控制器的视口，也是焦点的兜底容器；控制器方法身份恒定，这个回调也只建一次
  const setRoot = useMemo(
    () => (el: HTMLElement | null) => {
      vtree.setViewport(el);
      rowEls.setHost(el);
    },
    [vtree, rowEls],
  );
  const pendingFocus = useRef<TreeKey | null>(null);

  /**
   * 行的 ref 干两件事：登记进焦点表 + 交给控制器量尺寸。按 key 缓存回调，
   * 身份稳定才不会每轮渲染都把观察器摘了重挂；返回的清理函数由 React 在行下线时调
   * （正好对上 Vue 那边指令的 beforeUnmount），顺手把焦点表里的那一行也撤掉。
   * 回调只抓 key、不抓 node，下线时从表里删掉：表的大小跟着渲染窗口走，
   * 不会滚过几万行就攒几万个回调、换了 data 还拖着旧的节点树不放。
   */
  const rowRefs = useRef(new Map<TreeKey, (el: HTMLElement | null) => () => void>());
  function rowRefOf(key: TreeKey) {
    let cb = rowRefs.current.get(key);
    if (!cb) {
      cb = (el) => {
        rowEls.set(key, el);
        if (!el) return () => rowEls.set(key, null);
        vtree.observeItem(el);
        return () => {
          rowEls.set(key, null);
          vtree.releaseItem(el);
          rowRefs.current.delete(key);
        };
      };
      rowRefs.current.set(key, cb);
    }
    return cb;
  }

  function focusKey(key: TreeKey) {
    if (rowEls.focus(key)) return;
    const index = rowIndexes.get(key);
    if (index === undefined) return;
    pendingFocus.current = key;
    vtree.scrollTo(index, "start");
  }

  /** 焦点行被鼠标滚出窗口后焦点在容器上：方向键先把焦点送回那一行，再按一次就是正常的行为 */
  function hostKeydown(event: ReactKeyboardEvent<HTMLElement>) {
    // 行上的按键会冒泡到这里，只管落在容器本身的
    if (event.target !== event.currentTarget) return;
    const active = rowEls.activeKey();
    if (active === null || !virtualTreeResumesFocus(event.key)) return;
    event.preventDefault();
    focusKey(active);
  }

  // 每轮提交之后试一次：滚动位置更新 → 窗口重算 → 目标行挂上来的那一轮，焦点就补上了
  useEffect(() => {
    if (pendingFocus.current === null) return;
    if (rowEls.focus(pendingFocus.current)) pendingFocus.current = null;
  });

  /* ---------- 动作：与 MTree 的接法一字不差 ---------- */

  function toggleExpand(node: TreeNodeType) {
    if (node.children.length === 0) return;
    setExpandedKeys(toggleTreeKey(expandedKeys, node.key));
    props.onExpand?.(node, !expanded.has(node.key));
  }

  function setChecked(node: TreeNodeType, checked: boolean) {
    const next = nextCheckedKeys({
      node,
      checked,
      checkStrictly,
      checkedKeys,
      states: checkStates,
    });
    setCheckedKeys(next);
    props.onCheck?.(node, next);
  }

  function select(node: TreeNodeType, event: MouseEvent | KeyboardEvent) {
    if (node.disabled) return;
    props.onNodeClick?.(node, event);
    if (selectable) setSelectedKey(node.key);
  }

  function keydown(node: TreeNodeType, index: number, event: KeyboardEvent, selfTarget: boolean) {
    const action = treeKeyAction(node, event.key, {
      nodes,
      expanded,
      selfTarget,
      visible: visibleNodes,
      index,
    });
    if (action.prevent) event.preventDefault();
    if (action.kind === "focus" && action.key !== undefined) focusKey(action.key);
    else if (action.kind === "toggle") toggleExpand(node);
    else if (action.kind === "select") select(node, event);
  }

  /**
   * 行的可达名称指向 label 本身：行是平铺的，箭头按钮和勾选框都在 treeitem 里，
   * 不指名的话它们的文字会被拼进行名。后缀用摊平下标——行内唯一、不含空格、SSR 两边算得出。
   */
  const uid = useId();

  const itemStyle = virtualListItemStyle(itemHeight) as CSSProperties;

  return (
    // tabIndex=-1：Tab 不会停在容器上，只用来在焦点行被卸掉时接住焦点
    <div
      ref={setRoot}
      className={[...virtualTreeClasses(), props.className].filter(Boolean).join(" ")}
      role="tree"
      tabIndex={-1}
      style={
        { ...treeInkStyle(), ...virtualTreeRootStyle(height), ...props.style } as CSSProperties
      }
      onKeyDown={hostKeydown}
    >
      {/* 占位层撑出总高度让滚动条正确，可见的那批行由 body 平移到位 */}
      <div
        className="m-virtual-tree__phantom"
        style={virtualListPhantomStyle(virtualListTotalHeight(offsets, count)) as CSSProperties}
      />
      <div
        className="m-virtual-tree__body"
        style={virtualListBodyStyle(offsets, range.start) as CSSProperties}
      >
        {visible.map((row, i) => {
          const index = range.start + i;
          const node = row.node;
          const hasChildren = node.children.length > 0;
          const isExpanded = hasChildren && expanded.has(node.key);
          const check = treeCheckState(checkStates, node.key);
          return (
            <div
              key={String(node.key)}
              ref={rowRefOf(node.key)}
              data-index={index}
              className={treeRowClasses({
                expanded: isExpanded,
                selected: selectedKey === node.key,
                disabled: node.disabled,
              })}
              style={{ "--m-tree-level": node.level, ...itemStyle } as CSSProperties}
              role="treeitem"
              aria-labelledby={`${uid}-${index}`}
              aria-level={node.level + 1}
              aria-posinset={row.posInSet}
              aria-setsize={row.setSize}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-selected={selectedKey === node.key}
              aria-disabled={node.disabled || undefined}
              tabIndex={0}
              onClick={(event: ReactMouseEvent<HTMLElement>) => select(node, event.nativeEvent)}
              // React 的 onFocus 是冒泡的（对应原生 focusin），行里的勾选框拿到焦点也算这一行
              onFocus={() => rowEls.setActive(node.key)}
              onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) =>
                keydown(node, index, event.nativeEvent, event.target === event.currentTarget)
              }
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="m-tree-row__arrow"
                  tabIndex={-1}
                  aria-label={isExpanded ? TREE_COLLAPSE_LABEL : TREE_EXPAND_LABEL}
                  onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    toggleExpand(node);
                  }}
                >
                  {/* 实心小三角，形状全靠 CSS（m.ink 层换成毛边墨尖遮罩），转向也在它身上 */}
                  <span className="m-tree-row__arrow-shape" />
                </button>
              ) : (
                <span
                  className="m-tree-row__arrow m-tree-row__arrow--placeholder"
                  aria-hidden="true"
                />
              )}
              {checkable ? (
                <MCheckbox
                  className="m-tree-row__checkbox"
                  checked={check.checked}
                  indeterminate={check.indeterminate}
                  disabled={node.disabled}
                  // 点勾选框不该顺带把整行选中
                  onClick={(event: ReactMouseEvent<HTMLLabelElement>) => event.stopPropagation()}
                  onCheckedChange={(value) => setChecked(node, value)}
                />
              ) : null}
              <span id={`${uid}-${index}`} className="m-tree-row__label">
                {props.renderLabel ? props.renderLabel({ node, level: node.level }) : node.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
