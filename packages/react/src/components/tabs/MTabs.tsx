import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  activeTabName,
  createTabsInk,
  fallbackTabName,
  focusTab,
  focusedTabIndex,
  isVerticalTabs,
  nextTabIndex,
  resolveTabs,
  tabIndicatorStyle,
  tabSlipBindings,
  tabsClasses,
  tabsContentBrush,
  tabsIndicatorOptions,
  tabsInkEnabled,
  tabsLineOptions,
  type TabName,
  type TabPaneConfig,
  type TabsProps as CoreTabsProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { useBrushBorder } from "../../ink";
import { useController, useMounted } from "../../runtime";
import { useBrushLine } from "../divider/use-brush-line";
import { MTabPane, type MTabPaneProps } from "./MTabPane";

/** React 这边的一页配置：标签和面板的内容就是普通的 ReactNode */
export type ReactTabPane = TabPaneConfig<ReactNode>;

export interface MTabsProps extends Omit<CoreTabsProps, "panes"> {
  /** 每一页的配置，顺序就是标签顺序；不传则按书写顺序从子组件 MTabPane 上收集 */
  panes?: ReactTabPane[];
  /** 受控的激活页；不传就由组件自己记（配合 defaultValue） */
  value?: TabName;
  defaultValue?: TabName;
  onValueChange?: (name: TabName) => void;
  /** 激活的标签变化 */
  onChange?: (name: TabName) => void;
  /** 点了某个标签（不管有没有真的切换） */
  onTabClick?: (name: TabName, event: MouseEvent) => void;
  /** 点了某个标签的关闭按钮；组件不会自己删 pane，由使用方处理 */
  onTabRemove?: (name: TabName) => void;
  /** 导航条末尾（横排时靠右，竖排时靠下）的附加内容 */
  extra?: ReactNode;
  /** 放 MTabPane（语法糖；传了 panes 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MTabPane 的配置。
 *
 * 全程在渲染期完成：读的是元素上的 props，既不用等 effect、也不用比 DOM 位置。
 * effect 的执行顺序在 Fragment / Suspense / 并发切片下不保证跟 DOM 一致，
 * 服务端更是压根没有 DOM —— 这就是这三个组件不再用"子组件登记"的原因。
 */
function collectPanes(children: ReactNode): ReactTabPane[] {
  const panes: ReactTabPane[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MTabPane) continue;
    const props = node.props as MTabPaneProps;
    panes.push({
      // 没给 name 就用书写位置顶上；它只是个标识，value 也能拿它来切
      name: props.name ?? panes.length,
      label: props.label,
      labelNode: props.labelNode,
      disabled: props.disabled ?? false,
      closable: props.closable,
      lazy: props.lazy ?? false,
      content: props.children,
    });
  }
  return panes;
}

