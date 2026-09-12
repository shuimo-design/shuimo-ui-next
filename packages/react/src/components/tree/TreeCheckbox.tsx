import type { ChangeEvent, CSSProperties, MouseEvent } from "react";
import { treeCheckboxClasses, treeCheckboxInk, TREE_CHECKBOX_BRUSH } from "@shuimo-design/core";
import { useBrushBorder } from "../../ink";

/**
 * 节点行里的勾选框。
 *
 * Vue 那边直接用 MCheckbox，React 还没有 checkbox 组件，所以 MTree 自己画一个——
 * 类名、结构、墨迹参数都和 MCheckbox 一模一样（参数在 core 的 treeCheckboxInk / TREE_CHECKBOX_BRUSH 里，
 * 两边共用同一份），7000 行 CSS 才共用得上。等 checkbox 也搬到 React，这个文件换成引它即可。
 */
export interface TreeCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}

export function TreeCheckbox({
  checked,
  indeterminate,
  disabled,
  className,
  onChange,
}: TreeCheckboxProps) {
  // 方框是四边各一细笔的笔触边框，拐角只略出头，贴近旧版位图那种收得住的手画方框
  const boxRef = useBrushBorder(TREE_CHECKBOX_BRUSH);

  return (
    <label
      className={[treeCheckboxClasses({ checked, indeterminate, disabled }), className]
        .filter(Boolean)
        .join(" ")}
      style={treeCheckboxInk() as CSSProperties}
      // 点勾选框不该顺带把整行选中
      onClick={(event: MouseEvent<HTMLLabelElement>) => event.stopPropagation()}
    >
      <input
        className="m-checkbox__input"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? "mixed" : checked}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (disabled) return;
          onChange(event.target.checked);
        }}
      />
      <span ref={boxRef} className="m-checkbox__box" aria-hidden="true">
        {/* 勾选是框里一块实墨，半选是一横；默认皮肤靠 CSS，m.ink 层换成毛边墨块 / 短笔触遮罩 */}
        <span className="m-checkbox__mark" />
      </span>
    </label>
  );
}
