<script setup lang="ts">
import { ref, watch } from "vue";
import type { DemoSource } from "../shared/catalog";

/**
 * 示例底下的源码区。默认收起，第一次展开才去拉这一份高亮好的源码 ——
 * 47 份一起打进主包能把它撑到 2 MB，而多数人根本不会展开。
 * React 版（src/react/DemoSource.tsx）是同一套结构和同一份样式。
 */
const { load, file } = defineProps<{ load: () => Promise<DemoSource>; file: string }>();

const source = ref<DemoSource>();
const open = ref(false);
const copied = ref(false);

// 换了组件页就收回去、把上一页的源码丢掉，不然翻页会看到别人的代码
watch(
  () => file,
  () => {
    open.value = false;
    copied.value = false;
    source.value = undefined;
  },
);

async function toggle() {
  if (!open.value) source.value ??= await load();
  open.value = !open.value;
}

async function copy() {
  if (!source.value) return;
  await navigator.clipboard.writeText(source.value.code);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <section class="src">
    <div class="src__bar">
      <button class="src__btn" type="button" @click="toggle">
        {{ open ? "收起代码" : "查看代码" }}
      </button>
      <code class="src__file">{{ file }}</code>
      <button v-if="open" class="src__btn" type="button" @click="copy">
        {{ copied ? "已复制" : "复制" }}
      </button>
    </div>
    <!-- html 是构建期由 shiki 对仓库自己的示例文件生成的，不含任何用户输入 -->
    <div v-if="open && source" class="src__code" v-html="source.html" />
  </section>
</template>
