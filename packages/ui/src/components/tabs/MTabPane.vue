<script setup lang="ts">
import "./tabs.css";
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import { paneElementId, tabElementId, tabsKey } from "./context";
import type { TabPaneProps, TabPaneSlots } from "./types";

defineOptions({ name: "MTabPane" });

// closable 默认 undefined 是为了绕开 Boolean 转型（不传会变 false），这样才能区分"没传"去跟随 MTabs
const {
  name,
  label,
  disabled = false,
  closable = undefined,
  lazy = false,
} = defineProps<TabPaneProps>();
const slots = defineSlots<TabPaneSlots>();

const tabs = inject(tabsKey, undefined);
const uid = useId();
/** 没给 name 时用生成的 id 顶上 */
const key = computed(() => name ?? uid);
const root = useTemplateRef<HTMLElement>("root");

// 不在 MTabs 里时没有人切换它，就当一直激活，至少内容能看见
const active = computed(() => (tabs ? tabs.isActive(key.value) : true));

/** lazy 时记住"已经激活过"，之后切走只隐藏不销毁 */
const rendered = ref(!lazy);
watch(
  active,
  (value) => {
    if (value) rendered.value = true;
  },
  { immediate: true },
);

tabs?.register({
  uid,
  name: () => key.value,
  label: () => label,
  labelSlot: () => slots.label,
  disabled: () => disabled,
  closable: () => closable,
  el: () => root.value,
});
onMounted(() => tabs?.reorder());
onBeforeUnmount(() => tabs?.unregister(uid));
</script>

<template>
  <div
    v-show="active"
    :id="paneElementId(uid)"
    ref="root"
    class="m-tab-pane"
    role="tabpanel"
    :aria-labelledby="tabElementId(uid)"
    :aria-hidden="!active"
  >
    <slot v-if="rendered" />
  </div>
</template>
