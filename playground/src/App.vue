<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { MButton, MList, MListItem, MRicePaper } from "@shuimo-design/ui";
import { startInkViewTransition } from "@shuimo-design/ui/ink";
import ApiDoc from "./ApiDoc.vue";
import { ALL_DEMOS, DEMOS } from "./registry";

const dark = ref(false);
const seed = ref(42);

function readHash(): string {
  return location.hash.replace(/^#\/?/, "") || ALL_DEMOS[0]!.id;
}
const currentId = ref(readHash());
const current = computed(() => ALL_DEMOS.find((d) => d.id === currentId.value) ?? ALL_DEMOS[0]!);

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
  void startInkViewTransition(() => {
    seed.value++;
  });
}
</script>

<template>
  <MRicePaper :seed="seed" gold-flecks style="height: 100vh">
    <div class="pg">
      <aside class="pg__aside">
        <h1 class="pg__logo">水墨 <span>next</span></h1>
        <nav ref="nav" class="pg__nav">
          <template v-for="group in DEMOS" :key="group.group">
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
            <code class="pg__code">{{ current.name }}</code>
          </header>
          <component :is="current.component" />
          <!-- 示例底下挂上构建时生成的属性 / 事件 / 插槽表（docs/api/<组件名>.json） -->
          <ApiDoc :name="current.name" />
        </section>
      </main>
    </div>
  </MRicePaper>
</template>

<style scoped>
/* 整页定高、外层不滚，左右两栏各自竖向滚动；宣纸和远山留在底下当固定背景 */
.pg {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: 100vh;
}
.pg__aside {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100vh;
  padding: 24px 16px;
  border-right: 1px solid var(--m-divider);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pg__logo {
  margin: 0 8px 20px;
  font-family: var(--m-font-brush);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0.1em;
}
.pg__logo span {
  font-family: var(--m-font-sans);
  font-size: 12px;
  color: var(--m-fg-muted);
  letter-spacing: 0.2em;
  vertical-align: middle;
}
.pg__nav {
  flex: 1;
}
.pg__group {
  margin: 12px 8px 4px;
  font-size: 12px;
  color: var(--m-fg-muted);
  letter-spacing: 0.2em;
}
.pg__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--m-radius);
  cursor: var(--m-cursor-pointer);
  transition: background-color var(--m-duration) var(--m-ease);
}
.pg__item:hover {
  background: color-mix(in srgb, var(--m-ink) 6%, transparent);
}
/* 当前页：淡墨底 + 左侧一道朱砂，正文加重 */
.pg__item--active,
.pg__item--active:hover {
  background: color-mix(in srgb, var(--m-ink) 10%, transparent);
  box-shadow: inset 3px 0 0 var(--m-seal);
  color: var(--m-fg-strong);
  font-weight: 500;
}
.pg__item-name {
  font-size: 11px;
  color: var(--m-fg-muted);
  opacity: 0.7;
}
.pg__tools {
  display: flex;
  gap: 8px;
  padding-top: 16px;
}
.pg__main {
  box-sizing: border-box;
  height: 100vh;
  padding: 32px 40px;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.pg__page {
  max-width: 880px;
}
.pg__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}
.pg__title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}
.pg__code {
  font-size: 13px;
  color: var(--m-fg-muted);
}
</style>
