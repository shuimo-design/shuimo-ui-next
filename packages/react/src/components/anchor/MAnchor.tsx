import { useCallback, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  ANCHOR_LABEL,
  anchorClasses,
  anchorIndicatorStyle,
  anchorItemStyle,
  anchorLineOptions,
  anchorLinkClasses,
  anchorStyle,
  createAnchor,
  flattenAnchorItems,
  isHorizontalAnchor,
  type AnchorItemScope,
  type AnchorProps as CoreAnchorProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";
import { useBrushLine } from "../divider/use-brush-line";

export interface MAnchorProps extends CoreAnchorProps {
  /** 受控的激活 href；不传就由组件自己记（配合 defaultCurrent） */
  current?: string;
  defaultCurrent?: string;
  onCurrentChange?: (href: string) => void;
  /** 激活项变化（滚动到、或点击） */
  onChange?: (href: string) => void;
  /** 点了某条锚点；默认行为已拦下，滚动由组件做 */
  onClick?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** 自定义每条的内容（对应 Vue 的 item 插槽） */
  renderItem?: (scope: AnchorItemScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MAnchor(props: MAnchorProps) {
  const {
    items,
    container,
    offset = 0,
    targetOffset,
    smooth = true,
    affix = false,
    direction = "vertical",
    updateHash = false,
    seed = 1,
    renderItem,
  } = props;

  // 嵌套的 items 铺平成带层级的一列，顺序就是文档顺序
  const entries = flattenAnchorItems(items);
  const horizontal = isHorizontalAnchor(direction);

  const controlled = props.current !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultCurrent ?? "");
  const current = controlled ? props.current! : uncontrolled;

  // 容器解析、滚动监听、激活判定、点击滚动和滚动锁、指示线的测量全在 core 的控制器里，Vue 那边用的是同一份
  const [anchor, state] = useController(createAnchor, {
    container,
    hrefs: entries.map((entry) => entry.key),
    offset,
    targetOffset: targetOffset ?? offset,
    smooth,
    updateHash,
    horizontal,
    current,
    onChange: (href: string) => {
      if (!controlled) setUncontrolled(href);
      props.onCurrentChange?.(href);
      props.onChange?.(href);
    },
  });
  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的 nav 会来回换
  const navRef = useCallback((el: HTMLElement | null) => anchor.setNav(el), [anchor]);

  // 指示线按激活项的长度单独生成笔触线；长度变了控制器自己重画
  const inkRef = useBrushLine({ ...anchorLineOptions(seed), vertical: !horizontal });

  function onClick(href: string, event: MouseEvent<HTMLAnchorElement>) {
    props.onClick?.(href, event);
    // 滚动由控制器做：URL 只在 updateHash 时改，默认跳转会把 hash 写进去
    event.preventDefault();
    anchor.scrollTo(href);
  }

  return (
    <nav
      ref={navRef}
      className={[...anchorClasses({ direction, affix }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...anchorStyle({ affix, offset }), ...props.style } as CSSProperties}
      aria-label={ANCHOR_LABEL}
    >
      <span className="m-anchor__rail" aria-hidden="true" />
      {/* 指示线：长度和位移由控制器量出来，压在激活项旁边 */}
      <span
        ref={inkRef}
        className="m-anchor__ink"
        style={anchorIndicatorStyle(state.indicator, horizontal) as CSSProperties}
        aria-hidden="true"
      />
      <ul className="m-anchor__list">
        {entries.map((entry) => {
          const active = entry.key === current;
          return (
            <li
              key={entry.key}
              className="m-anchor__item"
              style={anchorItemStyle(entry.level) as CSSProperties}
            >
              <a
                href={entry.item.href}
                className={anchorLinkClasses(active).join(" ")}
                aria-current={active ? "true" : undefined}
                onClick={(event) => onClick(entry.key, event)}
              >
                {renderItem ? renderItem({ item: entry.item, active }) : entry.item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
