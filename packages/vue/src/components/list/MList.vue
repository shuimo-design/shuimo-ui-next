<script setup lang="ts" generic="T">
import { computed, onMounted, provide, ref } from "vue";
import {
  listInk,
  listItemActive,
  listItemText,
  type ListContextValue,
  type ListItemScope,
  type ListProps,
  type ListSlots,
} from "@shuimo-design/core";
import { listKey } from "./context";
import MListItem from "./MListItem.vue";

defineOptions({ name: "MList" });

// 必须直接解构 defineProps：先存成变量再解构，编译出来是 setup 期的一次性快照
const { data, marker = true, autoActive = false } = defineProps<ListProps<T>>();
defineSlots<ListSlots<T>>();

provide(
  listKey,
  computed<ListContextValue>(() => ({ marker })),
);

/**
 * 两团墨走素材登记，登记要往样式表插规则、服务端没有：
 * 首帧一律内联（registered=false），挂载后才升级成 data 属性，否则水合会报属性不匹配。
 */
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const ink = computed(() => listInk(mounted.value));

/**
 * 没有 data 时默认插槽不带作用域（使用者自己放 MListItem，不会去读 item）。
 * 插槽类型只声明了一种签名，这里用空对象顶上，免得模板类型检查报缺参。
 */
const emptyScope = {} as ListItemScope<T>;
</script>

<template>
  <ul class="m-list" :style="ink.style" v-bind="ink.attrs">
    <template v-if="data">
      <MListItem
        v-for="(item, index) in data"
        :key="index"
        :active="listItemActive(item, autoActive)"
      >
        <slot :item="item" :index="index">{{ listItemText(item) }}</slot>
      </MListItem>
    </template>
    <slot v-else v-bind="emptyScope" />
  </ul>
</template>
