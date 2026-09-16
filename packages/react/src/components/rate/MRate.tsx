import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  alignRateValue,
  createRate,
  rateClasses,
  rateDisplayValue,
  rateGroupAria,
  rateItemAria,
  rateItemClasses,
  rateItemHovered,
  rateItemInk,
  rateItems,
  rateItemState,
  rateTabIndex,
  rateText,
  type RateCharacterScope,
  type RateProps as CoreRateProps,
} from "@shuimo-design/core";
import { useDisabled, useFormItem } from "../../internal/form-item";
import { useController } from "../../runtime";

export interface MRateProps extends CoreRateProps {
  /** 受控值；不传就由组件自己记（配合 defaultValue） */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** 点击或键盘落定的新值 */
  onChange?: (value: number) => void;
  /** 悬停预览值变化；指针离开时为 0 */
  onHoverChange?: (value: number) => void;
  /** 自定义每一格的图形（对应 Vue 的 character 插槽）；不给就是墨点 */
  renderCharacter?: (scope: RateCharacterScope) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MRate(props: MRateProps) {
  const {
    count = 5,
    allowHalf = false,
    allowClear = true,
    disabled: disabledProp = false,
    readonly = false,
    size = "md",
    texts,
    seed = 1,
    renderCharacter,
  } = props;

  // 上下文形状在 core（context/form-item.ts），这两行只是 React 的 useContext 胶水
  const formItem = useFormItem();
  const disabled = useDisabled(disabledProp);

  const controlled = props.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(props.defaultValue ?? 0);
  const model = controlled ? props.value : uncontrolled;

  const geometry = { count, allowHalf };
  /** 对齐到步长的绑定值 */
  const value = alignRateValue(model, geometry);
  const items = rateItems(count);

  // 悬停预览、点击落值 / 清零、键盘调值和焦点停靠点全在 core 的控制器里，和 Vue 那边是同一份
  const [rate, state] = useController(createRate, {
    ...geometry,
    disabled,
    readonly,
    allowClear,
    value,
    onChange: (next: number) => {
      if (!controlled) setUncontrolled(next);
      props.onValueChange?.(next);
      props.onChange?.(next);
      formItem.validate("change");
    },
    onHoverChange: (next: number) => props.onHoverChange?.(next),
  });

  // ref 回调的身份必须稳定：变了 React 会先 ref(null) 再 ref(node)，控制器手里的元素会来回换
  const itemRefs = useMemo(
    () => items.map((index) => (el: HTMLElement | null) => rate.setItem(index, el)),
    // 格数变了才重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rate, items.length],
  );

  /** 画面上显示的值：有悬停预览就是预览值 */
  const display = rateDisplayValue(value, state.hover);
  const text = rateText(texts, display);

  const character = (scope: RateCharacterScope): ReactNode =>
    renderCharacter ? renderCharacter(scope) : <span className="m-rate__dot" />;

  return (
    <div
      id={formItem.id}
      className={[...rateClasses({ size, disabled, readonly, allowHalf }), props.className]
        .filter(Boolean)
        .join(" ")}
      style={props.style}
      {...rateGroupAria(value, { count, disabled, readonly, texts })}
      onPointerLeave={() => rate.onPointerLeave()}
    >
      {items.map((index) => {
        const itemState = rateItemState(index, display);
        return (
          <span
            key={index}
            ref={itemRefs[index]}
            className={rateItemClasses({
              state: itemState,
              hovered: rateItemHovered(index, state.hover),
            }).join(" ")}
            style={rateItemInk(seed, index) as CSSProperties}
            tabIndex={rateTabIndex(index, value, { disabled })}
            {...rateItemAria(index, value, { count, texts })}
            onPointerMove={(event: PointerEvent<HTMLElement>) =>
              rate.onPointerMove(index, event.nativeEvent)
            }
            onClick={(event: MouseEvent<HTMLElement>) => rate.onClick(index, event.nativeEvent)}
            onKeyDown={(event: KeyboardEvent<HTMLElement>) =>
              rate.onKeyDown(index, event.nativeEvent)
            }
          >
            {/* 底层画整格：满格才是选中态 */}
            <span
              className={["m-rate__char", itemState === "full" ? "m-rate__char--active" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              {character({ index, active: itemState === "full" })}
            </span>
            {/* 半格：再叠一层选中态、只露左半 */}
            {itemState === "half" ? (
              <span
                className="m-rate__char m-rate__char--active m-rate__char--half"
                aria-hidden="true"
              >
                {character({ index, active: true })}
              </span>
            ) : null}
          </span>
        );
      })}
      {text ? <span className="m-rate__text">{text}</span> : null}
    </div>
  );
}
