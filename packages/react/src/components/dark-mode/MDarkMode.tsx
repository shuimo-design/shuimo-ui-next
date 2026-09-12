import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  createDarkMode,
  darkModeClasses,
  darkModeFish,
  darkModeGlowId,
  darkModeLabel,
  darkModePathVars,
  DARK_MODE_STORAGE_KEY,
  type DarkModeProps as CoreDarkModeProps,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MDarkModeProps extends CoreDarkModeProps {
  /**
   * 受控的深浅状态；不传就由组件自己记（配合 defaultDark）。
   * 两个都不给时初始状态从本地记录 / 系统偏好推，对应 Vue 那边不绑 v-model 的情况
   */
  dark?: boolean;
  defaultDark?: boolean;
  /** 深浅状态变了（用户点击、系统偏好变化、从本地记录恢复都会调） */
  onDarkChange?: (dark: boolean) => void;
  /** 用户点击切换后，参数是切换后是否为深色 */
  onChange?: (dark: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export function MDarkMode(props: MDarkModeProps) {
  const {
    disabled = false,
    autoMode = false,
    rotate = true,
    storageKey = DARK_MODE_STORAGE_KEY,
    transition = true,
  } = props;

  const controlled = props.dark !== undefined;
  const [uncontrolled, setUncontrolled] = useState<boolean | undefined>(props.defaultDark);
  const model = controlled ? props.dark : uncontrolled;

  // 读 localStorage、问 matchMedia、监听系统偏好、改 html[data-theme]、整页墨迹擦过
  // 全在 core 的控制器里，和 Vue 那边是同一份
  const [controller, state] = useController(createDarkMode, {
    storageKey,
    autoMode,
    transition,
    value: model,
  });
  const isDark = state.isDark;

  // 同页多个实例时 SVG 滤镜 id 不能撞；React 的 useId 带非法字符，core 里会洗一遍
  const glowId = darkModeGlowId(useId());
  const fish = darkModeFish(isDark, glowId);
  const pathVars = darkModePathVars();

  // 下面两个 effect 是 Vue 那边两个 watch 的等价物：用"上一次的值"当闸门，值没变就不跑，
  // 两边才不会互相回灌。
  //
  // 注意两处都读 controller.getSnapshot()，不用渲染闭包里的 isDark：
  // connect() 是在本次提交更靠前的一个 effect 里跑的，那时闭包里这份还停在首帧的 false。
  // 拿它回写，就等于告诉下面那个 effect"使用方选了亮色"，两个 effect 会一直互相翻——
  // 本地记录是 dark 时直接死循环。Vue 的 watch 回调是在 flush 时读当前值，这里对齐它。
  const lastDark = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const current = controller.getSnapshot().isDark;
    if (lastDark.current === current) return;
    lastDark.current = current;
    // 控制器推出来的主题（本地记录 / 系统偏好 / 用户点击）是唯一真相，回写到开关值上
    if (model === current) return;
    if (!controlled) setUncontrolled(current);
    props.onDarkChange?.(current);
  });

  const lastModel = useRef(model);
  useEffect(() => {
    if (lastModel.current === model) return;
    lastModel.current = model;
    // 外部把 dark 改成别的值 → 落到 html
    if (model !== undefined && model !== controller.getSnapshot().isDark)
      void controller.set(model);
  });

  const onClick = async () => {
    if (disabled) return;
    const next = await controller.toggle();
    props.onChange?.(next);
  };

  return (
    <button
      type="button"
      className={[...darkModeClasses({ isDark, rotate, disabled }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...pathVars, ...props.style } as CSSProperties}
      role="switch"
      aria-checked={isDark}
      aria-label={darkModeLabel(isDark)}
      disabled={disabled}
      onClick={onClick}
    >
      <svg className="m-dark-mode__svg" viewBox="-10 -10 520 520" aria-hidden="true">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow className="m-dark-mode__glow" dx="0" dy="0" stdDeviation="20" />
          </filter>
        </defs>
        {/* 墨鱼：亮色收着，转暗摆尾 */}
        <path className="m-dark-mode__yin" d={fish.yin.d} filter={fish.yin.filter} />
        {/* 白鱼：转 180° 与墨鱼咬合，姿势和墨鱼相反 */}
        <path
          className="m-dark-mode__yang"
          transform="rotate(180 250 250)"
          d={fish.yang.d}
          filter={fish.yang.filter}
        />
        <path className="m-dark-mode__fins" d={fish.fins.d} />
        <circle className="m-dark-mode__eye m-dark-mode__eye--yin" cx="250" cy="375" r="40" />
        <circle className="m-dark-mode__eye m-dark-mode__eye--yang" cx="250" cy="125" r="40" />
      </svg>
    </button>
  );
}
