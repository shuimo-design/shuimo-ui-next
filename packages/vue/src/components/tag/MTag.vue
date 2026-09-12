<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  tagClasses,
  tagCloseInert,
  tagInk,
  TAG_CLOSE_LABEL,
  type TagEmits,
  type TagProps,
  type TagSlots,
} from "@shuimo-design/core";

defineOptions({ name: "MTag" });

const {
  type = "default",
  size = "md",
  color,
  closable = false,
  disabled = false,
  seed = 1,
} = defineProps<TagProps>();
const emit = defineEmits<TagEmits>();
defineSlots<TagSlots>();

// 素材登记要写样式表，服务端没有；首帧一律内联，挂载后才升级成 data 属性，否则水合会报属性不匹配
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const ink = computed(() => tagInk({ seed, color, registered: mounted.value }));

function onClose(event: MouseEvent) {
  // 关闭是标签内部的事，不该顺带触发外层的 click
  event.stopPropagation();
  if (tagCloseInert({ disabled })) return;
  emit("close", event);
}
</script>

<template>
  <span
    :class="tagClasses({ type, size, disabled })"
    :style="ink.style"
    v-bind="ink.attrs"
    @click="emit('click', $event)"
  >
    <span class="m-tag__label"><slot /></span>
    <button
      v-if="closable"
      type="button"
      class="m-tag__close"
      :aria-label="TAG_CLOSE_LABEL"
      :disabled="disabled"
      @click="onClose"
    >
      <span class="m-tag__cross" aria-hidden="true" />
    </button>
  </span>
</template>
