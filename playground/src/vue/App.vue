<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import type { Component } from "vue";
import { MButton, MList, MListItem, MOverlayOutlet, MRicePaper } from "@shuimo-design/vue";
import { startInkViewTransition } from "@shuimo-design/core/ink";
import ApiDoc from "./ApiDoc.vue";
import DemoSource from "./DemoSource.vue";
import type { DemoSource as Source } from "../shared/catalog";
import { ALL_DEMOS, CATALOG, assertComplete, fileOf, readHash } from "../shared/catalog";

/**
 * Vue 版文档站的外壳。React 版（src/react/App.tsx）是同一套结构、同一份样式、同一份清单，
 * 只是用 React 写的 —— 两边各自独立成站，谁都不寄生在对方的应用里。
 */

// 按清单把 demos/ 下的示例对上号；少一个就直接炸，不要静默少一页
const modules = import.meta.glob<Component>("./demos/*Demo.vue", {
  eager: true,
  import: "default",
});
const demos: Record<string, Component> = {};
for (const meta of ALL_DEMOS) {
  const found = modules[`./demos/${fileOf(meta.id)}.vue`];
  if (found) demos[meta.id] = found;
}
assertComplete(demos, "demos", ".vue");

// 同一批文件再取一次源码：`?highlight` 让构建期把高亮做完（见 vite.config.ts）。
// **不能 eager**：47 份高亮好的 HTML 一起打进主包会让它从 306 KB 涨到 2 MB（gzip 98 → 196 KB），
// 而代码区默认是收起的，多数人根本不会展开。改成按需加载，点开哪个才拉哪个
const rawSources = import.meta.glob<Source>("./demos/*Demo.vue", {
  query: "?highlight",
  import: "default",
});
const sources: Record<string, () => Promise<Source>> = {};
for (const meta of ALL_DEMOS) {
  const found = rawSources[`./demos/${fileOf(meta.id)}.vue`];
  if (found) sources[meta.id] = found;
}

const dark = ref(false);
const seed = ref(42);

const currentId = ref(readHash());
const current = computed(() => ALL_DEMOS.find((d) => d.id === currentId.value) ?? ALL_DEMOS[0]!);
/** 去 React 版的同一个组件页，换框架不丢位置 */
const otherSide = computed(() => `../react/#/${currentId.value}`);

// 左右两栏各自滚动，切页时只把右栏拉回顶部；左栏把当前项滚进可视区（直接带 hash 打开时也能看到选中项）
const main = useTemplateRef<HTMLElement>("main");
const nav = useTemplateRef<HTMLElement>("nav");

function onHashChange() {
  currentId.value = readHash();
}
function go(id: string) {
  if (id === currentId.value) return;
  location.hash = `#/${id}`;
}

function revealActive() {
  nav.value?.querySelector(".pg__item--active")?.scrollIntoView({ block: "nearest" });
}

watch(currentId, () => {
  main.value?.scrollTo({ top: 0 });
  void nextTick(revealActive);
});

onMounted(() => {
  window.addEventListener("hashchange", onHashChange);
  revealActive();
});
onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));

function toggleDark() {
  dark.value = !dark.value;
  document.documentElement.dataset.theme = dark.value ? "dark" : "light";
}

function nextPaperWithTransition() {
  // 必须等 DOM 真的换完再让浏览器截新状态的图，否则转场拍到的还是旧那张纸
  void startInkViewTransition(async () => {
    seed.value++;
    await nextTick();
  });
}
</script>

<template>
  <MRicePaper :seed="seed" gold-flecks style="height: 100vh">
    <div class="pg">
      <aside class="pg__aside">
        <h1 class="pg__logo">水墨 <span>next</span></h1>
        <p class="pg__flavor">
          <span class="pg__flavor-cur">Vue</span>
          <a class="pg__flavor-alt" :href="otherSide">看 React 版 →</a>
        </p>
        <nav ref="nav" class="pg__nav">
          <template v-for="group in CATALOG" :key="group.group">
            <p class="pg__group">{{ group.group }}</p>
            <MList :marker="false">
              <MListItem
                v-for="item in group.items"
                :key="item.id"
                :active="item.id === currentId"
                class="pg__item"
                :class="{ 'pg__item--active': item.id === currentId }"
                @click="go(item.id)"
              >
                {{ item.title }}
                <span class="pg__item-name">{{ item.name }}</span>
              </MListItem>
            </MList>
          </template>
        </nav>
        <div class="pg__tools">
          <MButton @click="toggleDark">{{ dark ? "转亮" : "转暗" }}</MButton>
          <MButton @click="nextPaperWithTransition">换纸</MButton>
        </div>
      </aside>

      <main ref="main" class="pg__main">
        <!-- 切换不做转场，直接换页；落墨转场只在 MInkTransition 自己的示例页里演示 -->
        <section :key="current.id" class="pg__page">
          <header class="pg__header">
            <h2 class="pg__title">{{ current.title }}</h2>
            <code v-if="current.name" class="pg__code">{{ current.name }}</code>
          </header>
          <component :is="demos[current.id]" />
          <!-- 指南这类页面不讲某个组件，既没有源码可看也没有 API 表 -->
          <DemoSource
            v-if="current.name"
            :load="sources[current.id]!"
            :file="`${fileOf(current.id)}.vue`"
          />
          <!-- 示例底下挂上构建时生成的属性 / 事件 / 插槽表（docs/api/<组件名>.json） -->
          <ApiDoc :names="current.name ? [current.name, ...(current.parts ?? [])] : []" />
        </section>
      </main>
    </div>
    <!-- 函数式的消息 / 确认框现在渲染在用户自己的树里，要有这个出口才弹得出来（MConfigProvider 自带一个） -->
    <MOverlayOutlet />
  </MRicePaper>
</template>
