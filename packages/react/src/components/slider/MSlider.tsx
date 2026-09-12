import { useCallback, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  createSlider,
  sliderClasses,
  sliderInkStyle,
  sliderPercentText,
  sliderTabIndex,
  sliderThumbAria,
  sliderThumbLeft,
  sliderTooltipText,
  sliderTrackStyle,
  sliderValues,
  type SliderProps as CoreSliderProps,
  type SliderValue,
} from "@shuimo-design/core";
import { useController } from "../../runtime";

export interface MSliderProps extends CoreSliderProps {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: SliderValue;
  defaultValue?: SliderValue;
  onValueChange?: (value: SliderValue) => void;
  /** 拖动过程中每次值变化 */
  onInput?: (value: SliderValue) => void;
  /** 松手 / 键盘调整后的最终值 */
  onChange?: (value: SliderValue) => void;
  className?: string;
  style?: CSSProperties;
}

export function MSlider(props: MSliderProps) {
  const {
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    range = false,
    showInfo = false,
    showTooltip = true,
    formatTooltip,
  } = props;

  const controlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<SliderValue | undefined>(props.defaultValue);
  const model = controlled ? props.value : uncontrolled;

  const geometry = { min, max, step, range };
  /** 当前各把手的值：单把手一项，range 两项且已排好序 */
  const values = sliderValues(model, geometry);

  // 步长对齐、按坐标折算值、最近把手、七个键的增减、拖拽状态全在 core 的控制器里，
  // 和 Vue 那边是同一份
  const [slider, state] = useController(createSlider, {
    ...geometry,
    disabled,
    values,
    onInput: (value: SliderValue) => {
      if (!controlled) setUncontrolled(value);
      props.onValueChange?.(value);
      props.onInput?.(value);
    },
    onChange: (value: SliderValue) => props.onChange?.(value),
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的元素会来回换
  const bodyRef = useCallback((el: HTMLElement | null) => slider.setBody(el), [slider]);
  const railRef = useCallback((el: HTMLElement | null) => slider.setRail(el), [slider]);
  // 最多两个把手，两个 ref 回调一次建好按下标取
  const thumbRefs = useMemo(
    () => [0, 1].map((index) => (el: HTMLElement | null) => slider.setThumb(index, el)),
    [slider],
  );

  const inkStyle = sliderInkStyle();

  return (
    <div
      className={[...sliderClasses({ disabled, range }), props.className].filter(Boolean).join(" ")}
      style={{ ...inkStyle, ...props.style } as CSSProperties}
    >
      {showInfo ? (
        <div className="m-slider__info">
          <span className="m-slider__min">{min}</span>
          <span className="m-slider__percent">{sliderPercentText(values, geometry)}</span>
          <span className="m-slider__max">{max}</span>
        </div>
      ) : null}
      <div
        ref={bodyRef}
        className="m-slider__body"
        onPointerDown={(event) => slider.onPointerDown(event.nativeEvent)}
        onPointerMove={(event) => slider.onPointerMove(event.nativeEvent)}
        onPointerUp={(event) => slider.onPointerUp(event.nativeEvent)}
        onPointerCancel={(event) => slider.onPointerUp(event.nativeEvent)}
      >
        {/* 珠子放在轨道外面：轨道套了笔触遮罩，放在里面会被一起裁掉 */}
        <div ref={railRef} className="m-slider__rail">
          <div
            className="m-slider__track"
            style={sliderTrackStyle(values, geometry) as CSSProperties}
          />
        </div>
        {values.map((value, index) => (
          <div
            key={index}
            ref={thumbRefs[index]}
            className={["m-slider__thumb", state.active === index ? "m-slider__thumb--active" : ""]
              .filter(Boolean)
              .join(" ")}
            style={sliderThumbLeft(value, geometry) as CSSProperties}
            data-index={index}
            tabIndex={sliderTabIndex(disabled)}
            {...sliderThumbAria(index, values, { ...geometry, disabled, formatTooltip })}
            onKeyDown={(event: KeyboardEvent<HTMLElement>) =>
              slider.onKeyDown(index, event.nativeEvent)
            }
          >
            {showTooltip ? (
              <div className="m-slider__tooltip" aria-hidden="true">
                {sliderTooltipText(value, formatTooltip)}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
