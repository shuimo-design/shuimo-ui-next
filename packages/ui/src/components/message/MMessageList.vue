<script setup lang="ts">
// 某个方向的消息队列容器；由 api.ts 按需挂到 body 上，不对外导出
import { ref, type ComponentPublicInstance } from "vue";
import MMessage from "./MMessage.vue";
import type { MessageEntry, MessageListExposed } from "./internal";
import type { MessageDirection } from "./types";

defineOptions({ name: "MMessageList" });

const { direction } = defineProps<{ direction: MessageDirection }>();

const items = ref<MessageEntry[]>([]);
/** 每条消息的组件实例，用来从外面触发它的离场动画 */
const instances = new Map<number, InstanceType<typeof MMessage>>();

function setInstance(id: number, el: Element | ComponentPublicInstance | null) {
  if (el && !(el instanceof Element)) instances.set(id, el as InstanceType<typeof MMessage>);
  else instances.delete(id);
}

function add(entry: MessageEntry) {
  items.value.push(entry);
}

function close(id: number) {
  instances.get(id)?.close();
}

function closeAll() {
  for (const item of items.value) close(item.id);
}

function onClose(entry: MessageEntry) {
  items.value = items.value.filter((item) => item.id !== entry.id);
  entry.onClosed();
}

defineExpose<MessageListExposed>({ add, close, closeAll });
</script>

<template>
  <div
    class="m-message-list"
    :class="`m-message-list--${direction}`"
    role="region"
    aria-live="polite"
    aria-label="消息"
  >
    <MMessage
      v-for="item in items"
      :key="item.id"
      :ref="(el) => setInstance(item.id, el)"
      v-bind="item.props"
      :direction="direction"
      @close="onClose(item)"
    />
  </div>
</template>
