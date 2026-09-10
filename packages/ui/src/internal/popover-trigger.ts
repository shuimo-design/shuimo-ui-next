/**
 * Popover / Tooltip 共用的触发逻辑：找参照元素、按触发方式开合、延时、Escape 与外部点击。
 * 定位交给 MPopper，这里只管「什么时候开、什么时候关」。
 */
import { useEventListener } from "@vueuse/core";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  watch,
  type Ref,
  type ShallowRef,
} from "vue";

export type PopoverTrigger = "hover" | "click" | "focus" | "manual";

export interface PopoverTriggerOptions {
  trigger: () => PopoverTrigger;
  disabled: () => boolean;
  openDelay: () => number;
  closeDelay: () => number;
  disableClickAway: () => boolean;
  /** 显隐状态（v-model:show） */
  show: Ref<boolean>;
  /** 包住触发内容的壳；它的第一个元素子节点当参照，没有就用壳自己 */
  wrapper: Readonly<ShallowRef<HTMLElement | null>>;
  /** 浮层容器，用来判断焦点 / 指针是不是还在浮层里 */
  panel: Readonly<ShallowRef<HTMLElement | null>>;
  onChange?: (open: boolean) => void;
}

export function usePopoverTrigger(options: PopoverTriggerOptions) {
  const reference = shallowRef<HTMLElement | null>(null);
  /** 壳里没有元素（纯文本）时壳自己当参照，此时壳要有盒子 */
  const wrapOnly = shallowRef(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = computed(() => options.show.value && !options.disabled());
  const is = (kind: PopoverTrigger) => options.trigger() === kind;

  function pickReference() {
    const el = options.wrapper.value;
    if (!el) return;
    const first = el.firstElementChild;
    reference.value = first instanceof HTMLElement ? first : el;
    wrapOnly.value = reference.value === el;
  }

  function setOpen(next: boolean) {
    clearTimeout(timer);
    if (next && options.disabled()) return;
    if (options.show.value === next) return;
    options.show.value = next;
    options.onChange?.(next);
  }

  function schedule(next: boolean) {
    clearTimeout(timer);
    const delay = next ? options.openDelay() : options.closeDelay();
    if (delay <= 0) {
      setOpen(next);
      return;
    }
    timer = setTimeout(() => setOpen(next), delay);
  }

  function inside(target: EventTarget | null) {
    return (
      target instanceof Node &&
      (options.panel.value?.contains(target) === true || reference.value?.contains(target) === true)
    );
  }

  function onTriggerEnter() {
    if (is("hover")) schedule(true);
  }
  function onTriggerLeave() {
    if (is("hover")) schedule(false);
  }
  function onTriggerClick() {
    if (is("click")) setOpen(!options.show.value);
  }
  function onTriggerFocusin(event: FocusEvent) {
    if (is("focus")) schedule(true);
    // hover 触发也响应键盘聚焦，不然键盘用户永远看不到提示；鼠标点出来的焦点不算
    else if (
      is("hover") &&
      event.target instanceof Element &&
      event.target.matches(":focus-visible")
    )
      schedule(true);
  }
  function onTriggerFocusout(event: FocusEvent) {
    if ((is("focus") || is("hover")) && !inside(event.relatedTarget)) schedule(false);
  }
  function onPanelEnter() {
    if (is("hover")) clearTimeout(timer);
  }
  function onPanelLeave() {
    if (is("hover")) schedule(false);
  }
  function onPanelFocusout(event: FocusEvent) {
    if (is("focus") && !inside(event.relatedTarget)) schedule(false);
  }
  function onClickOutside() {
    if (is("click") && !options.disableClickAway()) setOpen(false);
  }

  // Escape 关闭：焦点可能在页面任何地方，所以听 document
  useEventListener(
    () => (typeof document === "undefined" ? null : document),
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open.value || is("manual")) return;
      setOpen(false);
    },
  );

  watch(
    () => options.disabled(),
    (disabled) => {
      if (!disabled) return;
      clearTimeout(timer);
      if (options.show.value) setOpen(false);
    },
  );

  onMounted(pickReference);
  onUpdated(pickReference);
  onBeforeUnmount(() => clearTimeout(timer));

  return {
    reference,
    wrapOnly,
    open,
    setOpen,
    onTriggerEnter,
    onTriggerLeave,
    onTriggerClick,
    onTriggerFocusin,
    onTriggerFocusout,
    onPanelEnter,
    onPanelLeave,
    onPanelFocusout,
    onClickOutside,
  };
}