export function MTabs(props: MTabsProps) {
  const {
    type = "line",
    position = "top",
    closable = false,
    stretch = false,
    disabled = false,
    extra,
    children,
  } = props;

  const uid = useId();
  const vertical = isVerticalTabs(position);
  const card = type === "card";

  // 页的来源：传了 panes 就用传的，没传才从 children 收集
  const panes = props.panes ?? collectPanes(children);

  const controlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<TabName | undefined>(props.defaultValue);
  const model = controlled ? props.value : uncontrolled;
  const active = activeTabName(panes, model);
  const tabs = resolveTabs({ panes, active, uid, closable, disabled });

  const setActive = useCallback(
    (name: TabName) => {
      if (name === active) return;
      if (!controlled) setUncontrolled(name);
      props.onValueChange?.(name);
      props.onChange?.(name);
    },
    // props 每次渲染都是新对象，只盯真正会改变行为的两个值
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled, active],
  );

  /** 记住激活项的位置：value 指向的页被删掉时，像浏览器关标签一样落到邻居上 */
  const lastIndex = useRef(0);
  const activeIndex = tabs.findIndex((tab) => tab.active);
  useEffect(() => {
    if (activeIndex >= 0) {
      lastIndex.current = activeIndex;
      return;
    }
    if (model === undefined || panes.length === 0) return;
    const next = fallbackTabName(panes, lastIndex.current);
    if (next !== undefined) setActive(next);
  });

  /** lazy 的页记住"已经激活过"，之后切走只隐藏不销毁 */
  const opened = useRef(new Set<TabName>());
  if (active !== undefined) opened.current.add(active);

  // ---- 量导航条：指示器位置、签条底图、激活签条的三面框全在 core 的控制器里 ----
  const [ink, state] = useController(createTabsInk, { vertical, card, position });
  const listEl = useRef<HTMLElement | null>(null);
  const setList = useCallback(
    (el: HTMLDivElement | null) => {
      listEl.current = el;
      ink.setList(el);
    },
    [ink],
  );
  // 每轮渲染之后重量一次：激活项、页数、方向、外形变了都要跟
  useEffect(() => ink.measure());

  /** 挂载后才敢走素材登记（服务端登记不了），首帧一律内联，两边输出才对得上 */
  const mounted = useMounted();

  // ---- line 型的两条线：整长的底线按导航条长度生成，指示器按激活项宽度单独生成 ----
  const lineRef = useBrushLine({ ...tabsLineOptions(), vertical });
  const indicatorRef = useBrushLine({ ...tabsIndicatorOptions(), vertical });
  // 内容区四面框，签条插进它的上沿；stroke.css 只在 html.m-ink-ready 下生效
  const contentRef = useBrushBorder({ ...tabsContentBrush(), enabled: tabsInkEnabled(card) });

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (disabled) return;
    const focused = focusedTabIndex(listEl.current, event.target);
    const from = focused >= 0 ? focused : activeIndex;
    const next = nextTabIndex(panes, { key: event.key, vertical, from });
    if (next === undefined) return;
    event.preventDefault();
    focusTab(listEl.current, next);
    const pane = panes[next];
    if (pane) setActive(pane.name);
  }

  return (
    <div
      className={[...tabsClasses({ type, position, stretch, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
    >
      <div className="m-tabs__nav">
        <div
          ref={setList}
          className="m-tabs__list"
          role="tablist"
          aria-orientation={vertical ? "vertical" : "horizontal"}
          onKeyDown={onKeyDown}
        >
          {tabs.map((tab) => {
            const slip = tabSlipBindings(state.slips[tab.tabId], mounted);
            return (
              <div
                key={tab.name}
                id={tab.tabId}
                className={[
                  "m-tabs__tab",
                  tab.active ? "m-tabs__tab--active" : "",
                  tab.disabled ? "m-tabs__tab--disabled" : "",
                  tab.closable ? "m-tabs__tab--closable" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="tab"
                aria-selected={tab.active}
                aria-controls={tab.panelId}
                aria-disabled={tab.disabled || undefined}
                tabIndex={tab.active && !tab.disabled ? 0 : -1}
                style={slip.style as CSSProperties}
                {...slip.attrs}
                onClick={(event) => {
                  if (tab.disabled) return;
                  props.onTabClick?.(tab.name, event);
                  setActive(tab.name);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setActive(tab.name);
                }}
              >
                <span className="m-tabs__label">{panes[tab.index]?.labelNode ?? tab.label}</span>
                {tab.closable ? (
                  <button
                    type="button"
                    className="m-tabs__close"
                    aria-label={tab.closeLabel}
                    disabled={tab.disabled}
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (tab.disabled) return;
                      props.onTabRemove?.(tab.name);
                    }}
                  >
                    <IconClose />
                  </button>
                ) : null}
              </div>
            );
          })}
          {/* 指示器放在列表里，位移直接用标签相对列表的 offset */}
          {type === "line" ? (
            <span
              ref={indicatorRef}
              className="m-tabs__indicator"
              style={tabIndicatorStyle(state.indicator, vertical) as CSSProperties}
              aria-hidden="true"
            />
          ) : null}
        </div>
        {extra ? <div className="m-tabs__extra">{extra}</div> : null}
        {/* 底线跨整个导航条（含 extra），所以放在 nav 上而不是列表里 */}
        {type === "line" ? (
          <span ref={lineRef} className="m-tabs__line" aria-hidden="true" />
        ) : null}
      </div>
      <div ref={contentRef} className="m-tabs__content">
        {tabs.map((tab) => {
          const pane = panes[tab.index];
          const render = !pane?.lazy || opened.current.has(tab.name);
          return (
            <div
              key={tab.name}
              id={tab.panelId}
              className="m-tab-pane"
              role="tabpanel"
              aria-labelledby={tab.tabId}
              aria-hidden={!tab.active}
              // 和 Vue 的 v-show 一样用内联 display 藏起来（不用 hidden 属性：
              // 组件样式里一旦给 .m-tab-pane 设了 display，UA 的 [hidden] 就压不住了）
              style={tab.active ? undefined : { display: "none" }}
            >
              {render ? pane?.content : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
