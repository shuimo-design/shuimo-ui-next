import { useContext, type CSSProperties, type ReactNode } from "react";
import {
  stepAriaCurrent,
  stepClasses,
  stepIsLast,
  stepIsVertical,
  stepLineOptions,
  stepOrdinal,
  stepStatus,
  stepStyle,
  type StepProps as CoreStepProps,
} from "@shuimo-design/core";
import { useBrushLine } from "../divider/use-brush-line";
import { StepIndexContext, StepsContext } from "./context";

export interface MStepProps extends CoreStepProps {
  /** 节点里的内容，替换掉序号 / 勾 / 叉（对应 Vue 的 icon 插槽） */
  icon?: ReactNode;
  /** 标题，优先于 title（对应 Vue 的 title 插槽） */
  titleNode?: ReactNode;
  /** 描述，优先于 description（对应 Vue 的 description 插槽） */
  descriptionNode?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MStep(props: MStepProps) {
  const { title, status: own, icon, titleNode, descriptionNode } = props;
  const group = useContext(StepsContext);
  // 序号由 MSteps 按 children 顺序数出来发下来；不在 MSteps 里时用 core 的默认值（自己是唯一的一步）
  const { index, count } = useContext(StepIndexContext);

  const status = stepStatus({ own, index, group });
  const last = stepIsLast(index, count);
  const vertical = stepIsVertical(group);

  // 节点后那段连接线按实际长度单独生成；笔触参数（含跟序号走的种子）在 core。
  // 最后一步不渲染线元素，ref 拿到 null，控制器自己停着 —— hook 的数量不随条件变
  const line = useBrushLine({ ...stepLineOptions(index), vertical });

  const description = descriptionNode ?? props.description;

  return (
    <div
      className={[...stepClasses({ status, last }), props.className].filter(Boolean).join(" ")}
      // 勾、叉、墨团、一笔圆四张素材挂在根上，节点的伪元素拿它们当遮罩
      style={{ ...stepStyle(), ...props.style } as CSSProperties}
      role="listitem"
      aria-current={stepAriaCurrent(status)}
    >
      <div className="m-step__node" aria-hidden="true">
        {icon ??
          (status === "finish" ? (
            <span className="m-step__mark m-step__mark--check" />
          ) : status === "error" ? (
            <span className="m-step__mark m-step__mark--cross" />
          ) : (
            <span className="m-step__number">{stepOrdinal(index)}</span>
          ))}
      </div>
      {/* 到下一步的连接线，最后一步没有；横向放节点右侧，纵向放节点下方 */}
      {last ? null : <div ref={line} className="m-step__line" aria-hidden="true" />}
      <div className="m-step__main">
        <div className="m-step__title">{titleNode ?? title}</div>
        {description ? <div className="m-step__description">{description}</div> : null}
      </div>
    </div>
  );
}
