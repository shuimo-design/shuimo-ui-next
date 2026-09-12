<script setup lang="ts">
import { computed, inject } from "vue";
import {
  listItemClasses,
  resolveListMarker,
  type ListItemEmits,
  type ListItemProps,
  type ListItemSlots,
} from "@shuimo-design/core";
import { listKey } from "./context";

defineOptions({ name: "MListItem" });

// marker 默认 undefined 是为了绕开 Boolean 转型（不传会变 false），这样才能区分"没传"去跟随 MList
const { active = false, marker = undefined } = defineProps<ListItemProps>();
const emit = defineEmits<ListItemEmits>();
defineSlots<ListItemSlots>();

const list = inject(listKey, undefined);
const showMarker = computed(() => resolveListMarker(marker, list?.value));
const classes = computed(() => listItemClasses({ active, marker: showMarker.value }));
</script>

<template>
  <li :class="classes" @click="emit('click', $event)">
    <!-- 项目符号：一粒墨点；激活时外面再套一圈墨，点换成朱砂 -->
    <span v-if="showMarker" class="m-list-item__marker" aria-hidden="true" />
    <span class="m-list-item__inner"><slot /></span>
  </li>
</template>
