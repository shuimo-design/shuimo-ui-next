<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  avatarClasses,
  avatarVars,
  type AvatarEmits,
  type AvatarProps,
  type AvatarSlots,
} from "@shuimo-design/core";
import { IconUser } from "../../icons";

defineOptions({ name: "MAvatar" });

const props = defineProps<AvatarProps>();
const emit = defineEmits<AvatarEmits>();
defineSlots<AvatarSlots>();

const failed = ref(false);
// 换了图片地址就重新尝试加载
watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);

const showImage = computed(() => Boolean(props.src) && !failed.value);

function onError(event: Event) {
  failed.value = true;
  emit("error", event);
}
</script>

<template>
  <span
    :class="avatarClasses(props)"
    :style="avatarVars(props)"
    :role="showImage ? undefined : 'img'"
    :aria-label="showImage ? undefined : props.alt"
  >
    <span class="m-avatar__body">
      <img
        v-if="showImage"
        class="m-avatar__img"
        :src="props.src"
        :alt="props.alt"
        @error="onError"
      />
      <span v-else class="m-avatar__fallback">
        <slot><IconUser class="m-avatar__icon" /></slot>
      </span>
    </span>
    <span class="m-avatar__frame" aria-hidden="true" />
  </span>
</template>
