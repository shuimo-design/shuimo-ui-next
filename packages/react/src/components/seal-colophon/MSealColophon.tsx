import type { CSSProperties, ReactNode } from "react";
import {
  sealColophonClasses,
  sealColophonStampProps,
  type SealColophonProps as CoreSealColophonProps,
} from "@shuimo-design/core";
import { MStamp } from "../stamp";

export interface MSealColophonProps extends CoreSealColophonProps {
  /** 替换整段落款文（落款语 + 署名 + 日期），对应 Vue 的默认插槽 */
  children?: ReactNode;
  /** 替换印章，对应 Vue 的 seal 插槽 */
  renderSeal?: () => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MSealColophon(props: MSealColophonProps) {
  const { author, text, date, align = "right", vertical = false } = props;
  const core: CoreSealColophonProps = {
    author,
    text,
    date,
    seal: props.seal,
    sealShape: props.sealShape,
    sealMode: props.sealMode,
    sealSize: props.sealSize,
    align,
    vertical,
    seed: props.seed,
  };
  const stamp = sealColophonStampProps(core);

  return (
    <div
      className={[...sealColophonClasses(core), props.className].filter(Boolean).join(" ")}
      style={props.style}
    >
      <p className="m-seal-colophon__text">
        {props.children ?? (
          <>
            {text ? <span className="m-seal-colophon__note">{text}</span> : null}
            <span className="m-seal-colophon__author">{author}</span>
            {date ? <span className="m-seal-colophon__date">{date}</span> : null}
          </>
        )}
      </p>
      <span className="m-seal-colophon__seal">
        {props.renderSeal ? (
          props.renderSeal()
        ) : (
          <MStamp
            text={stamp.text}
            shape={stamp.shape}
            mode={stamp.mode}
            size={stamp.size}
            seed={stamp.seed}
          />
        )}
      </span>
    </div>
  );
}
