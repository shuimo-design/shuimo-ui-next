import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import {
  descriptionsClasses,
  descriptionsGrid,
  descriptionsInk,
  descriptionsValueText,
  type DescriptionsItemConfig,
  type DescriptionsItemScope,
  type DescriptionsProps as CoreDescriptionsProps,
} from "@shuimo-design/core";
import { useMounted, useSize } from "../../runtime";
import { MDescriptionsItem, type MDescriptionsItemProps } from "./MDescriptionsItem";

/** React 这边的一条：render / renderLabel 返回 ReactNode */
export type ReactDescriptionsItem = DescriptionsItemConfig<ReactNode>;

export interface MDescriptionsProps extends Omit<CoreDescriptionsProps, "items" | "title"> {
  /** 数据；不传则从子组件 MDescriptionsItem 上按书写顺序收集 */
  items?: readonly ReactDescriptionsItem[];
  /** 标题（对应 Vue 的 title prop / 插槽） */
  title?: ReactNode;
  /** 标题右侧的操作区（对应 Vue 的 extra 插槽） */
  extra?: ReactNode;
  /** 自定义标签（对应 Vue 的 label 插槽） */
  renderLabel?: (scope: DescriptionsItemScope) => ReactNode;
  /** 自定义值（对应 Vue 的 value 插槽） */
  renderValue?: (scope: DescriptionsItemScope) => ReactNode;
  /** 放 MDescriptionsItem（语法糖；传了 items 就不看这里） */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * 从 children 里按**书写顺序**收集 MDescriptionsItem 的配置。
 *
 * 全程在渲染期完成：读的是元素上的 props。effect 的执行顺序在 Fragment / Suspense /
 * 并发切片下不保证跟 DOM 一致，服务端更是没有 DOM —— 所以顺序不能靠子组件登记。
 * `Children.toArray` 给每个元素配的 key 带有 ".$" 前缀，这里只认使用者自己写的 key。
 */
function collectDescriptionsItems(children: ReactNode): ReactDescriptionsItem[] {
  const items: ReactDescriptionsItem[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement(node) || node.type !== MDescriptionsItem) continue;
    const props = node.props as MDescriptionsItemProps;
    items.push({
      key: node.key?.startsWith(".$") ? node.key.slice(2) : undefined,
      label: props.label,
      value: props.value,
      span: props.span,
      render: props.children === undefined ? undefined : () => props.children,
      renderLabel: props.labelNode === undefined ? undefined : () => props.labelNode,
    });
  }
  return items;
}

export function MDescriptions(props: MDescriptionsProps) {
  const {
    title,
    extra,
    column = 3,
    bordered = false,
    layout = "horizontal",
    size = "md",
    colon = true,
    renderLabel,
    renderValue,
    children,
  } = props;

  // 数据的来源：传了 items 就用传的，没传才从 children 收集
  const grid = descriptionsGrid(props.items ?? collectDescriptionsItems(children), {
    column,
    layout,
    bordered,
  });
  // 和 Vue 那边的 `Boolean(title || slots.title || slots.extra)` 对齐
  const hasHeader = Boolean(title || extra);

  // ---- 墨线：带格线时按实际宽度生成，宽度按 32px 分桶。首帧量到 0，渲染朴素版 ----
  const [rootRef, sizeBox] = useSize();
  const mounted = useMounted();
  const ink = descriptionsInk({ width: sizeBox.width, mounted, bordered });

  return (
    <div
      ref={rootRef}
      className={[...descriptionsClasses({ layout, size, bordered, colon }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
    >
      {hasHeader ? (
        <div className="m-descriptions__header">
          <div className="m-descriptions__title">{title}</div>
          {extra ? <div className="m-descriptions__extra">{extra}</div> : null}
        </div>
      ) : null}
      {/* 网格挂在 <dl> 外面：带格线时的横线要和格子在同一张网格里，而 <dl> 里只能放 dt / dd */}
      <div className="m-descriptions__grid" style={{ gridTemplateColumns: grid.template }}>
        <dl className="m-descriptions__list">
          {grid.cells.map((cell) => {
            const scope: DescriptionsItemScope = { item: cell.item };
            return (
              <Fragment key={cell.key}>
                <dt className={cell.labelClass} style={cell.labelStyle}>
                  {renderLabel
                    ? renderLabel(scope)
                    : cell.item.renderLabel
                      ? cell.item.renderLabel()
                      : cell.item.label}
                </dt>
                <dd className={cell.valueClass} style={cell.valueStyle}>
                  {renderValue
                    ? renderValue(scope)
                    : cell.item.render
                      ? cell.item.render()
                      : descriptionsValueText(cell.item.value)}
                </dd>
              </Fragment>
            );
          })}
        </dl>
        {grid.lines.map((line) => (
          <span key={line.key} className={line.className} style={line.style} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}
