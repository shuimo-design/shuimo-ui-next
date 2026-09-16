<script setup lang="ts">
import { computed } from "vue";
import {
  sealColophonClasses,
  sealColophonStampProps,
  type SealColophonProps,
  type SealColophonSlots,
} from "@shuimo-design/core";
import { MStamp } from "../stamp";

defineOptions({ name: "MSealColophon" });

const {
  author,
  text,
  date,
  seal,
  sealShape,
  sealMode,
  sealSize,
  align = "right",
  vertical = false,
  seed,
} = defineProps<SealColophonProps>();
defineSlots<SealColophonSlots>();

/** 转型过的这份 props 才是 core 的输入；印文默认值、种子默认值都在 core 里定 */
const props = computed<SealColophonProps>(() => ({
  author,
  text,
  date,
  seal,
  sealShape,
  sealMode,
  sealSize,
  align,
  vertical,
  seed,
}));
const stamp = computed(() => sealColophonStampProps(props.value));
</script>

<template>
  <div :class="sealColophonClasses(props)">
    <p class="m-seal-colophon__text">
      <slot>
        <span v-if="text" class="m-seal-colophon__note">{{ text }}</span>
        <span class="m-seal-colophon__author">{{ author }}</span>
        <span v-if="date" class="m-seal-colophon__date">{{ date }}</span>
      </slot>
    </p>
    <span class="m-seal-colophon__seal">
      <slot name="seal">
        <MStamp
          :text="stamp.text"
          :shape="stamp.shape"
          :mode="stamp.mode"
          :size="stamp.size"
          :seed="stamp.seed"
        />
      </slot>
    </span>
  </div>
</template>
