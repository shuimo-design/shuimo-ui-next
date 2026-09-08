<script setup lang="ts">
import { Transition } from "vue";
import { revealElement } from "../../ink/reveal";
import type { InkTransitionProps, InkTransitionSlots } from "./types";

defineOptions({ name: "MInkTransition" });

const {
  duration = 900,
  leaveDuration = 600,
  appear = false,
  mode = "default",
  seed,
  direction = "right",
  raggedness,
  softness,
  reducedMotion,
} = defineProps<InkTransitionProps>();
defineSlots<InkTransitionSlots>();

const mask = () => ({ seed, direction, raggedness, softness, reducedMotion });

function onEnter(el: Element, done: () => void) {
  const target = el as HTMLElement;
  target.style.visibility = "";
  void revealElement(target, { ...mask(), duration }).then(done);
}

function onLeave(el: Element, done: () => void) {
  void revealElement(el as HTMLElement, { ...mask(), duration: leaveDuration, reverse: true }).then(
    done,
  );
}

function onAfterLeave(el: Element) {
  (el as HTMLElement).style.visibility = "";
}
</script>

<template>
  <Transition
    :css="false"
    :appear="appear"
    :mode="mode === 'default' ? undefined : mode"
    @enter="onEnter"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>
