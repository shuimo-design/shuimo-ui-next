import { onMounted, type Directive, type Ref } from "vue";
import { revealElement, type InkRevealOptions } from "@shuimo-design/core/ink";

/** 挂载后自动擦入 */
export function useInkReveal(target: Ref<HTMLElement | null>, options: InkRevealOptions = {}) {
  onMounted(() => {
    if (target.value) void revealElement(target.value, options);
  });
}

/** v-ink-reveal / v-ink-reveal="{ duration: 600, direction: 'down' }" */
export const vInkReveal: Directive<HTMLElement, InkRevealOptions | undefined> = {
  mounted(el, binding) {
    void revealElement(el, binding.value ?? {});
  },
};
