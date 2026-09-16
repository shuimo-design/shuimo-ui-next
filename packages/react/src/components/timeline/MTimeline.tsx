import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import {
  timelineAxisLineOptions,
  timelineClasses,
  timelineLayout,
  timelineStyle,
  type TimelineItemConfig,
  type TimelineItemScope,
  type TimelineProps as CoreTimelineProps,
} from "@shuimo-design/core";
import { useBrushLine } from "../divider/use-brush-line";
import { MTimelineItem, type MTimelineItemProps } from "./MTimelineItem";

/** React 这边的一条：render / renderDot 返回 ReactNode */
export type ReactTimelineItem = TimelineItemConfig<ReactNode>;

export interface MTimelineProps extends Omit<CoreTimelineProps, "items"> {
  /** 数据；不传则从子组件 MTimelineItem 上按书写顺序收集 */
  items?: readonly ReactTimelineItem[];
  /** 自定义节点（对应 Vue 的 dot 插槽） */
  renderDot?: (scope: TimelineItemScope) => ReactNode;
  /** 自定义整条内容（对应 Vue 的 item 插槽） */
  renderItem?: (scope: TimelineItemScope) => ReactNode;
  /** 放 MTimelineItem（语法糖；传了 items 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MTimelineItem 的配置。
 *
 * 全程在渲染期完成：读的是元素上的 props。effect 的执行顺序在 Fragment / Suspense /
 * 并发切片下不保证跟 DOM 一致，服务端更是没有 DOM —— 所以顺序不能靠子组件登记。
 * `Children.toArray` 给每个元素配的 key 带有 ".$" 前缀，这里只认使用者自己写的 key。
 */
function collectTimelineItems(children: ReactNode): ReactTimelineItem[] {
  const items: ReactTimelineItem[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MTimelineItem) continue;
    const props = node.props as MTimelineItemProps;
    items.push({
      key: node.key?.startsWith(".$") ? node.key.slice(2) : undefined,
      label: props.label,
      content: props.content,
      type: props.type,
      dot: props.dot,
      render: props.children === undefined ? undefined : () => props.children,
      renderDot: props.dotNode === undefined ? undefined : () => props.dotNode,
    });
  }
  return items;
}

export function MTimeline(props: MTimelineProps) {
  const {
    mode = "left",
    pending = false,
    reverse = false,
    seed,
    renderDot,
    renderItem,
    children,
  } = props;

  // 数据的来源：传了 items 就用传的，没传才从 children 收集
  const layout = timelineLayout(props.items ?? collectTimelineItems(children), {
    mode,
    pending,
    reverse,
    customDot: Boolean(renderDot),
  });

  // 轴线按实际高度单独生成笔触线；高度由网格给出，控制器只管量和画。
  // 不到两个节点时轴线不渲染，ref 拿到 null，控制器自己停着 —— hook 的数量不随条件变
  const axis = useBrushLine(timelineAxisLineOptions(seed));

  return (
    <ol
      className={[...timelineClasses({ mode, pending, reverse }), props.className]
        .filter(Boolean)
        .join(" ")}
      // 墨团、一笔圆两张素材挂在根上，节点的伪元素拿它们当遮罩
      style={{ ...timelineStyle(), ...props.style } as CSSProperties}
    >
      {/* 轴线和虚线段先于各条渲染，画在节点底下；它们不是列表项，对读屏器隐藏 */}
      {layout.axis ? (
        <li
          ref={axis}
          className="m-timeline__axis"
          style={layout.axis.style}
          role="presentation"
          aria-hidden="true"
        />
      ) : null}
      {layout.pendingLine ? (
        <li
          className="m-timeline__axis m-timeline__axis--pending"
          style={layout.pendingLine.style}
          role="presentation"
          aria-hidden="true"
        />
      ) : null}
      {layout.entries.map((entry) => {
        const scope: TimelineItemScope = { item: entry.item, index: entry.index };
        return (
          <li key={entry.key} className={entry.classes.join(" ")} style={entry.style}>
            <span className="m-timeline-item__node" aria-hidden="true">
              {entry.pending
                ? null
                : renderDot
                  ? renderDot(scope)
                  : entry.item.renderDot
                    ? entry.item.renderDot()
                    : entry.item.dot}
            </span>
            <div className="m-timeline-item__main">
              {/* 幽灵节点只有一行说明文字，不走 renderItem */}
              {entry.pending ? (
                entry.item.content ? (
                  <div className="m-timeline-item__content">{entry.item.content}</div>
                ) : null
              ) : renderItem ? (
                renderItem(scope)
              ) : entry.item.render ? (
                entry.item.render()
              ) : (
                <>
                  {entry.item.label ? (
                    <div className="m-timeline-item__label">{entry.item.label}</div>
                  ) : null}
                  {entry.item.content ? (
                    <div className="m-timeline-item__content">{entry.item.content}</div>
                  ) : null}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
