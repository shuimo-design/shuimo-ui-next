<script setup lang="ts">
import "./list.css";
import { computed, inject } from "vue";
import { listKey } from "./context";
import type { ListItemEmits, ListItemProps, ListItemSlots } from "./types";

defineOptions({ name: "MListItem" });

// marker 默认 undefined 是为了绕开 Boolean 转型（不传会变 false），这样才能区分"没传"去跟随 MList
const { active = false, marker = undefined } = defineProps<ListItemProps>();
const emit = defineEmits<ListItemEmits>();
defineSlots<ListItemSlots>();

const list = inject(listKey, undefined);
const showMarker = computed(() => marker ?? list?.marker.value ?? true);
</script>

<template>
  <li
    class="m-list-item"
    :class="{ 'm-list-item--active': active, 'm-list-item--marker': showMarker }"
    @click="emit('click', $event)"
  >
    <!-- 项目符号：一粒墨点；激活时外面再套一圈墨，点换成朱砂 -->
    <span v-if="showMarker" class="m-list-item__marker" aria-hidden="true" />
    <span class="m-list-item__inner"><slot /></span>
  </li>
</template>
