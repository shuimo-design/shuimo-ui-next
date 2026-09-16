import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  createPaperTheme,
  focusedPaperSwatchIndex,
  focusPaperSwatch,
  paperThemeClasses,
  paperThemeNextIndex,
  paperThemePresets,
  paperThemeSwatches,
  type PaperPreset,
  type PaperThemeProps as CorePaperThemeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MPaperThemeProps extends CorePaperThemeProps {
  /**
   * 受控的当前纸；不传就由组件自己记（配合 defaultPreset）。
   * 两个都不给时初始状态从本地记录 / 页面现状推，对应 Vue 那边不绑 v-model:preset 的情况
   */
  preset?: PaperPreset;
  defaultPreset?: PaperPreset;
  /** 当前纸变了（用户点击、别的实例切换、从本地记录恢复都会调） */
  onPresetChange?: (preset: PaperPreset | undefined) => void;
  /** 用户选了一种纸，参数是选中的预设 */
  onChange?: (preset: PaperPreset) => void;
  className?: string;
  style?: CSSProperties;
}

export function MPaperTheme(props: MPaperThemeProps) {
  const { presets, size = "md", storage = true, labels, disabled = false } = props;

  const controlled = props.preset !== undefined;
  const [uncontrolled, setUncontrolled] = useState<PaperPreset | undefined>(props.defaultPreset);
  const model = controlled ? props.preset : uncontrolled;

  // 读 localStorage、改 html[data-paper] 和纸面变量、盯 data-theme 和系统偏好
  // 全在 core 的控制器里，和 Vue 那边是同一份
  const [controller, state] = useController(createPaperTheme, { storage, value: model });
  const current = state.preset;

  const list = paperThemePresets(presets);
  const swatches = paperThemeSwatches({ presets: list, labels, preset: current });

  // 下面两个 effect 是 Vue 那边两个 watch 的等价物：用"上一次的值"当闸门，值没变就不跑，
  // 两边才不会互相回灌。读 controller.getSnapshot() 而不是渲染闭包里的 current：
  // connect() 在本次提交更靠前的一个 effect 里跑，那时闭包里这份还停在首帧的 undefined
  const lastCurrent = useRef<PaperPreset | undefined>(undefined);
  useEffect(() => {
    const now = controller.getSnapshot().preset;
    if (lastCurrent.current === now) return;
    lastCurrent.current = now;
    // 控制器推出来的纸（本地记录 / 页面现状 / 用户点击）是唯一真相，回写到绑定值上
    if (model === now) return;
    if (!controlled) setUncontrolled(now);
    props.onPresetChange?.(now);
  });

  const lastModel = useRef(model);
  useEffect(() => {
    if (lastModel.current === model) return;
    lastModel.current = model;
    // 外部把 preset 改成别的值 → 落到 html
    if (model !== undefined && model !== controller.getSnapshot().preset) controller.set(model);
  });

  function select(next: PaperPreset) {
    if (disabled) return;
    const changed = next !== controller.getSnapshot().preset;
    controller.set(next);
    if (changed) props.onChange?.(next);
  }

  const root = useRef<HTMLDivElement>(null);

  // roving tabindex：方向键在纸样间循环并直接选中，Home / End 跳到两头
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const focused = focusedPaperSwatchIndex(root.current, event.target);
    const from = focused >= 0 ? focused : swatches.findIndex((s) => s.checked);
    const next = paperThemeNextIndex(swatches.length, { key: event.key, from });
    if (next === undefined) return;
    event.preventDefault();
    focusPaperSwatch(root.current, next);
    const swatch = swatches[next];
    if (swatch) select(swatch.preset);
  }

  return (
    <div
      ref={root}
      className={[...paperThemeClasses({ size, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
      role="radiogroup"
      onKeyDown={onKeyDown}
    >
      {swatches.map((swatch) => (
        <button
          key={swatch.preset}
          type="button"
          className={swatch.className}
          style={swatch.style as CSSProperties}
          role="radio"
          aria-checked={swatch.checked}
          tabIndex={disabled ? -1 : swatch.tabIndex}
          disabled={disabled}
          onClick={() => select(swatch.preset)}
        >
          <span className="m-paper-theme__paper" aria-hidden="true" />
          <span className="m-paper-theme__label">{swatch.label}</span>
        </button>
      ))}
    </div>
  );
}
