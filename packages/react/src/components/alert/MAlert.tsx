import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  ALERT_CLOSE_LABEL,
  alertBarLine,
  alertClasses,
  alertStyle,
  collapseHeightHooks,
  type AlertProps as CoreAlertProps,
} from "@shuimo-design/core";
import { IconClose } from "../../icons";
import { MTransition } from "../../transition";
import { useBrushLine } from "../divider/use-brush-line";

export interface MAlertProps extends CoreAlertProps {
  /** 说明文字，优先于 description（对应 Vue 的默认插槽） */
  children?: ReactNode;
  /** 标题，优先于 title（对应 Vue 的 title 插槽） */
  titleNode?: ReactNode;
  /** 替换状态徽记 */
  icon?: ReactNode;
  /** 右侧操作区（按钮、链接） */
  action?: ReactNode;
  /** 点了关闭按钮；随后组件自己隐藏 */
  onClose?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export function MAlert(props: MAlertProps) {
  const {
    type = "info",
    title,
    description,
    closable = true,
    showIcon = true,
    center = false,
    effect = "light",
    seed,
    children,
    titleNode,
    icon,
    action,
  } = props;

  const [visible, setVisible] = useState(true);
  const hasTitle = Boolean(titleNode || title);
  const hasDescription = Boolean(children || description);

  // 左边那条色边按整条提示的实际高度单独生成一根竖向笔触线，参数在 core
  const bar = useBrushLine(alertBarLine(seed));

  const onClose = (event: MouseEvent<HTMLElement>) => {
    setVisible(false);
    props.onClose?.(event);
  };

  return (
    /*
     * 收起过渡：离场只是把元素藏起来（unmountOnLeave=false，等同 Vue 的 v-show），
     * 得先把高度钉成实际值再过渡到 0。钉高度那几行在 core 的 collapseHeightHooks 里，
     * Vue 那边用的是同一份。
     */
    <MTransition name="m-alert" in={visible} unmountOnLeave={false} {...collapseHeightHooks}>
      <div
        className={[
          ...alertClasses({ type, effect, center, hasTitle, hasDescription }),
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ ...alertStyle({ type, seed }), ...props.style } as CSSProperties}
        role="alert"
      >
        <span ref={bar} className="m-alert__bar" aria-hidden="true" />
        {showIcon ? (
          icon ? (
            <span className="m-alert__icon m-alert__icon--custom" aria-hidden="true">
              {icon}
            </span>
          ) : (
            <span className="m-alert__icon" aria-hidden="true" />
          )
        ) : null}
        <div className="m-alert__content">
          {hasTitle ? <div className="m-alert__title">{titleNode ?? title}</div> : null}
          {hasDescription ? (
            <div className="m-alert__description">{children ?? description}</div>
          ) : null}
        </div>
        {action ? <div className="m-alert__action">{action}</div> : null}
        {closable ? (
          <button
            type="button"
            className="m-alert__close"
            aria-label={ALERT_CLOSE_LABEL}
            onClick={onClose}
          >
            <IconClose />
          </button>
        ) : null}
      </div>
    </MTransition>
  );
}
