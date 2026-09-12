<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, shallowRef } from "vue";
import {
  confirm as defaultConfirmQueue,
  message as defaultMessageQueue,
  messageGroups,
  type ConfirmQueue,
  type ConfirmQueueSnapshot,
  type MessageQueue,
  type MessageQueueSnapshot,
  type OverlayOutletProps,
} from "@shuimo-design/core";
import MConfirm from "../confirm/MConfirm.vue";
import MMessageList from "../message/MMessageList.vue";

/**
 * 函数式弹层的渲染出口。
 *
 * 旧版的 `MMessage.success(...)` 是自己往 body 上手挂一棵 Vue 树的，为此还要靠
 * `useMessage()` 偷记一份 appContext —— React 里没有对等物，那条路走不通。
 * 现在队列在 core，消息和确认框由这个组件渲染在**用户自己的组件树里**：
 * 读得到用户的 provider、DevTools 看得见、不用再借上下文。
 * 代价是用户必须在树里放一个出口（`<MConfigProvider>` 自带，或者自己放一个这个）。
 *
 * DOM 还是传送到 body：消息列表是 fixed 定位的，留在原地会被祖先的 transform 困住。
 * 传送只挪 DOM，组件树上的父子关系不变，provide / inject 照常。
 */
// 出口有多个根节点（消息列表 + 确认框），透传属性没有唯一的落点
defineOptions({ name: "MOverlayOutlet", inheritAttrs: false });

const { messages = defaultMessageQueue, confirms = defaultConfirmQueue } =
  defineProps<OverlayOutletProps>();

// 弹层一律不进服务端 HTML，挂载后才渲染；快照初值用服务端那份（恒为空、引用恒定）
const mounted = ref(false);
const messageSnapshot = shallowRef<MessageQueueSnapshot>(messages.getServerSnapshot());
const confirmSnapshot = shallowRef<ConfirmQueueSnapshot>(confirms.getServerSnapshot());

onMounted(() => {
  mounted.value = true;
  const stops = [
    messages.subscribe(() => (messageSnapshot.value = messages.getSnapshot())),
    confirms.subscribe(() => (confirmSnapshot.value = confirms.getSnapshot())),
    messages.attachOutlet(),
    confirms.attachOutlet(),
  ];
  // 订阅之前可能已经有人 show 过了，补读一次
  messageSnapshot.value = messages.getSnapshot();
  confirmSnapshot.value = confirms.getSnapshot();
  onScopeDispose(() => {
    for (const stop of stops) stop();
  });
});

const groups = computed(() => messageGroups(messageSnapshot.value));
const current = computed(() => confirmSnapshot.value.current);
</script>

<template>
  <template v-if="mounted">
    <Teleport to="body">
      <MMessageList
        v-for="group in groups"
        :key="group.direction"
        :direction="group.direction"
        :items="group.items"
        :on-remove="messages.remove"
      />
    </Teleport>
    <MConfirm
      v-if="current"
      :key="current.id"
      v-bind="current.props"
      :open="current.open"
      @confirm="confirms.settle(current.id, true)"
      @cancel="confirms.settle(current.id, false)"
      @closed="confirms.remove(current.id)"
    />
  </template>
</template>
