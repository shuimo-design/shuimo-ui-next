import { useCallback, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  cardBrush,
  cardClasses,
  cardDividerLine,
  cardInk,
  createCardDivider,
  ensureCardSheet,
  type CardProps as CoreCardProps,
} from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";
import { useMounted, useSize } from "../../runtime";

export interface MCardProps extends CoreCardProps {
  /** 内容 */
  children?: ReactNode;
  /** 头部（替代 title） */
  header?: ReactNode;
  /** 头部右侧 */
  extra?: ReactNode;
  /** 顶部封面（图片区），裁在边框内 */
  cover?: ReactNode;
  /** 底部 */
  footer?: ReactNode;
  /** 印：盖在卡片右下角，不占内容流，微微探出框外 4px、歪 6°；不传不渲染任何节点 */
  seal?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MCard(props: MCardProps) {
  const { title, seed, padding } = props;
  const hasHeader = Boolean(props.header || props.extra || title);

  const brushRef = useBrushBorder(cardBrush(props));
  const [sizeRef, size] = useSize("border-box");
  const mounted = useMounted();

  // 两个 ref 回调合成一个绑到根元素上
  const ref = useMemo(
    () => (el: HTMLElement | null) => {
      brushRef(el);
      sizeRef(el);
    },
    [brushRef, sizeRef],
  );

  // 纸纹和标题旁的朱批写在 :root 上，所有卡片共用，挂载后生成一次
  useEffect(() => ensureCardSheet(), []);

  const ink = cardInk({ seed, padding, width: size.width, height: size.height, mounted });

  // 头部和内容之间那条线按卡片实际宽度单独生成；控制器只建一次，参数变了重新喂
  const divider = useMemo(() => createCardDivider(seed), []); // eslint-disable-line react-hooks/exhaustive-deps
  const dividerRef = useCallback((el: HTMLElement | null) => divider.attach(el), [divider]);
  useEffect(() => {
    divider.update(cardDividerLine(seed));
  });
  useEffect(() => () => divider.dispose(), [divider]);

  return (
    <div
      ref={ref}
      className={[...cardClasses(props, Boolean(props.cover)), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...ink.style, ...props.style } as CSSProperties}
      {...ink.attrs}
    >
      {props.cover ? <div className="m-card__cover">{props.cover}</div> : null}
      {hasHeader ? (
        <div className="m-card__header">
          <div className="m-card__title">{props.header ?? title}</div>
          {props.extra ? <div className="m-card__extra">{props.extra}</div> : null}
        </div>
      ) : null}
      {hasHeader ? <div ref={dividerRef} className="m-card__divider" aria-hidden="true" /> : null}
      <div className="m-card__body">{props.children}</div>
      {props.footer ? <div className="m-card__footer">{props.footer}</div> : null}
      {props.seal ? <div className="m-card__seal">{props.seal}</div> : null}
    </div>
  );
}
